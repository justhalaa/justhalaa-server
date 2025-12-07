import * as dotenv from 'dotenv';
dotenv.config();

export const jwtConstants: any = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
  refreshTokenSecret:
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
  accessTokenExpiry: '15m' as string, // 15 minutes
  refreshTokenExpiry: '7d' as string, // 7 days
};
