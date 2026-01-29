import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '@siteflow/shared';

@Catch(AppError)
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: AppError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = {
      statusCode: exception.statusCode,
      error: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(exception.details && { details: exception.details }),
      ...(process.env.NODE_ENV !== 'production' && {
        stack: exception.stack,
      }),
    };

    this.logger.error(
      `AppError ${exception.code} - ${exception.message}`,
      exception.stack,
    );

    response.status(exception.statusCode).json(errorResponse);
  }
}
