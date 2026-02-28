import { Body, Controller, Inject, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { TOKENS } from '../../shared/application/ports';
import type { DeliveryRepositoryPort } from '../../shared/domain/ports';

class CreateDeliveryDto {
  @ApiProperty({ example: '6f5eaef7-1f05-4675-9160-42dca676f6d2' })
  @IsString()
  customerId!: string;

  @ApiProperty({ example: 'Calle 10 #20-30' })
  @IsString()
  addressLine1!: string;

  @ApiProperty({ example: 'Apto 302', required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Medellin' })
  @IsString()
  city!: string;

  @ApiProperty({ example: 'Antioquia' })
  @IsString()
  region!: string;

  @ApiProperty({ example: 'CO' })
  @IsString()
  country!: string;

  @ApiProperty({ example: '050021' })
  @IsString()
  postalCode!: string;

  @ApiProperty({ example: 'Entregar en porteria', required: false })
  @IsOptional()
  @IsString()
  instructions?: string;
}

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(
    @Inject(TOKENS.DeliveryRepository)
    private readonly deliveryRepository: DeliveryRepositoryPort,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create delivery record' })
  @ApiBody({ type: CreateDeliveryDto })
  @ApiCreatedResponse({ description: 'Delivery created' })
  create(@Body() dto: CreateDeliveryDto) {
    return this.deliveryRepository.create(dto);
  }
}
