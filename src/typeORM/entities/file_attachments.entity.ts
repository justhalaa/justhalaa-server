import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
