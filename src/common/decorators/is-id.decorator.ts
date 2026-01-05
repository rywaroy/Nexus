import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * 检查是否为有效的 MongoDB ObjectId（24位十六进制）
 */
function isMongoId(value: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

/**
 * 检查是否为有效的 UUID v4
 */
function isUUID(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value,
  );
}

/**
 * 通用 ID 验证装饰器
 * 根据 DATABASE_TYPE 环境变量自动选择验证方式：
 * - mongodb: 验证 MongoDB ObjectId（24位十六进制）
 * - postgres/mysql/其他: 验证 UUID v4
 *
 * @example
 * ```ts
 * @IsId({ message: '部门ID格式不正确' })
 * deptId?: string;
 * ```
 */
export function IsId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          // 根据环境变量判断数据库类型
          const dbType = process.env.DATABASE_TYPE || 'mongodb';

          if (dbType === 'mongodb') {
            return isMongoId(value);
          } else {
            return isUUID(value);
          }
        },
        defaultMessage(args: ValidationArguments) {
          const dbType = process.env.DATABASE_TYPE || 'mongodb';
          const expectedFormat =
            dbType === 'mongodb' ? 'MongoDB ObjectId' : 'UUID';
          return `${args.property} 格式不正确，期望 ${expectedFormat} 格式`;
        },
      },
    });
  };
}
