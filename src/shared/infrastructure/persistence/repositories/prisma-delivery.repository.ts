import { Injectable } from '@nestjs/common';
import { DeliveryRepositoryPort } from '../../../domain/ports';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaDeliveryRepository implements DeliveryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    customerId: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    region: string;
    country: string;
    postalCode: string;
    instructions?: string | null;
  }) {
    const row = await this.prisma.delivery.create({
      data: {
        customerId: input.customerId,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        region: input.region,
        country: input.country,
        postalCode: input.postalCode,
        instructions: input.instructions,
      },
    });
    return {
      id: row.id,
      customerId: row.customerId,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      city: row.city,
      region: row.region,
      country: row.country,
      postalCode: row.postalCode,
      instructions: row.instructions,
    };
  }
}
