# 拦截器

<!-- AI Context: 本文档描述全局拦截器，包括响应格式化和请求日志记录 -->

## 概述

项目包含两个全局拦截器：
- `TransformReturnInterceptor`: 统一成功响应格式
- `LoggingInterceptor`: 记录请求日志

## 1. 统一响应格式拦截器

**文件位置:** `src/common/interceptor/transform.interceptor.ts`

```typescript
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const transformValue = (data: any) => {
    return {
        data,
        code: 0,
        message: '请求成功',
    }
}

@Injectable()
export class TransformReturnInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(map(transformValue))
    }
}
```

**效果:**

Controller 返回：
```typescript
@Get('info')
getInfo() {
    return { username: 'testuser', roles: ['user'] };
}
```

客户端收到：
```json
{
    "data": {
        "username": "testuser",
        "roles": ["user"]
    },
    "code": 0,
    "message": "请求成功"
}
```

## 2. 请求日志拦截器

**文件位置:** `src/common/interceptor/logging.interceptor.ts`

```typescript
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

        return next
            .handle()
            .pipe(
                tap(() => {
                    const { method, path, user, query, body } = request;
                    logger.info(`${method} ${path} ${user && (user as any)._id.toString()} ${JSON.stringify(query)}  ${JSON.stringify(body)}`);
                }),
            );
    }
}
```

**日志输出示例:**

```json
{"level":"info","message":"GET /api/user/info 60f... {\"source\":\"web\"}  {}","timestamp":"2024-01-01 12:00:00"}
```

## 集成与执行顺序

在 `src/main.ts` 中注册：

```typescript
app.useGlobalInterceptors(new TransformReturnInterceptor());
app.useGlobalInterceptors(new LoggingInterceptor());
```

**执行顺序:**

1. 请求进入 `TransformReturnInterceptor`
2. 请求进入 `LoggingInterceptor`
3. 请求到达 Controller
4. Controller 返回数据
5. `LoggingInterceptor` 的 `tap` 触发，记录日志
6. `TransformReturnInterceptor` 的 `map` 触发，包装响应
7. 最终响应发送给客户端
