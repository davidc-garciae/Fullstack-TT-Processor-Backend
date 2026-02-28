import { Injectable, Logger } from '@nestjs/common';
import type { PaymentGatewayPort, PaymentGatewayResponse } from '../../domain/ports';

/**
 * Mock gateway for local development when the real processor API is unreachable.
 * Set PAYMENT_PROCESSOR_USE_MOCK=true to approve payments without calling the external API.
 */
@Injectable()
export class MockPaymentGateway implements PaymentGatewayPort {
  private readonly logger = new Logger(MockPaymentGateway.name);

  async pay(): Promise<PaymentGatewayResponse> {
    this.logger.log('Mock gateway: approving payment (no external API call)');
    return {
      status: 'APPROVED',
      externalId: `mock-${Date.now()}`,
      externalStatus: 'APPROVED',
      raw: { status: 'APPROVED', transactionId: `mock-${Date.now()}`, maskedCard: '****4242' },
    };
  }
}
