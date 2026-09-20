import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res?.message) {
        message = Array.isArray(res.message) ? res.message.join('; ') : res.message;
        details = res;
        code = res.code ?? res.error ?? code;
      }
      // Map validation errors
      if (status === 400 && !code) code = 'VALIDATION_ERROR';
      if (status === 401) code = 'AUTH_UNAUTHORIZED';
      if (status === 403) code = 'PERMISSION_DENIED';
      if (status === 404) code = 'RESOURCE_NOT_FOUND';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Don't leak stack in prod
    const body = {
      success: false as const,
      error: { code, message, details, path: request?.url, timestamp: new Date().toISOString() },
    };
    response.status(status).json(body);
  }
}
