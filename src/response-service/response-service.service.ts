import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class ResponseService {
  // A generic method to structure the response
  private buildResponse(
    res: Response,
    success: boolean,
    statusCode: number,
    message: string,
    data: any = null,
    error: any = null,
  ) {
    return {
      success,
      statusCode,
      message,
      data,
      error,
    };
  }

  // Successful response (200 OK)
  sendSuccess(
    res: Response,
    data: any = null,
    message = 'Operation Successful',
  ) {
    return this.buildResponse(res, true, HttpStatus.OK, message, data);
  }

  // Resource not found (404 Not Found)
  sendNotFound(
    res: Response,
    message = 'Resource Not Found',
    data: any = null,
  ) {
    return this.buildResponse(res, false, HttpStatus.NOT_FOUND, message, data);
  }

  // Resource Already Exist (403 Not Found)
  sendAlreadyExists(
    res: Response,
    message = 'Resource Not Found',
    data: any = null,
  ) {
    return this.buildResponse(res, false, HttpStatus.FORBIDDEN, message, data);
  }

  // Bad request (400 Bad Request)
  sendBadRequest(
    res: Response,
    message = 'Bad Request',
    data: any = null,
    error: any = null,
  ) {
    return this.buildResponse(
      res,
      false,
      HttpStatus.BAD_REQUEST,
      message,
      data,
      error,
    );
  }

  // Unauthorized request (401 Unauthorized)
  sendUnauthorized(
    res: Response,
    message = 'Unauthorized Access',
    data: any = null,
  ) {
    return this.buildResponse(
      res,
      false,
      HttpStatus.UNAUTHORIZED,
      message,
      data,
    );
  }

  // Internal server error (500 Internal Server Error)
  sendServerError(
    res: Response,
    error: any = null,
    message = 'Internal Server Error',
  ) {
    return this.buildResponse(
      res,
      false,
      HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      null,
      error,
    );
  }
}
