import {
  IsEmail,
  IsIn,
  IsInt,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayTransactionDto {
  @ApiProperty({ example: '4242424242424242', minLength: 13, maxLength: 19 })
  @IsString()
  @Length(13, 19)
  @Matches(/^\d+$/, { message: 'cardNumber must contain only digits' })
  cardNumber!: string;

  @ApiProperty({ example: '123', minLength: 3, maxLength: 4 })
  @IsString()
  @Length(3, 4)
  @Matches(/^\d+$/, { message: 'cvc must contain only digits' })
  cvc!: string;

  @ApiProperty({ example: '12', minLength: 2, maxLength: 2 })
  @IsString()
  @Length(2, 2)
  @IsIn(
    [
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
    ],
    { message: 'expMonth must be between 01 and 12' },
  )
  expMonth!: string;

  @ApiProperty({ example: '28', minLength: 2, maxLength: 4 })
  @IsString()
  @Length(2, 4)
  @Matches(/^\d+$/, { message: 'expYear must contain only digits' })
  expYear!: string;

  @ApiProperty({ example: 'JANE DOE' })
  @IsString()
  cardHolder!: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 36 })
  @IsInt()
  @Min(1)
  @Max(36)
  installments!: number;

  @ApiProperty({ example: 'jane.doe@email.com' })
  @IsEmail()
  email!: string;
}
