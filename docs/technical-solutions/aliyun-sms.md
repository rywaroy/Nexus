# 阿里云短信验证码接入方案

<!-- AI Context: 本文档用于在 Nexus/NestJS 项目中快速接入阿里云短信验证码。实现前先读取本文档，再按项目已有模块、配置和响应格式做最小适配。 -->

## 适用场景

适用于手机号验证码登录、注册、绑定手机号、找回密码等短信验证码场景。本文方案基于 NestJS、`@nestjs/config`、Joi、Jest，默认使用阿里云 Dysmsapi `SendSms` 接口。

推荐策略：

- 开发和测试环境使用 `mock` provider，只打印验证码或在测试中注入假实现。
- 生产环境使用 `aliyun` provider。
- 后端保存验证码 5 分钟，登录成功或校验成功后消费掉验证码。
- 前端发送成功后做 60 秒倒计时，避免用户重复点击撞上阿里云分钟级限流。
- 阿里云失败时记录脱敏日志；限流错误转成用户可读提示，不向用户暴露原始错误栈。

## 推荐目录结构

按业务模块就近放置短信能力。如果项目已有 `h5`、`auth` 或 `user` 模块，优先放在对应模块下：

```text
src/modules/<feature>/
├── dto/
│   ├── send-sms-code.dto.ts
│   └── sms-login.dto.ts                 # 如需要手机号验证码登录
├── sms/
│   ├── aliyun-sms.provider.ts
│   ├── aliyun-sms.provider.spec.ts
│   ├── mock-sms.provider.ts
│   ├── sms-code.store.ts
│   └── sms.provider.ts
├── <feature>.controller.ts
├── <feature>.module.ts
└── <feature>.service.ts
```

如果多个模块都会发短信，可以抽成公共模块：

```text
src/modules/common/sms/
```

## 环境变量

`.env.example` 增加以下配置，不要提交真实密钥：

```bash
# SMS
# mock: 仅打印验证码日志；aliyun: 使用阿里云短信发送验证码
SMS_PROVIDER=mock
ALIYUN_SMS_ACCESS_KEY_ID=
ALIYUN_SMS_ACCESS_KEY_SECRET=
ALIYUN_SMS_REGION_ID=cn-hangzhou
ALIYUN_SMS_SIGN_NAME=
ALIYUN_SMS_TEMPLATE_CODE=
```

生产 `.env` 示例：

```bash
SMS_PROVIDER=aliyun
ALIYUN_SMS_ACCESS_KEY_ID=替换为阿里云 AccessKey ID
ALIYUN_SMS_ACCESS_KEY_SECRET=替换为阿里云 AccessKey Secret
ALIYUN_SMS_REGION_ID=cn-hangzhou
ALIYUN_SMS_SIGN_NAME=短信签名
ALIYUN_SMS_TEMPLATE_CODE=短信模板 CODE
```

安全要求：

- 真实 `AccessKey Secret` 只放部署环境或本地 `.env`，不要提交到 git。
- 建议使用 RAM 子账号，只授予短信发送所需权限。
- 线上日志不要打印完整手机号、验证码、AccessKey。

## 配置工厂

修改 `src/config/configuration.ts`：

```typescript
export default () => ({
  // ... existing config
  sms: {
    provider: process.env.SMS_PROVIDER || 'mock',
    aliyunAccessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID || '',
    aliyunAccessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || '',
    aliyunRegionId: process.env.ALIYUN_SMS_REGION_ID || 'cn-hangzhou',
    aliyunSignName: process.env.ALIYUN_SMS_SIGN_NAME || '',
    aliyunTemplateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || '',
  },
});
```

修改 `src/config/validation.ts`：

```typescript
export const validationSchema = Joi.object({
  // ... existing schema

  // SMS
  SMS_PROVIDER: Joi.string().valid('mock', 'aliyun').default('mock'),
  ALIYUN_SMS_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  ALIYUN_SMS_ACCESS_KEY_SECRET: Joi.string().allow('').default(''),
  ALIYUN_SMS_REGION_ID: Joi.string().default('cn-hangzhou'),
  ALIYUN_SMS_SIGN_NAME: Joi.string().allow('').default(''),
  ALIYUN_SMS_TEMPLATE_CODE: Joi.string().allow('').default(''),
});
```

注意：Joi 允许阿里云字段为空，是为了 `mock` provider 可以无密钥启动。真实发送前在 `AliyunSmsProvider` 内做必填校验。

## Provider 抽象

`sms.provider.ts`：

```typescript
export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

export interface SmsProvider {
  sendLoginCode(input: { code: string; phone: string }): Promise<void>;
}
```

`mock-sms.provider.ts`：

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from './sms.provider';

@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);

  async sendLoginCode(input: { code: string; phone: string }): Promise<void> {
    this.logger.log(`SMS login code for ${maskPhone(input.phone)}: ${input.code}`);
  }
}

function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
```

如果开发日志可以接受明文验证码，手机号必须脱敏。生产不要启用 mock provider。

## 阿里云 Provider

本方案不强制引入阿里云 SDK，直接按阿里云 RPC API 规则生成 HMAC-SHA1 签名，减少依赖和初始化复杂度。

`aliyun-sms.provider.ts`：

```typescript
import { createHmac, randomUUID } from 'crypto';
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms.provider';

interface AliyunSmsConfig {
  aliyunAccessKeyId: string;
  aliyunAccessKeySecret: string;
  aliyunRegionId: string;
  aliyunSignName: string;
  aliyunTemplateCode: string;
}

@Injectable()
export class AliyunSmsProvider implements SmsProvider {
  private readonly logger = new Logger(AliyunSmsProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async sendLoginCode(input: { code: string; phone: string }): Promise<void> {
    const sms = this.getConfig();
    const params: Record<string, string> = {
      AccessKeyId: sms.aliyunAccessKeyId,
      Action: 'SendSms',
      Format: 'JSON',
      PhoneNumbers: input.phone,
      RegionId: sms.aliyunRegionId,
      SignName: sms.aliyunSignName,
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: randomUUID(),
      SignatureVersion: '1.0',
      TemplateCode: sms.aliyunTemplateCode,
      TemplateParam: JSON.stringify({ code: input.code }),
      Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      Version: '2017-05-25',
    };
    const signature = signAliyunParams(
      'POST',
      params,
      sms.aliyunAccessKeySecret,
    );
    const body = new URLSearchParams({ ...params, Signature: signature });
    const response = await fetch('https://dysmsapi.aliyuncs.com/', {
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    });
    const payload = (await response.json()) as {
      Code?: string;
      Message?: string;
      RequestId?: string;
    };

    if (!response.ok || payload.Code !== 'OK') {
      this.logger.warn(
        `Aliyun SMS failed for ${maskPhone(input.phone)}: ${JSON.stringify({
          code: payload.Code,
          message: payload.Message,
          requestId: payload.RequestId,
          status: response.status,
        })}`,
      );

      if (isAliyunRateLimited(payload)) {
        throw new HttpException(
          '验证码发送太频繁，请 1 分钟后再试',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new InternalServerErrorException(
        payload.Message || '阿里云短信发送失败',
      );
    }
  }

  private getConfig(): AliyunSmsConfig {
    const sms = this.configService.get<AliyunSmsConfig>('sms');
    if (!sms) {
      throw new InternalServerErrorException('阿里云短信配置缺失');
    }

    const missingFields = [
      ['ALIYUN_SMS_ACCESS_KEY_ID', sms.aliyunAccessKeyId],
      ['ALIYUN_SMS_ACCESS_KEY_SECRET', sms.aliyunAccessKeySecret],
      ['ALIYUN_SMS_REGION_ID', sms.aliyunRegionId],
      ['ALIYUN_SMS_SIGN_NAME', sms.aliyunSignName],
      ['ALIYUN_SMS_TEMPLATE_CODE', sms.aliyunTemplateCode],
    ]
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      throw new InternalServerErrorException(
        `阿里云短信配置缺失: ${missingFields.join(', ')}`,
      );
    }

    return sms;
  }
}

function signAliyunParams(
  method: 'GET' | 'POST',
  params: Record<string, string>,
  accessKeySecret: string,
): string {
  const canonicalizedQuery = Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join('&');
  const stringToSign = [
    method,
    percentEncode('/'),
    percentEncode(canonicalizedQuery),
  ].join('&');
  return createHmac('sha1', `${accessKeySecret}&`)
    .update(stringToSign)
    .digest('base64');
}

function percentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~');
}

function isAliyunRateLimited(payload: {
  Code?: string;
  Message?: string;
}): boolean {
  return (
    payload.Code === 'isv.BUSINESS_LIMIT_CONTROL' ||
    payload.Message?.includes('流控') === true
  );
}

function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
```

阿里云分钟级限流常见返回：

```json
{
  "Code": "isv.BUSINESS_LIMIT_CONTROL",
  "Message": "触发分钟级流控Permits:1",
  "RequestId": "..."
}
```

日志需要保留 `Code`、`Message`、`RequestId`，便于后续补充精准映射。

## 验证码存储

推荐 Redis 优先，内存兜底仅用于开发和测试。

`sms-code.store.ts`：

```typescript
import { createHash, randomInt } from 'crypto';
import { Injectable, Optional } from '@nestjs/common';
import { RedisService } from '@/modules/common/redis/redis.service';

interface MemoryCodeRecord {
  codeHash: string;
  expiresAt: number;
}

@Injectable()
export class SmsCodeStore {
  private readonly memory = new Map<string, MemoryCodeRecord>();

  constructor(@Optional() private readonly redisService?: RedisService) {}

  async saveCode(input: {
    code: string;
    phone: string;
    ttlSeconds: number;
  }): Promise<void> {
    const key = this.buildKey(input.phone);
    const codeHash = this.hashCode(input.phone, input.code);
    if (this.redisService) {
      await this.redisService.set(key, codeHash, input.ttlSeconds);
      return;
    }

    this.memory.set(key, {
      codeHash,
      expiresAt: Date.now() + input.ttlSeconds * 1000,
    });
  }

  async consumeCode(phone: string, code: string): Promise<boolean> {
    const key = this.buildKey(phone);
    const expectedHash = this.hashCode(phone, code);
    if (this.redisService) {
      const storedHash = await this.redisService.get(key);
      if (!storedHash || storedHash !== expectedHash) return false;
      await this.redisService.del(key);
      return true;
    }

    const stored = this.memory.get(key);
    if (!stored || stored.expiresAt < Date.now()) {
      this.memory.delete(key);
      return false;
    }

    const matched = stored.codeHash === expectedHash;
    if (matched) this.memory.delete(key);
    return matched;
  }

  generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private buildKey(phone: string): string {
    return `sms:code:${phone}`;
  }

  private hashCode(phone: string, code: string): string {
    return createHash('sha256').update(`${phone}:${code}`).digest('hex');
  }
}
```

不要把验证码明文写入数据库。生产环境建议 Redis，避免多实例部署时内存验证码不共享。

## DTO 和控制器

`send-sms-code.dto.ts`：

```typescript
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class SendSmsCodeDto {
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('CN')
  phone: string;
}
```

控制器示例：

```typescript
@Post('sms-code')
@ApiOperation({ summary: '发送手机号登录验证码' })
sendCode(@Body() dto: SendSmsCodeDto) {
  return this.authService.sendCode(dto.phone);
}
```

Service 示例：

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly codeStore: SmsCodeStore,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
  ) {}

  async sendCode(phone: string) {
    const code = this.codeStore.generateCode();
    await this.codeStore.saveCode({ code, phone, ttlSeconds: 300 });
    await this.smsProvider.sendLoginCode({ code, phone });
    return { sent: true };
  }
}
```

## 模块注册

在业务模块中注册 Provider：

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AliyunSmsProvider } from './sms/aliyun-sms.provider';
import { MockSmsProvider } from './sms/mock-sms.provider';
import { SMS_PROVIDER } from './sms/sms.provider';
import { SmsCodeStore } from './sms/sms-code.store';

@Module({
  providers: [
    AuthService,
    SmsCodeStore,
    MockSmsProvider,
    AliyunSmsProvider,
    {
      inject: [ConfigService, MockSmsProvider, AliyunSmsProvider],
      provide: SMS_PROVIDER,
      useFactory: (
        configService: ConfigService,
        mock: MockSmsProvider,
        aliyun: AliyunSmsProvider,
      ) => (configService.get('sms.provider') === 'aliyun' ? aliyun : mock),
    },
  ],
})
export class AuthModule {}
```

如果 `SmsCodeStore` 需要 Redis，确保当前模块可以注入 `RedisService`，例如导入已有的 `RedisModule` 或把 Redis 模块设为全局模块。

## 限流策略

至少做两层限流：

1. 前端发送成功后 60 秒倒计时，防止用户连续点击。
2. 后端按 IP、手机号或设备维度限流，防止绕过前端。

阿里云自身也有限制，例如每分钟 1 条、每小时 5 条、每日 10 条。后端必须把阿里云限流转成友好提示：

```typescript
throw new HttpException(
  '验证码发送太频繁，请 1 分钟后再试',
  HttpStatus.TOO_MANY_REQUESTS,
);
```

注意 Nexus 当前全局 `HttpExceptionFilter` 可能把非 401 异常包装成 HTTP 200 + `code: -1`。如果前端依赖业务 `message` 展示，仍能展示友好文案；如果前端依赖 HTTP status，需要同步调整异常过滤器。

## 前端倒计时

前端框架不限。核心逻辑是“发送成功后再开始倒计时，失败不进入倒计时”。

Vue 3 示例：

```typescript
const sending = ref(false);
const resendSeconds = ref(0);
const sendButtonText = computed(() => {
  if (sending.value) return '发送中';
  if (resendSeconds.value > 0) return `${resendSeconds.value}s`;
  return '获取验证码';
});
let resendTimer: number | undefined;

async function onSendCode() {
  if (resendSeconds.value > 0) return;
  sending.value = true;
  try {
    await sendSmsCode(phone.value);
    startResendCountdown();
  } finally {
    sending.value = false;
  }
}

function startResendCountdown() {
  if (resendTimer) window.clearInterval(resendTimer);
  resendSeconds.value = 60;
  resendTimer = window.setInterval(() => {
    resendSeconds.value -= 1;
    if (resendSeconds.value <= 0 && resendTimer) {
      window.clearInterval(resendTimer);
      resendTimer = undefined;
    }
  }, 1000);
}

onBeforeUnmount(() => {
  if (resendTimer) window.clearInterval(resendTimer);
});
```

按钮：

```html
<button
  type="button"
  :disabled="sending || resendSeconds > 0"
  @click="onSendCode"
>
  {{ sendButtonText }}
</button>
```

## 测试清单

后端 Provider 测试重点：

- 配置缺失时快速失败，不请求阿里云。
- 发送成功时传入正确手机号、签名、模板 CODE 和 `TemplateParam`。
- 阿里云返回限流时打脱敏日志，并抛出友好提示。

Jest 示例断言：

```typescript
it('logs Aliyun response and exposes a friendly rate limit message', async () => {
  fetchMock.mockResolvedValueOnce({
    json: jest.fn().mockResolvedValue({
      Code: 'isv.BUSINESS_LIMIT_CONTROL',
      Message: '触发分钟级流控Permits:1',
      RequestId: 'request-1',
    }),
    ok: true,
  });
  const loggerWarn = jest
    .spyOn(Logger.prototype, 'warn')
    .mockImplementation(() => undefined);

  await expect(
    provider.sendLoginCode({ code: '123456', phone: '13800138000' }),
  ).rejects.toThrow('验证码发送太频繁，请 1 分钟后再试');

  expect(loggerWarn).toHaveBeenCalledWith(
    expect.stringContaining('isv.BUSINESS_LIMIT_CONTROL'),
  );
  expect(loggerWarn).toHaveBeenCalledWith(
    expect.stringContaining('138****8000'),
  );
});
```

验证码 Service 测试重点：

- 生成 6 位验证码。
- 保存验证码 TTL 为 300 秒。
- 调用当前配置的 SMS provider。
- 验证码消费成功后不能重复使用。

前端测试重点：

- 手机号格式不正确时不请求接口。
- 发送成功后按钮显示 `60s` 并禁用。
- 倒计时期间重复点击不会再次请求接口。
- 倒计时结束后按钮恢复“获取验证码”。
- 后端返回友好限流 message 时，Toast 展示该 message。

## 验证命令

按实际项目选择命令：

```bash
# 后端目标测试
pnpm test -- aliyun-sms.provider.spec.ts --runInBand
pnpm test -- auth.service.spec.ts --runInBand

# 后端构建
pnpm build

# 前端目标测试，如项目有前端
npm run test:unit -- Login.spec.ts
npm run build
```

如果项目使用 `pnpm` 且 lockfile 版本不兼容，不要让工具自动清理 `node_modules`。优先使用项目已有包管理器和本地二进制，例如 `./node_modules/.bin/vitest run ...`。

## 上线检查清单

- 阿里云短信签名已审核通过。
- 阿里云短信模板已审核通过，模板变量名与代码中的 `TemplateParam` 一致，例如 `{ "code": "123456" }`。
- `.env` 中 `SMS_PROVIDER=aliyun`。
- `.env` 中 AccessKey、签名、模板 CODE、Region 配置完整。
- 生产日志不会输出完整手机号、验证码或 AccessKey。
- 前端有 60 秒倒计时。
- 后端有 IP/手机号/设备维度限流。
- 阿里云限流返回已转成友好提示。
- 已跑目标测试和构建。

## 常见问题

### 用户看到 500 或“验证码发送失败”

检查 Provider 是否把阿里云非 OK 响应直接 `throw new Error(...)`。应改为：

- 记录脱敏日志。
- 已知限流转 `HttpStatus.TOO_MANY_REQUESTS` 和友好文案。
- 其他失败转 `InternalServerErrorException`，并保留日志中的 `Code`、`Message`、`RequestId`。

### 频繁触发阿里云分钟级流控

前端发送成功后加 60 秒倒计时。后端也要做限流，不能只依赖前端。

### 本地可用，线上验证码校验失败

如果线上多实例部署且验证码存在内存里，不同请求可能落到不同实例。生产必须使用 Redis 或其他共享存储。

### 阿里云签名错误

检查：

- 参数是否按 key 排序。
- `percentEncode` 是否处理了 `+`、`*`、`%7E`。
- `stringToSign` 是否为 `POST&%2F&<encoded canonical query>`。
- HMAC key 是否是 `${accessKeySecret}&`。

### 模板变量不匹配

阿里云模板里如果变量叫 `${code}`，代码应发送：

```typescript
TemplateParam: JSON.stringify({ code: input.code })
```

如果模板变量名不同，需要同步修改 `TemplateParam`。
