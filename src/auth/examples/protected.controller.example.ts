import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Example controller showing how to use the JWT authentication system
 * This file is for reference only - you can copy these patterns to your own controllers
 */

@ApiTags('protected-example')
@Controller('protected')
@UseGuards(JwtAuthGuard) // Apply guard to all routes in this controller
@ApiBearerAuth()
export class ProtectedController {
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCurrentUserProfile(@Req() req: Request) {
    const user = req['user']; // Contains: { sub, id, email, type }
    return {
      message: 'Profile data retrieved successfully',
      user: {
        id: user.id,
        email: user.email,
        // Add other user data as needed
      },
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get user dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getDashboard(@Req() req: Request) {
    const userId = req['user'].id;

    return {
      message: 'Dashboard data for user',
      userId,
      data: {
        // Your dashboard data here
        notifications: [],
        recentActivity: [],
        stats: {},
      },
    };
  }

  @Post('update-profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateProfile(@Body() updateData: any, @Req() req: Request) {
    const userId = req['user'].id;

    // Your update logic here
    return {
      message: 'Profile updated successfully',
      userId,
      updatedData: updateData,
    };
  }
}

/**
 * Example of protecting individual routes instead of the entire controller
 */
@ApiTags('mixed-example')
@Controller('mixed')
export class MixedController {
  @Get('public')
  @ApiOperation({ summary: 'Public endpoint - no authentication required' })
  @ApiResponse({ status: 200, description: 'Public data retrieved' })
  getPublicData() {
    return {
      message: 'This is public data',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('private')
  @UseGuards(JwtAuthGuard) // Apply guard to this specific route
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Private endpoint - authentication required' })
  @ApiResponse({ status: 200, description: 'Private data retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPrivateData(@Req() req: Request) {
    const user = req['user'];
    return {
      message: 'This is private data',
      user: user.email,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Example of role-based access (if you implement roles in the future)
 */
// @Controller('admin')
// @UseGuards(JwtAuthGuard, RoleGuard) // Combine multiple guards
// @ApiBearerAuth()
// export class AdminController {
//
//   @Get('users')
//   @Roles('admin') // Custom decorator for roles
//   getAllUsers() {
//     return { message: 'Admin only - all users data' };
//   }
// }
