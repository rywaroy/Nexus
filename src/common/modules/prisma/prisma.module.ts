import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma 模块
 * 全局模块，在 AppModule 中导入后，PrismaService 可在任何地方注入使用
 *
 * 使用方式:
 * 1. 在 AppModule 中导入: imports: [PrismaModule]
 * 2. 在任意 Service 中注入: constructor(private prisma: PrismaService) {}
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
