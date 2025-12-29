/**
 * 业务类型枚举
 */
export enum BusinessTypeEnum {
  /** 其它 */
  OTHER = 0,
  /** 新增 */
  INSERT = 1,
  /** 修改 */
  UPDATE = 2,
  /** 删除 */
  DELETE = 3,
  /** 授权 */
  GRANT = 4,
  /** 导出 */
  EXPORT = 5,
  /** 导入 */
  IMPORT = 6,
  /** 强退 */
  FORCE = 7,
  /** 生成代码 */
  GENCODE = 8,
  /** 清空数据 */
  CLEAN = 9,
}

/**
 * 操作状态枚举
 */
export enum OperStatusEnum {
  /** 成功 */
  SUCCESS = 0,
  /** 失败 */
  FAIL = 1,
}
