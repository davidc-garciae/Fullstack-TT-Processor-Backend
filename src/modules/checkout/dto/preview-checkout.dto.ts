import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PreviewCheckoutDto {
  @ApiProperty({
    example: '0f5eaef7-1f05-4675-9160-42dca676f6c1',
    description: 'Product identifier',
  })
  @IsString()
  productId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}
