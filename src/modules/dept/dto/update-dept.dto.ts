import { PartialType } from '@nestjs/mapped-types';
import { CreateDeptDto } from './create-dept.dto';

/**
 * 更新部门 DTO
 * 继承 CreateDeptDto 并将所有字段设为可选
 */
export class UpdateDeptDto extends PartialType(CreateDeptDto) {}
