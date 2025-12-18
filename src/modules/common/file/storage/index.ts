import { ConfigService } from '@nestjs/config';
import { LocalStorage } from './local.storage';
import { OssStorage } from './oss.storage';
import { STORAGE_STRATEGY } from './storage.interface';

export * from './storage.interface';
export * from './local.storage';
export * from './oss.storage';

export const StorageStrategyProvider = {
  provide: STORAGE_STRATEGY,
  useFactory: (configService: ConfigService) => {
    const ossConfig = configService.get('oss');
    // 如果配置了 OSS 必要参数，则使用 OSS 存储
    if (
      ossConfig?.accessKeyId &&
      ossConfig?.accessKeySecret &&
      ossConfig?.bucket
    ) {
      return new OssStorage(configService);
    }
    // 否则使用本地存储
    return new LocalStorage(configService);
  },
  inject: [ConfigService],
};
