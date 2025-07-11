import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OTP } from 'src/typeORM/entities/otp.entity';
import { User } from 'src/typeORM/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UtilsModule } from 'src/utils/utils.module';
import { jwtConstants } from './constants';
import { ResponseServiceModule } from 'src/response-service/response-service.module';
import { LocationCordinates } from 'src/typeORM/entities/location_cordinates.entity';
import { WorkSample } from 'src/typeORM/entities/work_samples.entity';
import { FileAttachments } from 'src/typeORM/entities/file_attachments.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      OTP,
      LocationCordinates,
      WorkSample,
      FileAttachments,
    ]),
    ConfigModule,
    UtilsModule,
    ResponseServiceModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
