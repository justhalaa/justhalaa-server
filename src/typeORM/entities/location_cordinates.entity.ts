import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class LocationCordinates {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  location_name: string;

  @Column()
  longitude: string;

  @Column({ unique: true })
  latitude: string;
}
