import { Global, Module } from '@nestjs/common';
import { PermissionGuard } from '../guards/permission.guard';

/**
 * 权限模块
 * 提供 PermissionGuard 供全局使用
 * 依赖全局 PrismaModule 进行数据库操作
 */
@Global()
@Module({
  providers: [PermissionGuard],
  exports: [PermissionGuard],
})
export class PermissionModule {}
