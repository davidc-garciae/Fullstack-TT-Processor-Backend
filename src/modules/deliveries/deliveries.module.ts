import { Module } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { PersistenceModule } from '../../shared/infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [DeliveriesController],
})
export class DeliveriesModule {}
