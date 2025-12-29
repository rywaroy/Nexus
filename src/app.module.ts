import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/system/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { FileModule } from './modules/common/file/file.module';
import { RedisModule } from './modules/common/redis/redis.module';
import { MenuModule } from './modules/system/menu/menu.module';
import { RoleModule } from './modules/system/role/role.module';
import { DeptModule } from './modules/system/dept/dept.module';
import { OperLogModule } from './modules/system/oper-log/oper-log.module';
import { PermissionModule } from './common/modules/permission.module';
import { PrismaModule } from './common/modules/prisma';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwt = configService.get('jwt');
        return {
          secret: jwt.secret,
          signOptions: {
            expiresIn: jwt.expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
    // Prisma 全局模块（替代 MongooseModule）
    PrismaModule,
    UserModule,
    AuthModule,
    FileModule,
    RedisModule,
    MenuModule,
    RoleModule,
    DeptModule,
    OperLogModule,
    PermissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
