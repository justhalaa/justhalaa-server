import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { FileAttachments } from './file_attachments.entity';

@Entity()
export class WorkSample {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => FileAttachments)
  @JoinColumn()
  fileAttachment: FileAttachments;

  @ManyToOne(() => User, (user) => user.workSamples)
  user: User;
}
