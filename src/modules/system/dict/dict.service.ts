import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/modules/prisma';
import { RedisService } from '@/modules/common/redis/redis.service';
import { CreateDictTypeDto } from './dto/create-dict-type.dto';
import { UpdateDictTypeDto } from './dto/update-dict-type.dto';
import { QueryDictTypeDto } from './dto/query-dict-type.dto';
import { CreateDictDataDto } from './dto/create-dict-data.dto';
import { UpdateDictDataDto } from './dto/update-dict-data.dto';
import { QueryDictDataDto } from './dto/query-dict-data.dto';

const DICT_CACHE_PREFIX = 'system:dict';
const DICT_CACHE_TTL = 3600;

export interface DictTypeResponseDto {
  id: string;
  dictName: string;
  dictType: string;
  status: number;
  remark: string;
  createTime?: string;
}

export interface DictDataResponseDto {
  id: string;
  typeId?: string;
  dictName?: string;
  dictType?: string;
  dictLabel: string;
  dictValue: string;
  dictSort: number;
  cssClass: string;
  listClass: string;
  isDefault: boolean;
  status: number;
  remark: string;
  createTime?: string;
}

@Injectable()
export class DictService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createType(dto: CreateDictTypeDto): Promise<DictTypeResponseDto> {
    const exists = await this.prisma.dictType.findUnique({
      where: { dictType: dto.dictType },
    });
    if (exists) {
      throw new ConflictException('字典类型已存在');
    }

    const created = await this.prisma.dictType.create({
      data: {
        dictName: dto.dictName,
        dictType: dto.dictType,
        remark: dto.remark || '',
        status: dto.status ?? 0,
      },
    });

    return this.toTypeResponseDto(created);
  }

  async findTypeList(
    query: QueryDictTypeDto,
  ): Promise<{ list: DictTypeResponseDto[]; total: number }> {
    const { page = 1, pageSize = 10, dictName, dictType, status } = query;
    const where: any = {};

    if (dictName) {
      where.dictName = { contains: dictName };
    }
    if (dictType) {
      where.dictType = { contains: dictType };
    }
    if (status !== undefined) {
      where.status = status;
    }

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.prisma.dictType.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.dictType.count({ where }),
    ]);

    return {
      list: list.map((item) => this.toTypeResponseDto(item)),
      total,
    };
  }

  async findTypeOptions(): Promise<DictTypeResponseDto[]> {
    const list = await this.prisma.dictType.findMany({
      orderBy: [{ dictName: 'asc' }, { createdAt: 'asc' }],
    });
    return list.map((item) => this.toTypeResponseDto(item));
  }

  async findTypeById(id: string): Promise<DictTypeResponseDto> {
    const type = await this.prisma.dictType.findUnique({ where: { id } });
    if (!type) {
      throw new NotFoundException('字典类型不存在');
    }
    return this.toTypeResponseDto(type);
  }

  async updateType(
    id: string,
    dto: UpdateDictTypeDto,
  ): Promise<DictTypeResponseDto> {
    const current = await this.prisma.dictType.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('字典类型不存在');
    }

    if (dto.dictType && dto.dictType !== current.dictType) {
      const exists = await this.prisma.dictType.findFirst({
        where: {
          dictType: dto.dictType,
          NOT: { id },
        },
      });
      if (exists) {
        throw new ConflictException('字典类型已存在');
      }
    }

    const updated = await this.prisma.dictType.update({
      where: { id },
      data: {
        dictName: dto.dictName,
        dictType: dto.dictType,
        status: dto.status,
        remark: dto.remark,
      },
    });

    await this.clearCacheByType(current.dictType);
    if (updated.dictType !== current.dictType) {
      await this.clearCacheByType(updated.dictType);
    }

    return this.toTypeResponseDto(updated);
  }

  async deleteType(id: string): Promise<{ id: string }> {
    const current = await this.prisma.dictType.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('字典类型不存在');
    }

    await this.prisma.dictType.delete({ where: { id } });
    await this.clearCacheByType(current.dictType);

    return { id };
  }

  async refreshCache(): Promise<{ cleared: number }> {
    const keys = await this.redis.keys(`${DICT_CACHE_PREFIX}:*`);
    if (keys.length === 0) {
      return { cleared: 0 };
    }

    await Promise.all(keys.map((key) => this.redis.del(key)));
    return { cleared: keys.length };
  }

  async findDataList(
    query: QueryDictDataDto,
  ): Promise<{ list: DictDataResponseDto[]; total: number }> {
    const { page = 1, pageSize = 10, typeId, dictType, dictLabel, status } =
      query;
    const where: any = {};

    if (typeId) {
      where.typeId = typeId;
    }
    if (dictLabel) {
      where.dictLabel = { contains: dictLabel };
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (dictType) {
      where.type = { dictType };
    }

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.prisma.dictData.findMany({
        where,
        include: {
          type: {
            select: {
              dictName: true,
              dictType: true,
            },
          },
        },
        orderBy: [{ dictSort: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.dictData.count({ where }),
    ]);

    return {
      list: list.map((item) => this.toDataResponseDto(item)),
      total,
    };
  }

  async findDataById(id: string): Promise<DictDataResponseDto> {
    const data = await this.prisma.dictData.findUnique({
      where: { id },
      include: {
        type: {
          select: {
            dictName: true,
            dictType: true,
          },
        },
      },
    });

    if (!data) {
      throw new NotFoundException('字典数据不存在');
    }

    return this.toDataResponseDto(data);
  }

  async findDictDataByType(dictType: string): Promise<DictDataResponseDto[]> {
    const cacheKey = this.getCacheKey(dictType);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const list = await this.prisma.dictData.findMany({
      where: {
        type: {
          dictType,
        },
      },
      include: {
        type: {
          select: {
            dictName: true,
            dictType: true,
          },
        },
      },
      orderBy: [{ dictSort: 'asc' }, { createdAt: 'asc' }],
    });

    const items = list.map((item) => this.toDataResponseDto(item));
    await this.redis.set(cacheKey, JSON.stringify(items), DICT_CACHE_TTL);
    return items;
  }

  async createData(dto: CreateDictDataDto): Promise<DictDataResponseDto> {
    const type = await this.prisma.dictType.findUnique({
      where: { id: dto.typeId },
    });
    if (!type) {
      throw new NotFoundException('字典类型不存在');
    }

    const exists = await this.prisma.dictData.findFirst({
      where: {
        typeId: dto.typeId,
        dictLabel: dto.dictLabel,
      },
    });
    if (exists) {
      throw new ConflictException('字典标签已存在');
    }

    const created = await this.prisma.dictData.create({
      data: {
        typeId: dto.typeId,
        dictLabel: dto.dictLabel,
        dictValue: dto.dictValue,
        dictSort: dto.dictSort ?? 0,
        cssClass: dto.cssClass || '',
        listClass: dto.listClass || '',
        isDefault: dto.isDefault ?? false,
        status: dto.status ?? 0,
        remark: dto.remark || '',
      },
      include: {
        type: {
          select: {
            dictName: true,
            dictType: true,
          },
        },
      },
    });

    await this.clearCacheByType(type.dictType);
    return this.toDataResponseDto(created);
  }

  async updateData(
    id: string,
    dto: UpdateDictDataDto,
  ): Promise<DictDataResponseDto> {
    const current = await this.prisma.dictData.findUnique({
      where: { id },
      include: {
        type: {
          select: {
            dictName: true,
            dictType: true,
          },
        },
      },
    });
    if (!current) {
      throw new NotFoundException('字典数据不存在');
    }

    const nextTypeId = dto.typeId ?? current.typeId;
    const nextType = await this.prisma.dictType.findUnique({
      where: { id: nextTypeId },
    });
    if (!nextType) {
      throw new NotFoundException('字典类型不存在');
    }

    const nextDictLabel = dto.dictLabel ?? current.dictLabel;
    if (nextTypeId !== current.typeId || nextDictLabel !== current.dictLabel) {
      const exists = await this.prisma.dictData.findFirst({
        where: {
          typeId: nextTypeId,
          dictLabel: nextDictLabel,
          NOT: { id },
        },
      });
      if (exists) {
        throw new ConflictException('字典标签已存在');
      }
    }

    const updated = await this.prisma.dictData.update({
      where: { id },
      data: {
        typeId: dto.typeId,
        dictLabel: dto.dictLabel,
        dictValue: dto.dictValue,
        dictSort: dto.dictSort,
        cssClass: dto.cssClass,
        listClass: dto.listClass,
        isDefault: dto.isDefault,
        status: dto.status,
        remark: dto.remark,
      },
      include: {
        type: {
          select: {
            dictName: true,
            dictType: true,
          },
        },
      },
    });

    await this.clearCacheByType(current.type.dictType);
    if (updated.type.dictType !== current.type.dictType) {
      await this.clearCacheByType(updated.type.dictType);
    }

    return this.toDataResponseDto(updated);
  }

  async deleteData(id: string): Promise<{ id: string }> {
    const current = await this.prisma.dictData.findUnique({
      where: { id },
      include: {
        type: {
          select: {
            dictType: true,
          },
        },
      },
    });
    if (!current) {
      throw new NotFoundException('字典数据不存在');
    }

    await this.prisma.dictData.delete({ where: { id } });
    await this.clearCacheByType(current.type.dictType);
    return { id };
  }

  private getCacheKey(dictType: string) {
    return `${DICT_CACHE_PREFIX}:${dictType}`;
  }

  private async clearCacheByType(dictType: string) {
    await this.redis.del(this.getCacheKey(dictType));
  }

  private toTypeResponseDto(type: any): DictTypeResponseDto {
    return {
      id: type.id,
      dictName: type.dictName,
      dictType: type.dictType,
      status: type.status ?? 0,
      remark: type.remark || '',
      createTime: type.createdAt?.toISOString(),
    };
  }

  private toDataResponseDto(data: any): DictDataResponseDto {
    return {
      id: data.id,
      typeId: data.typeId,
      dictName: data.type?.dictName,
      dictType: data.type?.dictType,
      dictLabel: data.dictLabel,
      dictValue: data.dictValue,
      dictSort: data.dictSort ?? 0,
      cssClass: data.cssClass || '',
      listClass: data.listClass || '',
      isDefault: Boolean(data.isDefault),
      status: data.status ?? 0,
      remark: data.remark || '',
      createTime: data.createdAt?.toISOString(),
    };
  }
}
