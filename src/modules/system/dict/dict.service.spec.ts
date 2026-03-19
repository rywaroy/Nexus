import { ConflictException } from '@nestjs/common';

import { DictService } from './dict.service';

describe('DictService', () => {
  const createPrismaMock = () => ({
    dictData: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dictType: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  });

  const createRedisMock = () => ({
    del: jest.fn(),
    get: jest.fn(),
    keys: jest.fn(),
    set: jest.fn(),
  });

  it('returns paginated dict types with query filters', async () => {
    const prisma = createPrismaMock();
    const redis = createRedisMock();
    const service = new DictService(prisma as never, redis as never);

    prisma.dictType.findMany.mockResolvedValue([
      {
        id: 'type-1',
        dictName: '状态',
        dictType: 'sys_normal_disable',
        status: 0,
        remark: '系统状态',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    ]);
    prisma.dictType.count.mockResolvedValue(1);

    const result = await service.findTypeList({
      dictName: '状态',
      page: 1,
      pageSize: 10,
      status: 0,
    });

    expect(prisma.dictType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }],
        skip: 0,
        take: 10,
        where: {
          dictName: { contains: '状态' },
          status: 0,
        },
      }),
    );
    expect(result).toEqual({
      list: [
        {
          createTime: '2026-03-01T00:00:00.000Z',
          dictName: '状态',
          dictType: 'sys_normal_disable',
          id: 'type-1',
          remark: '系统状态',
          status: 0,
        },
      ],
      total: 1,
    });
  });

  it('loads dict data by type and caches the query result', async () => {
    const prisma = createPrismaMock();
    const redis = createRedisMock();
    const service = new DictService(prisma as never, redis as never);

    redis.get.mockResolvedValue(null);
    prisma.dictData.findMany.mockResolvedValue([
      {
        id: 'data-1',
        dictLabel: '启用',
        dictSort: 1,
        dictValue: '0',
        isDefault: true,
        listClass: 'success',
        cssClass: '',
        remark: '',
        status: 0,
        createdAt: new Date('2026-03-02T00:00:00.000Z'),
        type: {
          dictName: '状态',
          dictType: 'sys_normal_disable',
        },
      },
    ]);

    const result = await service.findDictDataByType('sys_normal_disable');

    expect(redis.get).toHaveBeenCalledWith('system:dict:sys_normal_disable');
    expect(prisma.dictData.findMany).toHaveBeenCalledWith({
      include: {
        type: {
          select: {
            dictName: true,
            dictType: true,
          },
        },
      },
      orderBy: [{ dictSort: 'asc' }, { createdAt: 'asc' }],
      where: {
        type: {
          dictType: 'sys_normal_disable',
        },
      },
    });
    expect(redis.set).toHaveBeenCalledWith(
      'system:dict:sys_normal_disable',
      JSON.stringify(result),
      3600,
    );
    expect(result).toEqual([
      {
        createTime: '2026-03-02T00:00:00.000Z',
        cssClass: '',
        dictLabel: '启用',
        dictName: '状态',
        dictSort: 1,
        dictType: 'sys_normal_disable',
        dictValue: '0',
        id: 'data-1',
        isDefault: true,
        listClass: 'success',
        remark: '',
        status: 0,
      },
    ]);
  });

  it('rejects duplicate dict types before creating', async () => {
    const prisma = createPrismaMock();
    const redis = createRedisMock();
    const service = new DictService(prisma as never, redis as never);

    prisma.dictType.findUnique.mockResolvedValue({
      id: 'type-1',
      dictType: 'sys_normal_disable',
    });

    await expect(
      service.createType({
        dictName: '状态',
        dictType: 'sys_normal_disable',
        remark: '',
        status: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.dictType.create).not.toHaveBeenCalled();
  });
});
