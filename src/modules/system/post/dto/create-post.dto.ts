import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: '岗位编码不能为空' })
  postCode: string;

  @IsString()
  @IsNotEmpty({ message: '岗位名称不能为空' })
  postName: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  postSort?: number;

  @IsInt()
  @IsOptional()
  status?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}
