import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTransactionUseCase } from './application/create-transaction.use-case';
import { GetTransactionStatusUseCase } from './application/get-transaction-status.use-case';
import { PayTransactionUseCase } from './application/pay-transaction.use-case';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PayTransactionDto } from './dto/pay-transaction.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly payTransactionUseCase: PayTransactionUseCase,
    private readonly getTransactionStatusUseCase: GetTransactionStatusUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a pending transaction' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiOkResponse({
    description: 'Pending transaction created',
    example: { reference: 'TT-1730000000000-1234', status: 'PENDING' },
  })
  @ApiNotFoundResponse({ description: 'Product not found or out of stock' })
  async create(@Body() dto: CreateTransactionDto) {
    const result = await this.createTransactionUseCase.execute(dto);
    if (!result.ok) {
      throw new NotFoundException(result.message);
    }
    return result.value;
  }

  @Post(':reference/pay')
  @ApiOperation({ summary: 'Execute payment for a pending transaction' })
  @ApiParam({ name: 'reference', example: 'TT-1730000000000-1234' })
  @ApiBody({ type: PayTransactionDto })
  @ApiOkResponse({
    description: 'Payment processed',
    example: {
      reference: 'TT-1730000000000-1234',
      status: 'APPROVED',
      processorStatus: 'APPROVED',
    },
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiBadRequestResponse({ description: 'Payment processing error' })
  async pay(
    @Param('reference') reference: string,
    @Body() dto: PayTransactionDto,
  ) {
    const result = await this.payTransactionUseCase.execute({
      reference,
      ...dto,
    });
    if (!result.ok) {
      if (result.error === 'TRANSACTION_NOT_FOUND') {
        throw new NotFoundException(result.message);
      }
      throw new BadRequestException(result.message);
    }
    return result.value;
  }

  @Get(':reference')
  @ApiOperation({ summary: 'Get transaction status by reference' })
  @ApiParam({ name: 'reference', example: 'TT-1730000000000-1234' })
  @ApiOkResponse({
    description: 'Transaction status',
    example: {
      reference: 'TT-1730000000000-1234',
      status: 'PENDING',
      processorStatus: null,
      // IVA (19%) aplicado al producto: 311410
      totalAmountCents: 311410,
      createdAt: '2026-02-27T01:00:00.000Z',
      updatedAt: '2026-02-27T01:00:00.000Z',
    },
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async status(@Param('reference') reference: string) {
    const response = await this.getTransactionStatusUseCase.execute(reference);
    if (!response) {
      throw new NotFoundException('Transaction not found');
    }
    return response;
  }
}
