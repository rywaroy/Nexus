import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OperLogService } from './oper-log.service';
import { OperLogController } from './oper-log.controller';
import { OperationLogInterceptor } from '@/common/interceptor/operation-log.interceptor';

@Global()
@Module({
  controllers: [OperLogController],
  providers: [
    OperLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
  ],
  exports: [OperLogService],
})
export class OperLogModule {}
