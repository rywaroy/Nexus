import { SetMetadata } from '@nestjs/common';
import { BusinessTypeEnum } from '@/modules/system/oper-log/entities/oper-log.entity';

export const LOG_KEY_METADATA = 'operation_log_key';

/**
 * 操作日志配置选项
 */
export interface LogOption {
  /** 模块标题 */
  title?: string;
  /** 业务类型 */
  businessType?: BusinessTypeEnum;
  /** 是否保存请求参数 */
  isSaveRequestData?: boolean;
  /** 是否保存响应数据 */
  isSaveResponseData?: boolean;
}

/**
 * 默认操作日志配置
 */
const defaultLogOption: LogOption = {
  title: '',
  businessType: BusinessTypeEnum.OTHER,
  isSaveRequestData: true,
  isSaveResponseData: true,
};

/**
 * 操作日志装饰器
 * @param option 日志配置选项
 * @returns 装饰器
 *
 * @example
 * // 基本使用
 * @Log({ title: '用户管理', businessType: BusinessTypeEnum.INSERT })
 * @Post()
 * create(@Body() createUserDto: CreateUserDto) { ... }
 *
 * @example
 * // 不保存响应数据（适用于导出等场景）
 * @Log({ title: '用户管理', businessType: BusinessTypeEnum.EXPORT, isSaveResponseData: false })
 * @Post('export')
 * export() { ... }
 */
export const Log = (option?: LogOption) => {
  const mergedOption = { ...defaultLogOption, ...option };
  return SetMetadata(LOG_KEY_METADATA, mergedOption);
};
