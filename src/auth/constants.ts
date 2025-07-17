import * as dotenv from 'dotenv';
dotenv.config();

export const jwtConstants = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
  refreshTokenSecret:
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
  accessTokenExpiry: '15m', // 15 minutes
  refreshTokenExpiry: '7d', // 7 days
};
