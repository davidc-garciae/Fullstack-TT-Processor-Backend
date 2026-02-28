import { Injectable } from '@nestjs/common';
import { CustomerRepositoryPort } from '../../../domain/ports';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaCustomerRepository implements CustomerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    fullName: string;
    email: string;
    phone: string;
    documentType: string;
    documentNumber: string;
  }) {
    const row = await this.prisma.customer.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
      },
    });
    return {
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      documentType: row.documentType,
      documentNumber: row.documentNumber,
    };
  }
}
