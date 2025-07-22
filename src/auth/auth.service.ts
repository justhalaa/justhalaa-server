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
      const {
        email,
        longitude,
        latitude,
        locationName,
        workSamples,
        ...restUserDetails
      } = userDetails;

      // Check for existing user
      const existingUser = await this.userRepo.findOneBy({ email });
      if (existingUser) {
        return this.responseService.sendAlreadyExists(
          res,
          'User with Email Already Exists',
        );
      }

      // Create location only if location data is provided
      let savedLocation = null;
      if (this.hasLocationData(longitude, latitude, locationName)) {
        savedLocation = await this.createLocation({
          longitude,
          latitude,
          locationName,
        });
      }

      // Create user
      const user = this.userRepo.create({
        ...restUserDetails,
        email,
        location: savedLocation,
      });
      const savedUser = await this.userRepo.save(user);

      // Create work samples only if provided
      if (workSamples?.length > 0) {
        await this.createWorkSamples(workSamples as number[], savedUser);
      }

      // Send welcome email
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

  private hasLocationData(
    longitude: string,
    latitude: string,
    locationName: string,
  ): boolean {
    return longitude != null || latitude != null || locationName != null;
  }

  private async createLocation(locationData: {
    longitude: string;
    latitude: string;
    locationName: string;
  }) {
    const location = this.locationRepo.create(locationData);
    return await this.locationRepo.save(location);
  }

  private async createWorkSamples(workSampleIds: number[], user: any) {
    const fileAttachments =
      await this.fileAttachmentRepo.findByIds(workSampleIds);

    if (fileAttachments.length === 0) return;

    const workSampleEntities = fileAttachments.map((fileAttachment) => {
      const workSample = new WorkSample();
      workSample.fileAttachment = fileAttachment;
      workSample.user = user;
      return workSample;
    });

    await this.workSampleRepo.save(workSampleEntities);
  }

  async login(loginDetails: LoginUserDto, res?: Response) {
    try {
      const { email } = loginDetails;

      // Check user existance
      const checkForExistingUser = await this.checkForExistingUser(email);
      if (!checkForExistingUser) {
        return this.responseService.sendNotFound(res, 'User Not Found', null);
      }

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

  async googleLogin(req: any, res?: Response) {
    try {
      if (!req.user) {
        return this.responseService.sendUnauthorized(
          res,
          'No user from Google',
          null,
        );
      }

      const { email, firstName, lastName, picture } = req.user;
      const fullName = `${firstName} ${lastName}`;

      // Check if user already exists
      let user = await this.userRepo.findOneBy({ email });

      if (!user) {
        // Create new user with Google data - using your User entity structure
        const newUser = this.userRepo.create({
          email,
          full_name: fullName,
          phone_number: '', // Required field, will be empty for Google users initially
        });
        user = await this.userRepo.save(newUser);

        // TODO: Handle profile image from Google if needed
        // You might want to download and store the Google profile picture
      }

      // Generate token pair
      const tokenPair = await this.generateTokenPair(user, req);

      // Set refresh token as HTTP-only cookie
      if (res) {
        this.setRefreshTokenCookie(
          res,
          tokenPair.refreshToken,
          tokenPair.accessToken,
        );
      }
      // Redirect to frontend with success
      const frontendUrl = this.config.get('FRONTEND_URL');
      return res?.redirect(`${frontendUrl}?loginStatus=success`);
    } catch (error) {
      const frontendUrl = this.config.get('FRONTEND_URL');
      return res?.redirect(`${frontendUrl}?loginStatus=error`);
    }
  }
}
