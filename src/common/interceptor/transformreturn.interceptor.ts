import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const transformValue = (data: any) => {
    return {
        data,
        code: 0,
        message: '请求成功',
    };
};

// 处理统一成功返回值
@Injectable()
export class TransformReturnInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // const host = context.switchToHttp();
        // const request = host.getRequest();

        // 不需要格式化的接口
        // if (['/api/status'].includes(request?.url)) {
        //     return next.handle();
        // }

        return next.handle().pipe(map(transformValue));
    }
}
