# 全局异常过滤器

<!-- AI Context: 本文档描述 HttpExceptionFilter，用于捕获和统一处理 HTTP 异常 -->

## 概述

异常过滤器用于捕获未处理的异常，并生成统一格式的错误响应。

**文件位置:** `src/common/filters/http-exception.filter.ts`

## 代码实现

```typescript
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

        // 构建统一的错误响应体
        const errorResponse = {
            timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            message: message || exceptionRes,
            path: request?.url,
            code: 201,  // 自定义错误码
            error,
        };

        // 记录错误日志
        logger.error(
            `${request?.method} ${request?.url} ${request.user && request.user._id.toString()} ${JSON.stringify(request.query)}  ${JSON.stringify(request.body)} ${JSON.stringify(errorResponse)}`,
        );

        // 返回统一格式响应（HTTP 状态码始终为 200）
        response.status(200).json(errorResponse);
    }
}
```

## 关键点

1. **`@Catch(HttpException)`**: 只捕获 `HttpException` 及其子类（如 `NotFoundException`、`UnauthorizedException`）。

2. **统一错误响应格式**:
   ```json
   {
       "timestamp": "2024-01-01 12:00:00",
       "message": "错误信息",
       "path": "/api/user/info",
       "code": 201,
       "error": "Unauthorized"
   }
   ```

3. **HTTP 状态码为 200**: 业务错误通过 `code` 字段传达，简化前端处理逻辑。

4. **详细日志记录**: 包含请求方法、路径、用户ID、请求参数和响应体。

## 集成方式

在 `src/main.ts` 中注册为全局过滤器：

```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```
