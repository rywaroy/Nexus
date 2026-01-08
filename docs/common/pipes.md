# 验证管道

<!-- AI Context: 本文档描述 ValidationPipe，用于自动验证请求参数 -->

## 概述

验证管道用于自动验证所有进入 Controller 的请求数据，依赖 `class-validator` 和 `class-transformer` 库。

**文件位置:** `src/common/pipes/validation.pipe.ts`

## 代码实现

```typescript
import { ArgumentMetadata, HttpException, HttpStatus, Injectable, PipeTransform, Type, } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata) {
        const { metatype } = metadata;
        if (!metatype || !this.toValidate(metatype)) {
            return value;  // 不需要验证，直接返回
        }

        // 将普通对象转换为类实例
        const object = plainToClass(metatype, value);

        // 使用 class-validator 验证
        const errors = await validate(object);

        if (errors.length > 0) {
            const errObj = Object.values(errors[0].constraints)[0];
            throw new HttpException(
                { message: '请求参数验证失败 ', error: errObj },
                HttpStatus.BAD_REQUEST,
            );
        }

        return value;
    }

    private toValidate(metatype: Type<any>): boolean {
        const types = [String, Boolean, Number, Array, Object];
        return !types.find(type => metatype === type);
    }
}
```

## 工作流程

1. **获取 metatype**: 参数的类型信息（DTO 类）
2. **跳过内置类型**: String、Number 等不需要验证
3. **plainToClass**: 将普通 JSON 对象转换为 DTO 类实例
4. **validate**: 检查所有 `class-validator` 装饰器
5. **抛出异常**: 验证失败时返回第一条错误信息

## 使用示例

**定义 DTO:**

```typescript
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 20)
    password: string;
}
```

**在 Controller 中使用:**

```typescript
@Post('register')
register(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
}
```

**验证失败响应:**

```json
{
    "timestamp": "2024-01-01 12:00:00",
    "message": "请求参数验证失败",
    "path": "/api/user/register",
    "code": 201,
    "error": "password must be longer than or equal to 6 characters"
}
```

## 集成方式

在 `src/main.ts` 中注册为全局管道：

```typescript
app.useGlobalPipes(new ValidationPipe());
```
