import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class LocationCordinates {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  locationName: string;

  @Column()
  longitude: string;

  @Column()
  latitude: string;
}
