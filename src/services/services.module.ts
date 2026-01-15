import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../typeORM/entities/service.entity';
import { User } from '../typeORM/entities/user.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ResponseServiceModule } from '../response-service/response-service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, User]),
    ResponseServiceModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
