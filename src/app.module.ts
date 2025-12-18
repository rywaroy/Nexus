import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { FileModule } from './modules/file/file.module';
import { RedisModule } from './modules/redis/redis.module';
import { MenuModule } from './modules/menu/menu.module';
import { RoleModule } from './modules/role/role.module';
import { DeptModule } from './modules/dept/dept.module';
import { OperLogModule } from './modules/oper-log/oper-log.module';
import { PermissionModule } from './common/modules/permission.module';
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
        UserModule,
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const mongodb = configService.get('mongodb');
                return {
                    uri: `mongodb://${mongodb.host}:${mongodb.port}/${mongodb.database}`,
                    user: mongodb.user,
                    pass: mongodb.password,
                };
            },
            inject: [ConfigService],
        }),
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
export class AppModule {}
