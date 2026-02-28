import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

class CustomerDto {
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

class DeliveryDto {
  @ApiProperty({ example: 'Calle 10 # 20-30' })
  @IsString()
  addressLine1!: string;

  @ApiProperty({ example: 'Apt 302', required: false })
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

  @ApiProperty({ example: 'Porteria torre 2', required: false })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreateTransactionDto {
  @ApiProperty({ example: '0f5eaef7-1f05-4675-9160-42dca676f6c1' })
  @IsString()
  productId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    example: 'idemp-12345678',
    minLength: 8,
    maxLength: 128,
    description: 'Idempotency key for safe retries',
  })
  @IsString()
  @Length(8, 128)
  idempotencyKey!: string;

  @ApiProperty({ type: CustomerDto })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @ApiProperty({ type: DeliveryDto })
  @ValidateNested()
  @Type(() => DeliveryDto)
  delivery!: DeliveryDto;
}
