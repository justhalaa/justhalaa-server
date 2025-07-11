import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OTP } from 'src/typeORM/entities/otp.entity';
import { User } from 'src/typeORM/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/RegisterUser.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from 'src/utils/utils.service';
import { ResponseService } from 'src/response-service/response-service.service';
import { Response } from 'express';
import { LoginUserDto, VerifyUserDto } from './dto/LoginUser.dto';
import { otpTemplate } from 'src/helpers/emailTemplates/OTPTemplate';
import * as speakeasy from 'speakeasy';
import { normalizeEmail } from 'src/helpers/normalizeEmail';
import { LocationCordinates } from 'src/typeORM/entities/location_cordinates.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(OTP) private otpRepo: Repository<OTP>,
    @InjectRepository(LocationCordinates)
    private locationRepo: Repository<LocationCordinates>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly utilsService: UtilsService,
    private readonly responseService: ResponseService,
  ) {}

  async register(userDetails: RegisterUserDto, res?: Response) {
    const { email } = userDetails;
    const { longitude, latitude, location_name, ...restUserDetails } =
      userDetails;

    // check for existing user with the email
    const checkForExistingUser = await this.userRepo.findOneBy({
      email,
    });

    if (checkForExistingUser)
      return this.responseService.sendAlreadyExists(
        res,
        'User with Email Already Exists',
      );

    const createLocation = this.locationRepo.create({
      location_name,
      longitude,
      latitude,
    });

    const saveLocation = await this.locationRepo.save(createLocation);

    const user = this.userRepo.create({
      ...restUserDetails,
      location: saveLocation,
    });
    const savedUser = await this.userRepo.save(user);

    // Send User Welcome Message
    await this.utilsService.sendEmail('New user', email, '', 'Welcome');
    return this.responseService.sendSuccess(
      res,
      savedUser,
      'User Created Successfully',
    );
  }

  async login(loginDetails: LoginUserDto, res?: Response) {
    try {
      const { email } = loginDetails;

      // const checkForExistingUser = this.checkForExistingUser(email);

      const otpExistance = await this.otpRepo.findOneBy({
        email,
      });

      if (otpExistance) {
        const otp = speakeasy.totp({
          secret: otpExistance.otp,
          encoding: 'base32',
        });

        const emailData = {
          otp,
        };

        console.log(otp);
        // Send OTP to user
        this.utilsService.sendEmail(otpTemplate(emailData), email, '', 'OTP');
        return this.responseService.sendSuccess(
          res,
          null,
          'OTP sent Successfully ',
        );
      }

      // Generate OTP
      const createSecret = this.otpRepo.create({
        email: normalizeEmail(email),
        otp: speakeasy.generateSecret({ length: 20 }).base32,
      });

      const saveSecret = await this.otpRepo.save(createSecret);
      const otp = speakeasy.totp({
        secret: saveSecret.otp,
        encoding: 'base32',
      });
      const emailData = {
        otp,
      };
      console.log(otp);
      // Send OTP to user
      this.utilsService.sendEmail(otpTemplate(emailData), email, '', 'OTP');
      return this.responseService.sendSuccess(
        res,
        null,
        'OTP sent Successfully ',
      );
    } catch (error) {
      return this.responseService.sendServerError(
        res,
        'Internal Server Error',
        error,
      );
    }
  }

  async verifyOTP(verifyDetails: VerifyUserDto, res?: Response) {
    try {
      const { email, otp } = verifyDetails;
      const checkExistance = await this.otpRepo.findOneBy({
        email: normalizeEmail(email),
      });

      if (!checkExistance)
        return this.responseService.sendNotFound(res, 'Invalid Email', null);

      const verified = speakeasy.totp.verify({
        secret: checkExistance.otp,
        encoding: 'base32',
        token: otp,
        window: 10,
      });

      if (verified) {
        // Fix: There's an issue here with checkExistance.user
        // You need to find the user first
        const user = await this.userRepo.findOneBy({
          email: normalizeEmail(email),
        });

        if (!user) {
          return this.responseService.sendNotFound(res, 'User not found', null);
        }

        const token = await this.jwtService.signAsync({
          id: user.id,
          email: user.email,
        });
        console.log(token);
        await this.otpRepo.delete({
          email: normalizeEmail(email),
        });

        return this.responseService.sendSuccess(
          res,
          { token },
          'Login Successful',
        );
      } else {
        return this.responseService.sendNotFound(res, 'OTP Expired', null);
      }
    } catch (error) {
      console.log(error);
      return this.responseService.sendServerError(
        res,
        'Internal Server Error',
        error,
      );
    }
  }

  private async checkForExistingUser(email: string) {
    const checkForExistingUser = await this.userRepo.findOneBy({
      email,
    });

    return checkForExistingUser || null;
  }
}
