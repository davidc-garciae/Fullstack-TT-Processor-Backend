import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { PersistenceModule } from '../../shared/infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [CustomersController],
})
export class CustomersModule {}
