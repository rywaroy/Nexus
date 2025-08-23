# nestjs-template

## 概览

JWT鉴权

守卫验证角色

封装异常处理

pipe管道转换参数类型

日志

MongoDB

文件上传

使用swagger生成API文档

### JWT鉴权、守卫验证角色

```ts
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @UseGuards(RoleGuard('user')) // 验证角色
    @UseGuards(AuthGuard) // 验证用户，用户信息添加到 req.user
    @Post('profile')
    async getProfile(@Request() req) {
        return req.user;
    }
}
```

### 封装异常处理

src/common/filters/http-exception.filter.ts

### pipe管道转换参数类型

```ts
import { IsNotEmpty, IsString, Length } from "class-validator";
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @ApiPropertyOptional({
        description: '用户名',
        required: true,
    })
    username: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 20)
    @ApiPropertyOptional({
        description: '密码',
        required: true,
    })
    password: string;
}
```

### 日志

常规全局日志
src/common/interceptor/logging.interceptor.ts

错误日志
src/common/filters/http-exception.filter.ts

```ts
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.json()
    ),
    transports: [
        new transports.Console(),
        new transports.DailyRotateFile({
            level: 'info',
            dirname: 'logs',
            filename: '%DATE%.log',
            datePattern: 'YYYY-MM-DD',
        })
    ]
});

export default logger;
```

### MongoDB

**连接**

src/app.module.ts

```ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { mongodbDevConstants, mongodbProdConstants } from './config/constants';
import { FileModule } from './modules/file/file.module';

const dbConfig = process.env.NODE_ENV === 'online' ? mongodbProdConstants : mongodbDevConstants;

@Module({
    imports: [UserModule, MongooseModule.forRoot(`mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.db}`, {
        user: dbConfig.user,
        pass: dbConfig.pass,

    }), AuthModule, FileModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }

```

**表**

src/modules/user/entites/user.entity.ts

**导入模块**

```ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './entities/user.entity';

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule { }
```

### 文件上传

src/modules/file

### 使用swagger生成API文档

配置

src/main.ts

```ts
async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix(PREFIX);

    const options = new DocumentBuilder()
        .setTitle('标题')
        .setDescription('描述信息')
        .setVersion('1.0')
        .build();
    const document = SwaggerModule.createDocument(app, options);
    // 会自动将所有路由显示出来
    SwaggerModule.setup(SWAGGER_V1, app, document); // api/swagger = API文档的路径，访问：http://localhost:3000/api/v1/swagger
}
```

设置入参

```ts
import { IsNotEmpty, IsString, Length } from "class-validator";
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @ApiPropertyOptional({
        description: '用户名',
        required: true,
    })
    username: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 20)
    @ApiPropertyOptional({
        description: '密码',
        required: true,
    })
    password: string;
}
```