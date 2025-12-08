import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import logger from '../logger';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionRes = exception.getResponse() as {
      error: string;
      message: string;
    };
    const { error, message } = exceptionRes;
    const errorResponse = {
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      message: message || exceptionRes,
      path: request?.url,
      code: -1,
      error,
    };
    logger.error(
      `${request?.method} ${request?.url} ${request.user && request.user._id.toString()} ${JSON.stringify(request.query)}  ${JSON.stringify(request.body)} ${JSON.stringify(errorResponse)}`,
    );
    if (status === 401) {
      response.status(401).json(errorResponse);
    } else {
      response.status(200).json(errorResponse);
    }
  }
}
