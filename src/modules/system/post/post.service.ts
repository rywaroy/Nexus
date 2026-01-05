import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/modules/prisma';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';

export interface PostResponseDto {
  id: string;
  postCode: string;
  postName: string;
  postSort: number;
  status: number;
  remark: string;
  createTime?: string;
}

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponseDto(post: any): PostResponseDto {
    return {
      id: post.id,
      postCode: post.postCode,
      postName: post.postName,
      postSort: post.postSort,
      status: post.status,
      remark: post.remark || '',
      createTime: post.createdAt?.toISOString(),
    };
  }

  async create(dto: CreatePostDto): Promise<PostResponseDto> {
    const exists = await this.prisma.post.findUnique({
      where: { postCode: dto.postCode },
    });
    if (exists) {
      throw new ConflictException('岗位编码已存在');
    }

    const post = await this.prisma.post.create({
      data: {
        postCode: dto.postCode,
        postName: dto.postName,
        postSort: dto.postSort ?? 0,
        status: dto.status ?? 0,
        remark: dto.remark || '',
      },
    });

    return this.toResponseDto(post);
  }

  async findAll(
    query: QueryPostDto,
  ): Promise<{ list: PostResponseDto[]; total: number }> {
    const { page = 1, pageSize = 10, postCode, postName, status } = query;

    const where: any = {};

    if (postCode) {
      where.postCode = { contains: postCode };
    }
    if (postName) {
      where.postName = { contains: postName };
    }
    if (status !== undefined) {
      where.status = status;
    }

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { postSort: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      list: list.map((item) => this.toResponseDto(item)),
      total,
    };
  }

  async findOne(id: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('岗位不存在');
    }

    return this.toResponseDto(post);
  }

  async update(id: string, dto: UpdatePostDto): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('岗位不存在');
    }

    if (dto.postCode && dto.postCode !== post.postCode) {
      const exists = await this.prisma.post.findFirst({
        where: {
          postCode: dto.postCode,
          NOT: { id },
        },
      });
      if (exists) {
        throw new ConflictException('岗位编码已存在');
      }
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        postCode: dto.postCode,
        postName: dto.postName,
        postSort: dto.postSort,
        status: dto.status,
        remark: dto.remark,
      },
    });

    return this.toResponseDto(updated);
  }

  async remove(id: string): Promise<{ id: string }> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('岗位不存在');
    }

    await this.prisma.post.delete({ where: { id } });
    return { id };
  }

  async findAllEnabled(): Promise<PostResponseDto[]> {
    const posts = await this.prisma.post.findMany({
      where: { status: 0 },
      orderBy: { postSort: 'asc' },
    });

    return posts.map((item) => this.toResponseDto(item));
  }
}
