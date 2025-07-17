import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { LocationCordinates } from './location_cordinates.entity';
import { WorkSample } from './work_samples.entity';
import { FileAttachments } from './file_attachments.entity';
import { RefreshToken } from './refresh-token.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  full_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone_number: string;

  @Column({ nullable: true })
  experience: string;

  @Column({ nullable: true })
  availability: string;

  @Column({ nullable: true })
  about_you: string;

  @Column({ default: false })
  is_service_provider: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => FileAttachments)
  @JoinColumn()
  profileImage: FileAttachments;

  @OneToOne(() => LocationCordinates)
  @JoinColumn()
  location: LocationCordinates;

  @OneToMany(() => WorkSample, (worksample) => worksample.user)
  workSamples: WorkSample[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];
}
