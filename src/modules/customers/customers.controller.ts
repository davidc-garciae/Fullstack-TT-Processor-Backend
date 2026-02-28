import { Body, Controller, Inject, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { TOKENS } from '../../shared/application/ports';
import type { CustomerRepositoryPort } from '../../shared/domain/ports';

class CreateCustomerDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'jane.doe@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+573001112233' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'CC' })
  @IsString()
  documentType!: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  documentNumber!: string;
}

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(
    @Inject(TOKENS.CustomerRepository)
    private readonly customerRepository: CustomerRepositoryPort,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create customer record' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiCreatedResponse({ description: 'Customer created' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customerRepository.create(dto);
  }
}
