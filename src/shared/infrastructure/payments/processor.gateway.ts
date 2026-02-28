import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createHash } from 'crypto';
import paymentConfig from './processor.config';
import type {
  PaymentGatewayPort,
  PaymentGatewayResponse,
} from '../../domain/ports';

const readString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;
const readObject = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
const getMaskedCard = (cardNumber: string): string =>
  `${'*'.repeat(Math.max(0, cardNumber.length - 4))}${cardNumber.slice(-4)}`;

const isNetworkError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as NodeJS.ErrnoException)?.code;
  return (
    msg.includes('fetch failed') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ENETUNREACH') ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT' ||
    code === 'ENETUNREACH'
  );
};

const USER_FRIENDLY_NETWORK_ERROR =
  'No se pudo conectar con el servicio de pagos. Verifica tu conexión o inténtalo más tarde.';

@Injectable()
export class ProcessorGateway implements PaymentGatewayPort {
  private readonly logger = new Logger(ProcessorGateway.name);

  constructor(
    @Inject(paymentConfig.KEY)
    private readonly processorConfig: ConfigType<typeof paymentConfig>,
  ) {}

  private buildUrl(path: string) {
    return `${this.processorConfig.baseUrl.replace(/\/$/, '')}${path}`;
  }

  private createSignature(reference: string, amountInCents: number, currency: string) {
    const raw = `${reference}${amountInCents}${currency}${this.processorConfig.integrityKey}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  private async createCardToken(input: {
    cardNumber: string;
    cvc: string;
    expMonth: string;
    expYear: string;
    cardHolder: string;
  }) {
    const response = await fetch(this.buildUrl(this.processorConfig.tokenizePath), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.processorConfig.publicKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: input.cardNumber,
        cvc: input.cvc,
        exp_month: input.expMonth,
        exp_year: input.expYear,
        card_holder: input.cardHolder,
      }),
    });
    const json = (await response.json()) as Record<string, unknown>;
    const token = readString(readObject(json.data).id);
    if (!response.ok || !token) {
      throw new Error(readString(json.error, 'Card tokenization failed'));
    }
    return token;
  }

  private async getAcceptanceToken() {
    const merchantsPath = this.processorConfig.merchantsPath.replace(
      '{{publicKey}}',
      this.processorConfig.publicKey,
    );
    const response = await fetch(this.buildUrl(merchantsPath));
    const json = (await response.json()) as Record<string, unknown>;
    const acceptanceToken = readString(
      readObject(readObject(json.data).presigned_acceptance).acceptance_token,
    );
    if (!response.ok || !acceptanceToken) {
      throw new Error(readString(json.error, 'Acceptance token retrieval failed'));
    }
    return acceptanceToken;
  }

  /** GET transaction by external id; returns { status, id } from data. */
  private async getTransactionStatus(externalId: string): Promise<{ status: string; id: string }> {
    const path = this.processorConfig.transactionByIdPath.replace('{{id}}', externalId);
    const response = await fetch(this.buildUrl(path), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.processorConfig.privateKey}`,
        'Content-Type': 'application/json',
      },
    });
    const json = (await response.json()) as Record<string, unknown>;
    const data = readObject(json.data);
    const status = String((data.status as string | undefined) ?? 'ERROR');
    const id = readString(data.id);
    return { status, id: id || externalId };
  }

  private async pollUntilTerminal(
    externalId: string,
    reference: string,
    safeRaw: { status: string; transactionId: string; maskedCard: string },
  ): Promise<PaymentGatewayResponse> {
    const interval = this.processorConfig.pollIntervalMs ?? 2000;
    const maxAttempts = this.processorConfig.pollMaxAttempts ?? 15;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, interval));
      const { status } = await this.getTransactionStatus(externalId);
      const raw = { ...safeRaw, status };
      if (status === 'APPROVED') {
        this.logger.log(`Poll resolved APPROVED reference=${reference} after ${attempt + 1} attempt(s)`);
        return { status: 'APPROVED', externalId, externalStatus: status, raw };
      }
      if (status === 'DECLINED') {
        this.logger.log(`Poll resolved DECLINED reference=${reference} after ${attempt + 1} attempt(s)`);
        return {
          status: 'DECLINED',
          externalId,
          externalStatus: status,
          message: 'Payment declined by gateway',
          raw,
        };
      }
      if (status === 'VOIDED' || status === 'ERROR') {
        this.logger.log(`Poll resolved ${status} reference=${reference} after ${attempt + 1} attempt(s)`);
        return {
          status: 'ERROR',
          externalId,
          externalStatus: status,
          message: status === 'VOIDED' ? 'Transaction voided' : 'Payment error',
          raw,
        };
      }
      this.logger.debug(`Poll attempt ${attempt + 1}/${maxAttempts} reference=${reference} status=${status}`);
    }
    this.logger.warn(`Poll timeout reference=${reference} after ${maxAttempts} attempts`);
    return {
      status: 'ERROR',
      externalId,
      externalStatus: 'PENDING',
      message: 'El pago está tardando más de lo esperado. Revisa el estado más tarde.',
      raw: safeRaw,
    };
  }

  async pay(input: {
    amountInCents: number;
    currency: string;
    cardNumber: string;
    cvc: string;
    expMonth: string;
    expYear: string;
    cardHolder: string;
    installments: number;
    reference: string;
    email: string;
  }): Promise<PaymentGatewayResponse> {
    try {
      if (
        !this.processorConfig.baseUrl ||
        !this.processorConfig.publicKey ||
        !this.processorConfig.privateKey ||
        !this.processorConfig.integrityKey
      ) {
        this.logger.warn('Payment processor configuration is incomplete (missing env vars)');
        return {
          status: 'ERROR',
          message: 'Payment processor configuration is incomplete',
        };
      }

      const [cardToken, acceptanceToken] = await Promise.all([
        this.createCardToken(input),
        this.getAcceptanceToken(),
      ]);

      const payload = {
        amount_in_cents: input.amountInCents,
        currency: input.currency,
        signature: this.createSignature(
          input.reference,
          input.amountInCents,
          input.currency,
        ),
        acceptance_token: acceptanceToken,
        payment_method: {
          type: 'CARD',
          installments: input.installments,
          token: cardToken,
        },
        customer_email: input.email,
        reference: input.reference,
      };

      const response = await fetch(
        this.buildUrl(this.processorConfig.transactionsPath),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.processorConfig.privateKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as Record<string, unknown>;
      const status = String(
        (readObject(data.data).status as string | undefined) ?? 'ERROR',
      );
      const externalId = readString(readObject(data.data).id);
      const safeRaw = {
        status,
        transactionId: externalId,
        maskedCard: getMaskedCard(input.cardNumber),
      };

      if (!response.ok) {
        const msg = readString(data.error, 'Payment gateway error');
        this.logger.warn(`Processor API error: status=${response.status} message=${msg}`);
        return {
          status: 'ERROR',
          externalStatus: status,
          message: msg,
          raw: safeRaw,
        };
      }

      if (status === 'APPROVED') {
        return {
          status: 'APPROVED',
          externalId,
          externalStatus: status,
          raw: safeRaw,
        };
      }

      if (status === 'DECLINED') {
        this.logger.log(`Payment declined by gateway reference=${input.reference} externalStatus=${status}`);
        return {
          status: 'DECLINED',
          externalId,
          externalStatus: status,
          message: 'Payment declined by gateway',
          raw: safeRaw,
        };
      }

      if (status === 'PENDING') {
        this.logger.log(`Gateway returned PENDING reference=${input.reference} externalId=${externalId}, polling for result`);
        return this.pollUntilTerminal(externalId, input.reference, safeRaw);
      }

      this.logger.warn(`Unexpected gateway status reference=${input.reference} status=${status}`);
      return {
        status: 'ERROR',
        externalId,
        externalStatus: status,
        message: 'Unexpected gateway status',
        raw: safeRaw,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown payment error';
      this.logger.error(`Payment gateway exception: ${message}`, error instanceof Error ? error.stack : undefined);
      const userMessage = isNetworkError(error) ? USER_FRIENDLY_NETWORK_ERROR : message;
      return {
        status: 'ERROR',
        message: userMessage,
      };
    }
  }
}
