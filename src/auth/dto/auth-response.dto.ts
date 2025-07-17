import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: any;
}

export class TokenPairDto {
  @ApiProperty({
    description: 'JWT access token (short-lived)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token (long-lived)',
    example: 'rt_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;
}

export class TokenResponseDto extends AuthResponseDto {
  @ApiProperty({
    description: 'Token pair containing access and refresh tokens',
    type: TokenPairDto,
  })
  data: TokenPairDto;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token to exchange for new access token',
    example: 'rt_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....',
  })
  refreshToken: string;
}
