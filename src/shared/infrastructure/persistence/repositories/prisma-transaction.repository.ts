import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  TransactionCreateInput,
  TransactionRepositoryPort,
} from '../../../domain/ports';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaTransactionRepository implements TransactionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createPending(input: TransactionCreateInput) {
    const row = await this.prisma.transaction.create({
      data: {
        reference: input.reference,
        productId: input.productId,
        customerId: input.customerId,
        deliveryId: input.deliveryId,
        quantity: input.quantity,
        productAmountCents: input.productAmountCents,
        baseFeeCents: input.baseFeeCents,
        deliveryFeeCents: input.deliveryFeeCents,
        totalAmountCents: input.totalAmountCents,
        idempotencyKey: input.idempotencyKey,
        status: 'PENDING',
      },
    });
    return row;
  }

  async findByReference(reference: string) {
    const row = await this.prisma.transaction.findUnique({
      where: { reference },
    });
    return row;
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.transaction.findUnique({ where: { idempotencyKey } });
  }

  async updateStatus(
    reference: string,
    input: {
      status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
      processorTransactionId?: string | null;
      processorStatus?: string | null;
      failureReason?: string | null;
    },
  ) {
    return this.prisma.transaction.update({
      where: { reference },
      data: {
        status: input.status,
        processorTransactionId: input.processorTransactionId,
        processorStatus: input.processorStatus,
        failureReason: input.failureReason,
      },
    });
  }

  async finalizeApprovedWithStock(
    reference: string,
    input: {
      productId: string;
      quantity: number;
      processorTransactionId?: string | null;
      processorStatus?: string | null;
      eventPayload: Record<string, unknown>;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const stockUpdate = await tx.stockItem.updateMany({
        where: {
          productId: input.productId,
          availableUnits: { gte: input.quantity },
        },
        data: { availableUnits: { decrement: input.quantity } },
      });

      if (stockUpdate.count === 0) {
        throw new Error('INSUFFICIENT_STOCK_DURING_FINALIZATION');
      }

      const updated = await tx.transaction.update({
        where: { reference },
        data: {
          status: 'APPROVED',
          processorTransactionId: input.processorTransactionId,
          processorStatus: input.processorStatus,
          failureReason: null,
        },
      });

      await tx.transactionEvent.create({
        data: {
          transactionId: updated.id,
          eventType: 'PAYMENT_RESULT',
          payloadJson: input.eventPayload as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async createEvent(
    transactionId: string,
    eventType: string,
    payloadJson: unknown,
  ) {
    const safePayload: Prisma.InputJsonValue | Prisma.JsonNullValueInput =
      payloadJson === undefined
        ? Prisma.JsonNull
        : (payloadJson as Prisma.InputJsonValue);
    await this.prisma.transactionEvent.create({
      data: { transactionId, eventType, payloadJson: safePayload },
    });
  }
}
