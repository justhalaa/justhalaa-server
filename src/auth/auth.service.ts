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
import { Response, Request } from 'express';
import { LoginUserDto, VerifyUserDto } from './dto/LoginUser.dto';
import { otpTemplate } from 'src/helpers/emailTemplates/OTPTemplate';
import * as speakeasy from 'speakeasy';
import { normalizeEmail } from 'src/helpers/normalizeEmail';
import { LocationCordinates } from 'src/typeORM/entities/location_cordinates.entity';
import { WorkSample } from 'src/typeORM/entities/work_samples.entity';
import { FileAttachments } from 'src/typeORM/entities/file_attachments.entity';
import { RefreshTokenService } from './services/refresh-token.service';
import { TokenPairDto } from './dto/auth-response.dto';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(OTP) private otpRepo: Repository<OTP>,
    @InjectRepository(LocationCordinates)
    private locationRepo: Repository<LocationCordinates>,
    @InjectRepository(WorkSample)
    private workSampleRepo: Repository<WorkSample>,
    @InjectRepository(FileAttachments)
    private fileAttachmentRepo: Repository<FileAttachments>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly utilsService: UtilsService,
    private readonly responseService: ResponseService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(userDetails: RegisterUserDto, res?: Response) {
    try {
      const { email } = userDetails;
      const {
        longitude,
        latitude,
        locationName,
        workSamples,
        ...restUserDetails
      } = userDetails;

      // check for existing user with the email
      const checkForExistingUser = await this.userRepo.findOneBy({
        email,
      });

      if (checkForExistingUser)
        return this.responseService.sendAlreadyExists(
          res,
          'User with Email Already Exists',
        );

      // Store User Location
      const createLocation = this.locationRepo.create({
        locationName,
        longitude,
        latitude,
      });
      const saveLocation = await this.locationRepo.save(createLocation);

      // Store Work Samples
      let userWorkSamples = [];
      if (workSamples && workSamples.length > 0) {
        // Find all file attachments with the provided IDs
        const fileAttachmentIds = workSamples as number[];
        const fileAttachments =
          await this.fileAttachmentRepo.findByIds(fileAttachmentIds);

        if (fileAttachments.length > 0) {
          // Create work sample entries
          const workSampleEntities = fileAttachments.map((fileAttachment) => {
            const workSample = new WorkSample();
            workSample.fileAttachment = fileAttachment;
            return workSample;
          });

          // Save work samples without user association yet
          userWorkSamples = await this.workSampleRepo.save(workSampleEntities);
        }
      }

      const user = this.userRepo.create({
        ...restUserDetails,
        location: saveLocation,
      });
      const savedUser = await this.userRepo.save(user);

      // Now associate the work samples with the saved user
      if (userWorkSamples.length > 0) {
        // Update each work sample with the user reference
        userWorkSamples.forEach((workSample) => {
          workSample.user = savedUser;
        });

        // Save the updated work samples
        await this.workSampleRepo.save(userWorkSamples);
      }

      // Send User Welcome Message
      await this.utilsService.sendEmail('New user', email, '', 'Welcome');
      return this.responseService.sendSuccess(
        res,
        savedUser,
        'User Created Successfully',
      );
    } catch (error) {
      return this.responseService.sendServerError(
        res,
        'Internal Server Error',
        error,
      );
    }
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

        // Send OTP to user
        await this.utilsService.sendEmail(
          otpTemplate(emailData),
          email,
          '',
          'OTP',
        );
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

  async verifyOTP(verifyDetails: VerifyUserDto, req?: Request, res?: Response) {
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
        const user = await this.userRepo.findOneBy({
          email: normalizeEmail(email),
        });

        if (!user) {
          return this.responseService.sendNotFound(res, 'User not found', null);
        }

        // Generate token pair
        const tokenPair = await this.generateTokenPair(user, req);
        console.log(tokenPair);

        // Set refresh token as HTTP-only cookie
        if (res) {
          this.setRefreshTokenCookie(
            res,
            tokenPair.refreshToken,
            tokenPair.accessToken,
          );
        }

        await this.otpRepo.delete({
          email: normalizeEmail(email),
        });

        return this.responseService.sendSuccess(res, user, 'Login Successful');
      } else {
        return this.responseService.sendNotFound(res, 'OTP Expired', null);
      }
    } catch (error) {
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

  async getUserById(id: number, res?: Response) {
    try {
      const user = await this.userRepo.findOne({
        where: { id },
        relations: [
          'location',
          'workSamples',
          'workSamples.fileAttachment',
          'profileImage',
        ],
      });

      if (!user) {
        return this.responseService.sendNotFound(res, 'User not found');
      }

      return this.responseService.sendSuccess(
        res,
        user,
        'User retrieved successfully',
      );
    } catch (error) {
      return this.responseService.sendServerError(
        res,
        'Internal Server Error',
        error,
      );
    }
  }

  async generateTokenPair(user: User, req?: Request): Promise<TokenPairDto> {
    // Generate access token
    const accessToken = this.refreshTokenService.generateAccessToken(user);

    // Generate refresh token
    const userAgent = req?.headers['user-agent'];
    const ipAddress = req?.ip || req?.connection?.remoteAddress;

    const refreshTokenEntity =
      await this.refreshTokenService.generateRefreshToken(
        user,
        userAgent,
        ipAddress,
      );

    return {
      accessToken,
      refreshToken: refreshTokenEntity.token,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer',
    };
  }

  async refreshTokens(refreshToken: string, req?: Request, res?: Response) {
    try {
      // Validate refresh token
      const tokenEntity =
        await this.refreshTokenService.validateRefreshToken(refreshToken);

      // Rotate refresh token (generate new one and revoke old one)
      const userAgent = req?.headers['user-agent'];
      const ipAddress = req?.ip || req?.connection?.remoteAddress;

      const newRefreshToken = await this.refreshTokenService.rotateRefreshToken(
        refreshToken,
        tokenEntity.user,
        userAgent,
        ipAddress,
      );

      // Generate new access token
      const accessToken = this.refreshTokenService.generateAccessToken(
        tokenEntity.user,
      );

      const tokenPair: TokenPairDto = {
        accessToken,
        refreshToken: newRefreshToken.token,
        expiresIn: 900, // 15 minutes in seconds
        tokenType: 'Bearer',
      };

      // Set new refresh token as HTTP-only cookie
      if (res) {
        this.setRefreshTokenCookie(res, tokenPair.refreshToken, accessToken);
      }

      return this.responseService.sendSuccess(
        res,
        tokenPair,
        'Tokens refreshed successfully',
      );
    } catch (error) {
      return this.responseService.sendUnauthorized(
        res,
        'Invalid or expired refresh token',
        null,
      );
    }
  }

  async logout(refreshToken: string, res?: Response) {
    try {
      if (refreshToken) {
        await this.refreshTokenService.revokeToken(refreshToken);
      }

      // Clear refresh token cookie
      if (res) {
        this.clearRefreshTokenCookie(res);
      }

      return this.responseService.sendSuccess(
        res,
        null,
        'Logged out successfully',
      );
    } catch (error) {
      return this.responseService.sendServerError(
        res,
        'Internal Server Error',
        error,
      );
    }
  }

  async logoutAll(userId: number, res?: Response) {
    try {
      await this.refreshTokenService.revokeAllUserTokens(userId);

      // Clear refresh token cookie
      if (res) {
        this.clearRefreshTokenCookie(res);
      }

      return this.responseService.sendSuccess(
        res,
        null,
        'Logged out from all devices successfully',
      );
    } catch (error) {
      return this.responseService.sendServerError(
        res,
        'Internal Server Error',
        error,
      );
    }
  }

  private setRefreshTokenCookie(
    res: Response,
    refreshToken: string,
    accessToken,
  ): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS in production
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      // path: '/auth/refresh', // Restrict cookie to refresh endpoint
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.cookie('accessToken', accessToken, cookieOptions);
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
    });
  }
}
