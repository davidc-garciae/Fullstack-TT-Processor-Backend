import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @ApiOperation({ summary: 'List active products with stock' })
  @ApiOkResponse({ description: 'Products returned successfully' })
  list() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details by id' })
  @ApiParam({ name: 'id', example: '0f5eaef7-1f05-4675-9160-42dca676f6c1' })
  @ApiOkResponse({ description: 'Product found' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async getById(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
