import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { PreviewCheckoutUseCase } from './application/preview-checkout.use-case';
import { PersistenceModule } from '../../shared/infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [CheckoutController],
  providers: [PreviewCheckoutUseCase],
  exports: [PreviewCheckoutUseCase],
})
export class CheckoutModule {}
