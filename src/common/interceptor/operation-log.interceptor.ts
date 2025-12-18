import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LOG_KEY_METADATA, LogOption } from '../decorator/log.decorator';
import {
    BusinessTypeEnum,
    OperStatusEnum,
} from '../../modules/oper-log/entities/oper-log.entity';
import { OperLogService } from '../../modules/oper-log/oper-log.service';

/**
 * 操作日志拦截器
 * 用于记录带有 @Log() 装饰器的接口操作日志
 */
@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly operLogService: OperLogService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // 获取 @Log() 装饰器的元数据
        const logOption = this.reflector.get<LogOption>(
            LOG_KEY_METADATA,
            context.getHandler(),
        );

        // 如果没有 @Log() 装饰器，直接放行
        if (!logOption) {
            return next.handle();
        }

        const startTime = Date.now();
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const controller = context.getClass();

        return next.handle().pipe(
            tap((data) => {
                // 成功时记录日志
                this.log(
                    logOption,
                    request,
                    controller,
                    handler,
                    startTime,
                    data,
                    null,
                );
            }),
            catchError((error) => {
                // 异常时记录日志
                this.log(
                    logOption,
                    request,
                    controller,
                    handler,
                    startTime,
                    null,
                    error,
                );
                throw error;
            }),
        );
    }

    /**
     * 记录操作日志
     */
    private async log(
        logOption: LogOption,
        request: any,
        controller: any,
        handler: any,
        startTime: number,
        data: any,
        error: any,
    ): Promise<void> {
        try {
            const user = request.user;

            // 如果没有用户信息，不记录日志
            if (!user) {
                return;
            }

            const costTime = Date.now() - startTime;

            // 构建请求参数
            let operParam = '';
            if (logOption.isSaveRequestData) {
                const params = {
                    query: request.query,
                    body: this.sanitizeBody(request.body),
                    params: request.params,
                };
                operParam = JSON.stringify(params);
                // 限制长度，避免过大
                if (operParam.length > 2000) {
                    operParam = operParam.substring(0, 2000) + '...';
                }
            }

            // 构建返回结果
            let jsonResult = '';
            if (
                logOption.isSaveResponseData &&
                logOption.businessType !== BusinessTypeEnum.EXPORT
            ) {
                if (data) {
                    jsonResult = JSON.stringify(data);
                    // 限制长度，避免过大
                    if (jsonResult.length > 2000) {
                        jsonResult = jsonResult.substring(0, 2000) + '...';
                    }
                }
            }

            // 判断操作状态
            let status = OperStatusEnum.SUCCESS;
            let errorMsg = '';

            if (error) {
                status = OperStatusEnum.FAIL;
                errorMsg =
                    error.message || error.toString() || '未知错误';
                if (errorMsg.length > 2000) {
                    errorMsg = errorMsg.substring(0, 2000) + '...';
                }
            } else if (data && data.code !== undefined && data.code !== 0) {
                // 如果返回的业务码不是成功，也记录为失败
                status = OperStatusEnum.FAIL;
                errorMsg = data.message || data.msg || '';
            }

            // 获取 IP 地址
            const operIp = this.getClientIp(request);

            // 构建日志对象
            const operLog = {
                title: logOption.title || '',
                businessType: logOption.businessType || BusinessTypeEnum.OTHER,
                method: `${controller.name}.${handler.name}()`,
                requestMethod: request.method,
                operName: user.username || user.nickName || '',
                deptName: user.deptName || '',
                operUrl: request.originalUrl || request.url,
                operIp,
                operLocation: '', // 可以后续集成 IP 地理位置服务
                operParam,
                jsonResult,
                status,
                errorMsg,
                operTime: new Date(),
                costTime,
            };

            // 异步写入日志，不阻塞响应
            this.operLogService.create(operLog).catch((err) => {
                console.error('操作日志写入失败:', err);
            });
        } catch (err) {
            // 日志记录失败不影响业务
            console.error('操作日志记录异常:', err);
        }
    }

    /**
     * 获取客户端 IP
     */
    private getClientIp(request: any): string {
        const headers = request.headers;
        return (
            headers['x-real-ip'] ||
            headers['x-forwarded-for']?.split(',')[0] ||
            request.ip ||
            request.connection?.remoteAddress ||
            ''
        );
    }

    /**
     * 敏感字段脱敏处理
     */
    private sanitizeBody(body: any): any {
        if (!body || typeof body !== 'object') {
            return body;
        }

        const sensitiveFields = [
            'password',
            'oldPassword',
            'newPassword',
            'confirmPassword',
            'token',
            'accessToken',
            'refreshToken',
            'secret',
            'apiKey',
        ];

        const sanitized = { ...body };
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '******';
            }
        }

        return sanitized;
    }
}
