import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from '../typeORM/entities/product.entity';
import { ProductCategory } from '../typeORM/entities/product-category.entity';
import { User } from '../typeORM/entities/user.entity';
import { FileAttachments } from '../typeORM/entities/file_attachments.entity';
import { ResponseServiceModule } from '../response-service/response-service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductCategory,
      User,
      FileAttachments,
    ]),
    ResponseServiceModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
