import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @ApiProperty({
    description: 'User Type Service Seeker / Provider',
    example: true,
  })
  @IsBoolean()
  is_service_provider: boolean;

  @ApiProperty({
    description: 'The experience level of the user',
    example: 'Intermediate',
  })
  @IsOptional()
  @IsString()
  experience: string;

  @ApiProperty({
    description: 'The availability of the user',
    example: 'Weekends',
  })
  @IsString()
  @IsOptional()
  availability: string;

  @ApiProperty({
    description: 'Additional information about the user',
    example: 'I am a passionate chef with 5 years of experience.',
  })
  @IsString()
  @IsOptional()
  about_you: string;

  @ApiProperty({
    description: 'Category Of Service',
    example: 'Category',
  })
  @IsString()
  @IsOptional()
  category: string;

  // Location Object
  @ApiProperty({
    description: 'The longitude of the user',
    example: '1234567890',
  })
  @IsString()
  @IsOptional()
  longitude: string;

  @ApiProperty({
    description: 'The latitude of the user',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  latitude: string;

  @ApiProperty({
    description: 'The location name of the user',
    example: 'Accra, Madina',
  })
  @IsOptional()
  @IsString()
  locationName: string;

  @ApiProperty({
    description: 'Array of file attachment IDs to be linked as work samples',
    example: [1, 2, 3],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  workSamples: number[];
}
