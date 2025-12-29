/**
 * 数据库 ID 验证工具
 * 兼容多种数据库的 ID 格式：
 * - MongoDB ObjectID: 24位十六进制字符串
 * - UUID (MySQL/PostgreSQL): 36位带连字符格式
 */

/** MongoDB ObjectID 格式：24位十六进制 */
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

/** UUID 格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx */
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * 检查字符串是否为有效的 MongoDB ObjectID
 */
export function isValidObjectId(value: string): boolean {
  return OBJECT_ID_REGEX.test(value);
}

/**
 * 检查字符串是否为有效的 UUID
 */
export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * 检查字符串是否为有效的数据库 ID（兼容 ObjectID 和 UUID）
 */
export function isValidDatabaseId(value: string): boolean {
  return isValidObjectId(value) || isValidUuid(value);
}

/**
 * 从字符串数组中过滤出有效的数据库 ID
 */
export function filterValidDatabaseIds(values: string[]): string[] {
  return values.filter(isValidDatabaseId);
}
