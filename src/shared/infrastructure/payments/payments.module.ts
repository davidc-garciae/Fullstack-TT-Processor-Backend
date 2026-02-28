import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import processorConfig from './processor.config';
import { ProcessorGateway } from './processor.gateway';
import { MockPaymentGateway } from './mock-payment.gateway';
import { TOKENS } from '../../application/ports';

@Module({
  imports: [ConfigModule.forFeature(processorConfig)],
  providers: [
    ProcessorGateway,
    MockPaymentGateway,
    {
      provide: TOKENS.PaymentGateway,
      useFactory: (
        config: ConfigType<typeof processorConfig>,
        real: ProcessorGateway,
        mock: MockPaymentGateway,
      ) => (config.useMock ? mock : real),
      inject: [processorConfig.KEY, ProcessorGateway, MockPaymentGateway],
    },
  ],
  exports: [TOKENS.PaymentGateway],
})
export class PaymentsModule {}
