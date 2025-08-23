import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import logger from '../logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        return next.handle().pipe(
            tap(() => {
                const { method, path, user, query, body } = request;
                logger.info(
                    `${method} ${path} ${user && (user as any)._id.toString()} ${JSON.stringify(query)}  ${JSON.stringify(body)}`,
                );
            }),
        );
    }
}
