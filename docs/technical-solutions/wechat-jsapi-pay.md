# 微信支付 JSAPI 接入方案

<!-- AI Context: 本文档用于在 Nexus/NestJS + H5 项目中快速接入微信支付 JSAPI。实现前先读取本文档，再按当前项目的订单模型、响应格式和前端状态管理做最小适配。 -->

## 适用场景

适用于微信公众号/H5 页面内调起微信 JSAPI 支付。本文方案覆盖两种模式：

- `wechat_jsapi`：普通直连商户 JSAPI 支付。
- `wechat_partner_jsapi`：服务商模式 JSAPI 支付。

推荐策略：

- 开发环境使用 `mock` payment provider。
- 生产环境按商户形态启用 `wechat_jsapi` 或 `wechat_partner_jsapi`。
- 服务端负责创建支付单、签名请求微信、验签微信应答、解密回调、幂等入账。
- 前端只负责获取 OpenID、创建支付单、调起 `WeixinJSBridge`、轮询支付结果和展示状态。
- 支付单创建必须幂等，未过期订单优先复用已有 `PENDING` 支付单。

## 整体链路

```text
H5 支付页
  -> 判断是否微信内置浏览器
  -> 无 openid 时跳转后端 OAuth 授权
  -> 后端回调带 openid 回到 /pay
  -> H5 调 POST /api/h5/payments 创建或复用支付单
  -> 后端请求微信 v3 JSAPI 下单，返回 payParams
  -> H5 调 WeixinJSBridge.invoke('getBrandWCPayRequest')
  -> 微信支付回调 POST /api/h5/payments/wechat/notify
  -> 后端验签、解密、幂等更新支付单和订单
  -> H5 轮询 GET /api/h5/payments/:paymentNo 确认结果
```

## 推荐目录结构

后端：

```text
src/modules/business/payment/
├── dto/
│   ├── create-payment.dto.ts
│   └── query-admin-payments.dto.ts       # 如需要后台流水
├── mock-payment.provider.ts
├── payment-provider.interface.ts
├── payment.controller.ts
├── payment.module.ts
├── payment.service.ts
├── payment.service.spec.ts
├── wechat-pay-partner-jsapi.provider.ts
└── wechat-pay-partner-jsapi.provider.spec.ts
```

前端：

```text
h5/src/
├── api/h5.ts
├── stores/flow.ts
├── utils/wechat-pay.ts
├── utils/wechat-pay.spec.ts
├── views/Pay.vue
└── views/Pay.spec.ts
```

## 环境变量

`.env.example` 增加：

```bash
# Payment
# mock | wechat_jsapi | wechat_partner_jsapi
PAYMENT_PROVIDER=mock

# WeChat Official Account OAuth
WECHAT_OFFICIAL_ACCOUNT_APP_ID=
WECHAT_OFFICIAL_ACCOUNT_APP_SECRET=
WECHAT_OFFICIAL_ACCOUNT_TOKEN=
WECHAT_OFFICIAL_ACCOUNT_ENCODING_AES_KEY=

# WeChat Pay v3 - JSAPI / Partner JSAPI
WECHAT_PAY_APP_ID=
WECHAT_PAY_API_V3_KEY=
WECHAT_PAY_API_BASE_URL=https://api.mch.weixin.qq.com
WECHAT_PAY_CURRENCY=CNY
WECHAT_PAY_MCH_ID=
WECHAT_PAY_MERCHANT_SERIAL_NO=
WECHAT_PAY_NOTIFY_URL=
WECHAT_PAY_PRIVATE_KEY=
WECHAT_PAY_PRIVATE_KEY_PATH=
WECHAT_PAY_PUBLIC_KEY=
WECHAT_PAY_PUBLIC_KEY_ID=
WECHAT_PAY_PUBLIC_KEY_PATH=
WECHAT_PAY_SP_APP_ID=
WECHAT_PAY_SP_MCH_ID=
WECHAT_PAY_SUB_APP_ID=
WECHAT_PAY_SUB_MCH_ID=
```

直连商户常用字段：

```bash
PAYMENT_PROVIDER=wechat_jsapi
WECHAT_PAY_APP_ID=公众号或小程序 appid
WECHAT_PAY_MCH_ID=直连商户号
WECHAT_PAY_MERCHANT_SERIAL_NO=商户 API 证书序列号
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/h5/payments/wechat/notify
WECHAT_PAY_API_V3_KEY=32字节 APIV3 Key
WECHAT_PAY_PRIVATE_KEY_PATH=/secure/path/apiclient_key.pem
WECHAT_PAY_PUBLIC_KEY_ID=微信支付公钥 ID
WECHAT_PAY_PUBLIC_KEY_PATH=/secure/path/pub_key.pem
```

服务商模式常用字段：

```bash
PAYMENT_PROVIDER=wechat_partner_jsapi
WECHAT_PAY_SP_APP_ID=服务商公众号 appid
WECHAT_PAY_SP_MCH_ID=服务商商户号
WECHAT_PAY_SUB_APP_ID=子商户公众号 appid，可为空
WECHAT_PAY_SUB_MCH_ID=子商户号
WECHAT_PAY_MERCHANT_SERIAL_NO=服务商商户 API 证书序列号
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/h5/payments/wechat/notify
WECHAT_PAY_API_V3_KEY=32字节 APIV3 Key
WECHAT_PAY_PRIVATE_KEY_PATH=/secure/path/apiclient_key.pem
WECHAT_PAY_PUBLIC_KEY_ID=微信支付公钥 ID
WECHAT_PAY_PUBLIC_KEY_PATH=/secure/path/pub_key.pem
```

安全要求：

- 商户私钥、APIV3 Key 不要提交到 git。
- 生产建议使用 `WECHAT_PAY_PRIVATE_KEY_PATH` 和 `WECHAT_PAY_PUBLIC_KEY_PATH`，把密钥文件放到部署机安全目录。
- 如果必须通过环境变量注入 PEM，代码要把 `\\n` 还原为真实换行。
- `WECHAT_PAY_NOTIFY_URL` 必须是公网 HTTPS 地址，且能被微信支付服务器访问。

## 配置工厂

`src/config/configuration.ts`：

```typescript
export default () => ({
  // ... existing config
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'mock',
  },
  wechatPay: {
    partnerJsapi: {
      appId:
        process.env.WECHAT_PAY_APP_ID ||
        process.env.WECHAT_OFFICIAL_ACCOUNT_APP_ID ||
        '',
      apiV3Key: process.env.WECHAT_PAY_API_V3_KEY || '',
      apiBaseUrl:
        process.env.WECHAT_PAY_API_BASE_URL || 'https://api.mch.weixin.qq.com',
      currency: process.env.WECHAT_PAY_CURRENCY || 'CNY',
      mchId: process.env.WECHAT_PAY_MCH_ID || '',
      merchantSerialNo: process.env.WECHAT_PAY_MERCHANT_SERIAL_NO || '',
      notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || '',
      privateKey: process.env.WECHAT_PAY_PRIVATE_KEY || '',
      privateKeyPath: process.env.WECHAT_PAY_PRIVATE_KEY_PATH || '',
      publicKey: process.env.WECHAT_PAY_PUBLIC_KEY || '',
      publicKeyId: process.env.WECHAT_PAY_PUBLIC_KEY_ID || '',
      publicKeyPath: process.env.WECHAT_PAY_PUBLIC_KEY_PATH || '',
      spAppId: process.env.WECHAT_PAY_SP_APP_ID || '',
      spMchId: process.env.WECHAT_PAY_SP_MCH_ID || '',
      subAppId: process.env.WECHAT_PAY_SUB_APP_ID || '',
      subMchId: process.env.WECHAT_PAY_SUB_MCH_ID || '',
    },
  },
});
```

`src/config/validation.ts`：

```typescript
export const validationSchema = Joi.object({
  // ... existing schema

  PAYMENT_PROVIDER: Joi.string()
    .valid('mock', 'wechat_jsapi', 'wechat_partner_jsapi')
    .default('mock'),

  WECHAT_PAY_APP_ID: Joi.string().allow('').default(''),
  WECHAT_PAY_API_V3_KEY: Joi.string().allow('').default(''),
  WECHAT_PAY_API_BASE_URL: Joi.string()
    .uri()
    .default('https://api.mch.weixin.qq.com'),
  WECHAT_PAY_CURRENCY: Joi.string().default('CNY'),
  WECHAT_PAY_MCH_ID: Joi.string().allow('').default(''),
  WECHAT_PAY_MERCHANT_SERIAL_NO: Joi.string().allow('').default(''),
  WECHAT_PAY_NOTIFY_URL: Joi.string().allow('').default(''),
  WECHAT_PAY_PRIVATE_KEY: Joi.string().allow('').default(''),
  WECHAT_PAY_PRIVATE_KEY_PATH: Joi.string().allow('').default(''),
  WECHAT_PAY_PUBLIC_KEY: Joi.string().allow('').default(''),
  WECHAT_PAY_PUBLIC_KEY_ID: Joi.string().allow('').default(''),
  WECHAT_PAY_PUBLIC_KEY_PATH: Joi.string().allow('').default(''),
  WECHAT_PAY_SP_APP_ID: Joi.string().allow('').default(''),
  WECHAT_PAY_SP_MCH_ID: Joi.string().allow('').default(''),
  WECHAT_PAY_SUB_APP_ID: Joi.string().allow('').default(''),
  WECHAT_PAY_SUB_MCH_ID: Joi.string().allow('').default(''),
});
```

Joi 允许为空，是为了 `mock` 模式能启动。真实支付参数在 Provider `getConfig()` 中快速失败。

## rawBody 要求

微信支付回调验签必须使用原始请求体。Nest 默认 body parser 会丢失 raw body，因此 `main.ts` 需要保存：

```typescript
import { json, urlencoded } from 'express';
import { IncomingMessage } from 'http';

interface RawBodyIncomingMessage extends IncomingMessage {
  rawBody?: Buffer;
}

app.use(
  json({
    verify: (request: RawBodyIncomingMessage, _response, buffer) => {
      request.rawBody = Buffer.from(buffer);
    },
  }),
);
app.use(
  urlencoded({
    extended: true,
    verify: (request: RawBodyIncomingMessage, _response, buffer) => {
      request.rawBody = Buffer.from(buffer);
    },
  }),
);
```

如果项目用其他全局 body parser，也要确保回调接口能拿到 raw body。

## Provider 抽象

`payment-provider.interface.ts`：

```typescript
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface CreateProviderPaymentInput {
  amountFen: number;
  expiresAt?: Date | null;
  orderNo: string;
  payerOpenId?: string;
  paymentNo: string;
  subject: string;
}

export interface CreateProviderPaymentResult {
  providerPayload: Record<string, unknown>;
  providerTradeNo?: string;
}

export interface PaymentProviderNotifyResult {
  amountFen?: number;
  paid: boolean;
  paidAt?: Date;
  paymentNo: string;
  providerTradeNo?: string;
  raw: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly provider: string;

  createPayment(
    input: CreateProviderPaymentInput,
  ): Promise<CreateProviderPaymentResult>;

  parsePaymentNotify(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ): PaymentProviderNotifyResult;

  queryPayment(paymentNo: string): Promise<PaymentProviderNotifyResult>;
}
```

## 微信支付 Provider

Provider 需要处理 4 件事：

1. JSAPI 下单。
2. 生成前端 `payParams`。
3. 查询支付结果。
4. 回调验签和资源解密。

核心片段：

```typescript
@Injectable()
export class WechatPayPartnerJsapiProvider implements PaymentProvider {
  readonly provider: string;

  constructor(private readonly configService: ConfigService) {
    this.provider =
      this.configService.get<string>('payment.provider') === 'wechat_jsapi'
        ? 'wechat_jsapi'
        : 'wechat_partner_jsapi';
  }

  async createPayment(
    input: CreateProviderPaymentInput,
  ): Promise<CreateProviderPaymentResult> {
    if (!input.payerOpenId) {
      throw new BadRequestException('微信 JSAPI 支付需要 payerOpenId');
    }

    const config = this.getConfig();
    const requestBody = this.createOrderRequestBody(input, config);
    const response = await this.requestWechatPay<{ prepay_id?: string }>(
      'POST',
      this.getCreatePaymentPath(),
      requestBody,
      config,
    );

    if (!response.prepay_id) {
      throw new BadRequestException('微信支付下单未返回 prepay_id');
    }

    return {
      providerPayload: {
        payParams: this.createJsapiPayParams(response.prepay_id, config),
        prepayId: response.prepay_id,
        provider: this.provider,
        raw: response,
      },
      providerTradeNo: response.prepay_id,
    };
  }
}
```

直连商户下单 body：

```typescript
return {
  amount: { currency: config.currency, total: input.amountFen },
  appid: config.appId,
  description: input.subject.slice(0, 127),
  mchid: config.mchId,
  notify_url: config.notifyUrl,
  out_trade_no: input.paymentNo,
  payer: { openid: input.payerOpenId },
  ...(input.expiresAt ? { time_expire: input.expiresAt.toISOString() } : {}),
};
```

服务商下单 body：

```typescript
const payer = config.subAppId
  ? { sub_openid: input.payerOpenId }
  : { sp_openid: input.payerOpenId };

return {
  amount: { currency: config.currency, total: input.amountFen },
  description: input.subject.slice(0, 127),
  notify_url: config.notifyUrl,
  out_trade_no: input.paymentNo,
  payer,
  sp_appid: config.spAppId,
  sp_mchid: config.spMchId,
  ...(config.subAppId ? { sub_appid: config.subAppId } : {}),
  sub_mchid: config.subMchId,
  ...(input.expiresAt ? { time_expire: input.expiresAt.toISOString() } : {}),
};
```

生成前端支付参数：

```typescript
private createJsapiPayParams(prepayId: string, config: WechatPayPartnerJsapiConfig) {
  const appId = this.isDirectMerchant()
    ? config.appId
    : config.subAppId || config.spAppId;
  const nonceStr = crypto.randomUUID().replaceAll('-', '');
  const packageValue = `prepay_id=${prepayId}`;
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const paySign = this.rsaSha256Sign(
    [appId, timeStamp, nonceStr, packageValue].join('\n') + '\n',
    this.getPrivateKey(config),
  );

  return {
    appId,
    nonceStr,
    package: packageValue,
    paySign,
    signType: 'RSA',
    timeStamp,
  };
}
```

微信支付 v3 请求签名：

```typescript
const bodyText = body ? JSON.stringify(body) : '';
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonceStr = crypto.randomUUID().replaceAll('-', '');
const signature = this.rsaSha256Sign(
  [method, path, timestamp, nonceStr, bodyText].join('\n') + '\n',
  this.getPrivateKey(config),
);
```

Authorization：

```typescript
Authorization: `WECHATPAY2-SHA256-RSA2048 ${[
  `mchid="${this.getAuthMchId(config)}"`,
  `nonce_str="${nonceStr}"`,
  `signature="${signature}"`,
  `serial_no="${config.merchantSerialNo}"`,
  `timestamp="${timestamp}"`,
].join(',')}`,
```

路径选择：

```typescript
private getCreatePaymentPath(): string {
  return this.isDirectMerchant()
    ? '/v3/pay/transactions/jsapi'
    : '/v3/pay/partner/transactions/jsapi';
}

private getQueryPaymentPathPrefix(): string {
  return this.isDirectMerchant()
    ? '/v3/pay/transactions/out-trade-no'
    : '/v3/pay/partner/transactions/out-trade-no';
}
```

## 回调验签和解密

微信回调处理顺序：

1. 用微信支付平台公钥验签。
2. 用 APIV3 Key 解密 `resource`。
3. 从解密后的 transaction 读取 `out_trade_no`、`transaction_id`、`trade_state`、`success_time`、`amount`。
4. 映射成内部支付结果。

验签：

```typescript
private verifyWechatPaySignature(
  headers: WechatPayHeaders,
  bodyText: string,
  config: WechatPayPartnerJsapiConfig,
) {
  const timestamp = headers.get('wechatpay-timestamp') || '';
  const nonce = headers.get('wechatpay-nonce') || '';
  const signature = headers.get('wechatpay-signature') || '';
  const serial = headers.get('wechatpay-serial') || '';

  if (!timestamp || !nonce || !signature || !serial) {
    throw new BadRequestException('微信支付应答签名参数不完整');
  }

  if (serial !== config.publicKeyId) {
    throw new BadRequestException('微信支付公钥 ID 不匹配');
  }

  const ok = crypto
    .createVerify('RSA-SHA256')
    .update(`${timestamp}\n${nonce}\n${bodyText}\n`)
    .verify(this.getPublicKey(config), signature, 'base64');

  if (!ok) {
    throw new BadRequestException('微信支付应答签名校验失败');
  }
}
```

解密：

```typescript
private decryptNotifyResource(
  body: WechatPayNotificationBody,
  config: WechatPayPartnerJsapiConfig,
): WechatPayTransaction {
  const resource = body.resource;

  if (
    !resource ||
    resource.algorithm !== 'AEAD_AES_256_GCM' ||
    !resource.ciphertext ||
    !resource.nonce
  ) {
    throw new BadRequestException('微信支付回调资源参数不完整');
  }

  const apiV3Key = Buffer.from(config.apiV3Key, 'utf8');
  if (apiV3Key.length !== 32) {
    throw new BadRequestException('微信支付 APIV3 密钥长度必须为 32 字节');
  }

  const encrypted = Buffer.from(resource.ciphertext, 'base64');
  const authTag = encrypted.subarray(encrypted.length - 16);
  const ciphertext = encrypted.subarray(0, encrypted.length - 16);
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    apiV3Key,
    resource.nonce,
  );

  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
  }

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');

  return JSON.parse(decrypted) as WechatPayTransaction;
}
```

映射内部结果：

```typescript
private toPaymentResult(
  transaction: WechatPayTransaction,
): PaymentProviderNotifyResult {
  if (!transaction.out_trade_no) {
    throw new BadRequestException('微信支付结果缺少商户支付单号');
  }

  return {
    amountFen: transaction.amount?.payer_total ?? transaction.amount?.total,
    paid: transaction.trade_state === 'SUCCESS',
    paidAt: transaction.success_time
      ? new Date(transaction.success_time)
      : undefined,
    paymentNo: transaction.out_trade_no,
    providerTradeNo: transaction.transaction_id,
    raw: transaction as Record<string, unknown>,
  };
}
```

## PaymentService 业务规则

支付 Service 不应只是透传微信接口，它要负责业务一致性：

- 根据 `orderNo + orderToken + deviceId` 查找订单。
- 订单不存在返回“订单不存在或不属于当前设备”。
- 订单已解锁时直接返回成功状态，不创建新支付单。
- 订单已过期时标记订单和 pending 支付单为 `EXPIRED`。
- 未过期订单复用最新可用 pending 支付单。
- 新支付先创建本地 `PaymentTransaction` 占位，再请求微信下单。
- 微信下单失败时把本地支付单标记 `FAILED`，再抛出原始错误。
- 回调或查询确认支付成功时，校验金额、过期时间，幂等解锁订单。

创建支付单接口建议返回：

```typescript
interface CreatePaymentResult {
  paymentNo: string;
  amountFen: number;
  status: PaymentStatus;
  expiresAt?: string;
  providerPayload?: {
    payParams?: WechatJsapiPayParams;
    prepayId?: string;
    provider?: string;
  };
  order?: {
    orderNo: string;
    status: OrderStatus;
    songTitle: string;
    subject: string;
  };
}
```

支付回调要保存事件日志，便于排查重复通知、延迟通知、金额不一致和签名问题：

```text
PaymentNotifyLog
├── paymentId
├── paymentNo
├── provider
├── providerTradeNo
├── eventType       # notify | query
├── tradeState
├── amountFen
├── paidAt
├── rawPayload
├── headers
├── signatureValid
├── handled
└── handleMessage
```

如果当前项目还没有回调日志表，新增表结构前必须按 `docs/prisma-change-standard.md` 走 Prisma Migrate。

## Controller

H5 支付接口：

```typescript
@ApiTags('H5 - 支付')
@Controller('h5/payments')
export class H5PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: '创建 H5 支付单' })
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentService.createPayment(dto);
  }

  @Post(':paymentNo/mock-confirm')
  @ApiOperation({ summary: '模拟支付确认' })
  mockConfirm(@Param('paymentNo') paymentNo: string) {
    return this.paymentService.mockConfirm(paymentNo);
  }

  @Post('wechat/notify')
  @ApiOperation({ summary: '微信支付结果通知' })
  async handleWechatPayNotify(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() request: RawBodyRequest,
    @Res() response: Response,
  ) {
    const result = await this.paymentService.handleProviderNotify(
      this.readRawBody(request),
      headers,
    );

    response.status(200).json(result);
  }

  @Get(':paymentNo')
  @ApiOperation({ summary: '查询支付单状态' })
  queryPayment(@Param('paymentNo') paymentNo: string) {
    return this.paymentService.queryPayment(paymentNo);
  }
}
```

微信回调成功响应必须是：

```json
{
  "code": "SUCCESS",
  "message": "成功"
}
```

回调接口使用 `@Res()` 直接响应，是为了避免全局响应拦截器把微信要求的格式包一层。

## 模块注册

```typescript
@Module({
  controllers: [H5PaymentController, AdminPaymentController],
  providers: [
    PaymentService,
    MockPaymentProvider,
    WechatPayPartnerJsapiProvider,
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (
        configService: ConfigService,
        mockProvider: MockPaymentProvider,
        wechatPayProvider: WechatPayPartnerJsapiProvider,
      ) => {
        const provider = configService.get<string>('payment.provider');

        return provider === 'wechat_partner_jsapi' || provider === 'wechat_jsapi'
          ? wechatPayProvider
          : mockProvider;
      },
      inject: [
        ConfigService,
        MockPaymentProvider,
        WechatPayPartnerJsapiProvider,
      ],
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
```

## H5 前端：API 类型

`h5/src/api/h5.ts`：

```typescript
export interface WechatJsapiPayParams {
  appId: string;
  nonceStr: string;
  package: string;
  paySign: string;
  signType: 'RSA';
  timeStamp: string;
}

export type PaymentStatus =
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED'
  | 'PENDING'
  | 'SUCCESS';

export interface CreatePaymentResult {
  paymentNo: string;
  amountFen: number;
  status: PaymentStatus;
  expiresAt?: string;
  providerPayload?: {
    payParams?: WechatJsapiPayParams;
    prepayId?: string;
    provider?: string;
  };
  order?: {
    orderNo: string;
    status: OrderStatus;
    songTitle: string;
    subject: string;
  };
}

export function createPayment(input: {
  deviceId: string;
  orderNo: string;
  orderToken: string;
  payerOpenId?: string;
}) {
  return request<CreatePaymentResult>('/h5/payments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function queryPayment(paymentNo: string) {
  return request<PaymentStatusResult>(`/h5/payments/${paymentNo}`);
}
```

## H5 前端：微信支付工具

`h5/src/utils/wechat-pay.ts`：

```typescript
export interface WechatJsapiPayParams {
  appId: string;
  nonceStr: string;
  package: string;
  paySign: string;
  signType: 'RSA';
  timeStamp: string;
}

export interface WechatJsapiPayResult {
  errMsg: string;
  paid: boolean;
}

interface WeixinJSBridgeLike {
  invoke(
    name: 'getBrandWCPayRequest',
    params: WechatJsapiPayParams,
    callback: (response: { err_msg?: string }) => void,
  ): void;
}

declare global {
  interface Window {
    WeixinJSBridge?: WeixinJSBridgeLike;
  }
}

export function isWechatBrowser(userAgent = window.navigator.userAgent) {
  return /MicroMessenger/i.test(userAgent);
}

export function getPayerOpenIdFromQuery(query: LocationQuery) {
  return readQueryValue(query.payerOpenId) || readQueryValue(query.openid);
}

export function startWechatOAuth() {
  const redirect = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams({ redirect });
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  window.location.assign(
    `${apiBaseUrl}/wechat/official-account/oauth/authorize?${params.toString()}`,
  );
}

export function requestWechatJsapiPayment(
  params: WechatJsapiPayParams,
): Promise<WechatJsapiPayResult> {
  return new Promise((resolve, reject) => {
    const invokePayment = () => {
      const bridge = window.WeixinJSBridge;

      if (!bridge) {
        reject(new Error('微信支付组件未准备好，请在微信内重新打开页面'));
        return;
      }

      bridge.invoke('getBrandWCPayRequest', params, (response) => {
        const errMsg = response.err_msg || '';
        resolve({
          errMsg,
          paid: errMsg.endsWith(':ok'),
        });
      });
    };

    if (window.WeixinJSBridge) {
      invokePayment();
      return;
    }

    document.addEventListener('WeixinJSBridgeReady', invokePayment, {
      once: true,
    });
  });
}
```

要点：

- 非微信浏览器不能真实调起 JSAPI 支付，应展示“请在微信内打开”。
- 真实支付模式下没有 `openid` 时，先走后端公众号 OAuth。
- `WeixinJSBridge.invoke` 返回 `:ok` 才表示前端调起结果成功。
- 前端成功调起后仍要轮询后端支付状态，不能只信任前端回调。

## H5 前端：支付页状态机

推荐状态：

```typescript
type PayState =
  | 'checking'
  | 'creating'
  | 'error'
  | 'expired'
  | 'missing'
  | 'needOpenId'
  | 'pending'
  | 'success'
  | 'unfinished'
  | 'wechatOnly';
```

页面初始化：

```typescript
onMounted(() => {
  syncPaymentRoute();

  timer = window.setInterval(() => {
    now.value = Date.now();
    if (
      remainingSeconds.value !== null &&
      remainingSeconds.value <= 0 &&
      payState.value === 'pending'
    ) {
      payState.value = 'expired';
      errorMessage.value = '订单已过期，请重新生成';
    }
  }, 1000);

  void ensurePayment();
});
```

创建或恢复支付单：

```typescript
async function ensurePayment() {
  if (!flowStore.orderNo || !flowStore.orderToken) {
    payState.value = 'missing';
    return;
  }

  if (realWechatPayEnabled && !isWechatBrowser()) {
    payState.value = 'wechatOnly';
    return;
  }

  const payerOpenId = getPayerOpenIdFromQuery(route.query);
  if (realWechatPayEnabled && !payerOpenId) {
    payState.value = 'creating';
    errorMessage.value = '';
    startWechatOAuth();
    return;
  }

  if (flowStore.orderStatus === 'UNLOCKED') {
    payState.value = 'success';
    return;
  }

  if (flowStore.paymentNo) {
    const status = await refreshPaymentStatus();
    if (status === 'paid' || status === 'expired') return;
    payState.value = 'pending';
    return;
  }

  payState.value = 'creating';
  errorMessage.value = '';
  try {
    const payment = await createPayment({
      deviceId: sessionStore.deviceId,
      orderNo: flowStore.orderNo,
      orderToken: flowStore.orderToken,
      payerOpenId: payerOpenId || undefined,
    });
    flowStore.savePayment(payment);
    paymentInfoLoaded.value = true;
    if (payment.status === 'SUCCESS' || payment.order?.status === 'UNLOCKED') {
      payState.value = 'success';
      return;
    }

    payState.value = payment.status === 'EXPIRED' ? 'expired' : 'pending';
    if (payState.value === 'expired') {
      errorMessage.value = '订单已过期，请重新生成';
    }
  } catch (error) {
    applyPaymentError(error);
  }
}
```

调起微信支付：

```typescript
async function startWechatPayment() {
  if (!flowStore.paymentNo) {
    await ensurePayment();
  }

  let payParams = flowStore.paymentPayload?.payParams;
  if (!payParams && flowStore.paymentNo) {
    const status = await refreshPaymentStatus();
    if (status === 'expired') return;
    payParams = flowStore.paymentPayload?.payParams;
  }

  if (!payParams) {
    payState.value = 'error';
    errorMessage.value = '支付参数已失效，请重新进入支付页';
    return;
  }

  payState.value = 'creating';
  errorMessage.value = '';

  try {
    const result = await requestWechatJsapiPayment(payParams);

    if (!result.paid) {
      payState.value = 'unfinished';
      errorMessage.value = '你取消了支付，请重新尝试';
      return;
    }

    await waitPaymentSuccess();
  } catch (error) {
    payState.value = 'error';
    errorMessage.value = error instanceof Error ? error.message : '微信支付调起失败';
  }
}
```

确认支付结果：

```typescript
async function waitPaymentSuccess() {
  payState.value = 'checking';

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const status = await refreshPaymentStatus();
    if (status === 'paid' || status === 'expired') return;

    await new Promise((resolve) => window.setTimeout(resolve, 1200));
  }

  if (payState.value === 'checking') {
    payState.value = 'pending';
    errorMessage.value = '支付结果确认中，请稍后刷新';
  }
}
```

## 前端展示要点

支付页应该展示服务端真实信息：

- 金额：`payment.amountFen`。
- 商品名：`payment.order.subject`。
- 订单号：`orderNo`。
- 支付单号：`paymentNo`。
- 收款方。
- 剩余支付时间：基于服务端 `expiresAt` 计算。

不要写死金额和商品名兜底。没有加载到支付信息前显示 `--` 或“正在获取支付信息”。

按钮禁用条件：

```typescript
payState === 'creating' ||
payState === 'checking' ||
payState === 'expired' ||
payState === 'missing' ||
payState === 'needOpenId' ||
payState === 'success' ||
payState === 'wechatOnly'
```

## OpenID 和 OAuth

JSAPI 支付必须有用户 OpenID。推荐链路：

1. H5 支付页读取 query 中的 `payerOpenId` 或 `openid`。
2. 如果真实支付模式下没有 OpenID，跳转后端 OAuth authorize：

```text
/api/wechat/official-account/oauth/authorize?redirect=/pay?orderNo=...&orderToken=...
```

3. 后端 OAuth callback 获取 OpenID 后重定向回原始 `redirect`，附加 `openid`。
4. H5 用 query 中 OpenID 创建支付单。

注意：

- 微信网页授权域名必须配置正确。
- OAuth redirect 要保留 `orderNo`、`orderToken`、`paymentNo` 等业务 query。
- 服务商模式下如果配置了 `subAppId`，下单使用 `sub_openid`；否则使用 `sp_openid`。

## Mock 支付

开发环境保留 mock provider：

- `PAYMENT_PROVIDER=mock`。
- H5 调 `POST /api/h5/payments/:paymentNo/mock-confirm`。
- 真实支付模式下 mock confirm 必须拒绝：

```typescript
if (this.provider.provider !== 'mock') {
  throw new BadRequestException('真实支付模式不允许模拟确认');
}
```

这样可以避免测试按钮在线上误入账。

## 测试清单

后端 Provider 测试：

- 服务商 JSAPI 下单路径为 `/v3/pay/partner/transactions/jsapi`。
- 直连 JSAPI 下单路径为 `/v3/pay/transactions/jsapi`。
- 缺少 `payerOpenId` 时不请求微信。
- Authorization 使用 `WECHATPAY2-SHA256-RSA2048`，并包含正确 `mchid`。
- 微信应答签名缺失或错误时拒绝。
- 回调能验签、解密并映射为内部支付结果。

后端 PaymentService 测试：

- 订单不存在或设备不匹配时拒绝。
- 已解锁订单直接返回成功，不创建支付单。
- 未过期订单复用 pending 支付单。
- 过期订单标记订单和 pending 支付单为 `EXPIRED`。
- 新支付创建本地支付单，再请求 provider。
- provider 下单失败时本地支付单标记 `FAILED`。
- 微信回调支付成功时幂等解锁订单。
- 重复回调不会重复入账。
- 金额不一致时拒绝入账并记录日志。
- 查询支付单时发现微信已支付，也能更新本地状态。

H5 测试：

- 非微信浏览器真实支付模式展示 `wechatOnly`。
- 无 OpenID 时跳转 OAuth authorize。
- 有未完成 `paymentNo` 时先查询支付单。
- 创建支付单后展示服务端返回金额、商品名、支付单号。
- 点击支付时调用 `WeixinJSBridge.invoke('getBrandWCPayRequest')`。
- 用户取消支付时显示可重试状态。
- 支付成功后轮询后端状态，成功后展示成功页。
- 支付超时或订单过期后隐藏支付动作。

## 验证命令

按项目实际脚本执行：

```bash
# 后端支付 Provider 测试
pnpm test -- wechat-pay-partner-jsapi.provider.spec.ts --runInBand

# 后端支付服务测试
pnpm test -- payment.service.spec.ts --runInBand

# 后端构建
pnpm build

# H5 支付工具和页面测试
npm run test:unit -- wechat-pay.spec.ts Pay.spec.ts

# H5 构建
npm run build
```

如果支付涉及数据库 schema 或回调日志表，必须先阅读：

```text
docs/prisma-change-standard.md
```

## 上线检查清单

- 微信商户号、公众号 appid、商户证书序列号正确。
- APIV3 Key 为 32 字节。
- 商户私钥可读，格式为 PEM。
- 微信支付平台公钥或证书配置正确，`publicKeyId` 与回调 header `wechatpay-serial` 匹配。
- `WECHAT_PAY_NOTIFY_URL` 是公网 HTTPS，路径能路由到回调控制器。
- `main.ts` 保留 rawBody。
- 公众号网页授权域名已配置。
- 前端生产环境 `VITE_PAYMENT_PROVIDER` 与后端 `PAYMENT_PROVIDER` 一致。
- 真实支付模式只允许微信内置浏览器调起。
- mock confirm 在真实支付模式下不可用。
- 已跑 Provider、Service、H5 支付页测试和构建。

## 常见问题

### 微信回调验签失败

检查 raw body 是否保留；验签字符串必须是：

```text
timestamp\nnonce\nbody\n
```

还要确认 `wechatpay-serial` 是否等于配置的 `WECHAT_PAY_PUBLIC_KEY_ID`。

### APIV3 解密失败

检查 `WECHAT_PAY_API_V3_KEY` 是否为 32 字节，是否与商户平台配置一致。`resource.associated_data` 存在时必须作为 AAD 参与解密。

### JSAPI 提示缺少 OpenID

确认 H5 支付页是否在微信内，OAuth callback 是否把 `openid` 传回 `/pay`，以及服务商模式下应使用 `sub_openid` 还是 `sp_openid`。

### 前端显示支付成功但订单没解锁

前端 `WeixinJSBridge` 返回 `:ok` 只说明用户端支付流程完成，不代表后端已入账。必须轮询 `GET /api/h5/payments/:paymentNo`，以后端状态为准。

### 支付单越来越多

缺少支付单复用逻辑。创建支付单前应查找同订单、同 provider、同金额、未过期的 `PENDING` 支付单并复用。

### 订单过期后仍能支付

创建支付单、查询支付单、mock confirm、回调入账前都要检查过期。回调支付成功时间早于过期时间时可入账；晚于过期时间时应记录异常并进入人工处理或退款流程。

### 微信下单失败后本地一直 pending

请求微信下单前先创建本地占位支付单时，provider 下单失败要把占位支付单标记为 `FAILED`，避免前端后续复用坏单。
