import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  /**
   * Cleanup expired refresh tokens
   * Runs every day at 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens() {
    try {
      this.logger.log('Starting cleanup of expired refresh tokens...');
      await this.refreshTokenService.cleanupExpiredTokens();
      this.logger.log('Expired refresh tokens cleanup completed successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup expired refresh tokens', error);
    }
  }

  /**
   * Manual cleanup method that can be called programmatically
   */
  async performManualCleanup(): Promise<void> {
    await this.cleanupExpiredTokens();
  }
}
