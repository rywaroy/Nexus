import { PrismaService } from '@/common/modules/prisma';
import { UserService } from './user.service';

describe('UserService', () => {
  let prisma: {
    user: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let service: UserService;

  beforeEach(() => {
    prisma = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new UserService(prisma as unknown as PrismaService);
  });

  it('adds a role relation filter when roleId is provided', async () => {
    const roleId = '507f1f77bcf86cd799439011';

    prisma.user.findMany.mockResolvedValue([
      {
        avatar: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        deptId: null,
        email: null,
        id: 'u-1',
        nickName: 'Alice',
        phone: null,
        posts: [{ postId: 'p-1' }],
        remark: null,
        roles: [{ role: { name: 'admin' }, roleId }],
        status: 0,
        username: 'alice',
      },
    ]);
    prisma.user.count.mockResolvedValue(1);

    const result = await service.findAll({ roleId });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          roles: {
            some: {
              roleId,
            },
          },
        }),
      }),
    );
    expect(prisma.user.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          roles: {
            some: {
              roleId,
            },
          },
        }),
      }),
    );
    expect(result).toEqual({
      list: [
        expect.objectContaining({
          postIds: ['p-1'],
          roles: ['admin'],
          username: 'alice',
        }),
      ],
      total: 1,
    });
  });
});
