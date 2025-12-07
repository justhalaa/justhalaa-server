import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class FileAttachments {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column()
  size: number;

  @Column()
  fileType: string;

  // Optional relation to Product for product images
  @ManyToOne(() => Product, (product) => product.images, { nullable: true })
  product: Product;
}
