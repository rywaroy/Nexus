import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 服务
 * 继承 PrismaClient，提供数据库连接管理
 *
 * 该服务是数据库无关的，支持 PostgreSQL、MySQL、MongoDB
 * 具体使用哪个数据库取决于 prisma generate 时使用的 schema 文件
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * 清理数据库（仅用于测试）
   * 警告：此方法会删除所有数据！
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // 按照外键依赖顺序删除
    const models = [
      'userRole',
      'roleMenu',
      'operLog',
      'user',
      'role',
      'menu',
      'dept',
    ];

    for (const model of models) {
      try {
        await (this as any)[model]?.deleteMany();
      } catch (error) {
        // 忽略不存在的模型
      }
    }
  }
}
