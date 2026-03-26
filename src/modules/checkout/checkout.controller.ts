import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PreviewCheckoutDto } from './dto/preview-checkout.dto';
import { PreviewCheckoutUseCase } from './application/preview-checkout.use-case';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly previewCheckoutUseCase: PreviewCheckoutUseCase,
  ) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview checkout totals before payment' })
  @ApiBody({ type: PreviewCheckoutDto })
  @ApiOkResponse({
    description: 'Checkout preview with amount breakdown',
    example: {
      productId: '0f5eaef7-1f05-4675-9160-42dca676f6c1',
      quantity: 1,
      currency: 'COP',
      productAmountCents: 259000,
      baseFeeCents: 1200,
      deliveryFeeCents: 2000,
      // total bruto = 259000 + IVA(49210) + 1200 + 2000 = 311410
      // redondeado al múltiplo de 100 => 311500
      totalAmountCents: 311500,
    },
  })
  @ApiNotFoundResponse({ description: 'Product not found or out of stock' })
  async preview(@Body() dto: PreviewCheckoutDto) {
    const result = await this.previewCheckoutUseCase.execute(dto);
    if (!result.ok) {
      if (result.error === 'PRODUCT_NOT_FOUND') {
        throw new NotFoundException(result.message);
      }
      throw new NotFoundException(result.message);
    }
    return result.value;
  }
}
