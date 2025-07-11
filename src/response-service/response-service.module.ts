import { Module } from '@nestjs/common';
import { ResponseService } from './response-service.service';

@Module({
  providers: [ResponseService],
  exports: [ResponseService],
})
export class ResponseServiceModule {}
