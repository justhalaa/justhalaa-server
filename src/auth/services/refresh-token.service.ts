import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from 'src/typeORM/entities/refresh-token.entity';
import { User } from 'src/typeORM/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../constants';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async generateRefreshToken(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshToken> {
    // Generate a secure random token
    const token = this.generateSecureToken();

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = this.refreshTokenRepo.create({
      token,
      userId: user.id,
      user,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return await this.refreshTokenRepo.save(refreshToken);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return await this.refreshTokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  async revokeToken(
    token: string,
    replacedByToken?: string,
  ): Promise<RefreshToken> {
    const refreshToken = await this.findByToken(token);

    if (!refreshToken) {
      throw new Error('Token not found');
    }

    refreshToken.isRevoked = true;
    refreshToken.revokedAt = new Date();

    if (replacedByToken) {
      refreshToken.replacedByToken = replacedByToken;
    }

    return await this.refreshTokenRepo.save(refreshToken);
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async rotateRefreshToken(
    oldToken: string,
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshToken> {
    // Generate new refresh token
    const newRefreshToken = await this.generateRefreshToken(
      user,
      userAgent,
      ipAddress,
    );

    // Revoke old token
    await this.revokeToken(oldToken, newRefreshToken.token);

    return newRefreshToken;
  }

  private generateSecureToken(): string {
    return 'rt_' + crypto.randomBytes(64).toString('hex');
  }

  generateAccessToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: jwtConstants.accessTokenSecret,
      expiresIn: jwtConstants.accessTokenExpiry as any,
    });
  }

  async validateRefreshToken(token: string): Promise<RefreshToken> {
    const refreshToken = await this.findByToken(token);

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    if (!refreshToken.isActive) {
      throw new Error('Refresh token is not active');
    }

    return refreshToken;
  }
}
