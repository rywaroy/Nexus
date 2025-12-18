import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OperLog, OperLogDocument } from './entities/oper-log.entity';
import { CreateOperLogDto, QueryOperLogDto } from './dto/oper-log.dto';

@Injectable()
export class OperLogService {
  constructor(
    @InjectModel(OperLog.name)
    private readonly operLogModel: Model<OperLogDocument>,
  ) { }

  /**
   * 创建操作日志
   */
  async create(createOperLogDto: CreateOperLogDto): Promise<OperLog> {
    const operLog = new this.operLogModel(createOperLogDto);
    return operLog.save();
  }

  /**
   * 分页查询操作日志列表
   */
  async findAll(queryOperLogDto: QueryOperLogDto): Promise<{
    list: OperLog[];
    total: number;
  }> {
    const {
      title,
      operName,
      businessType,
      status,
      beginTime,
      endTime,
      page = 1,
      pageSize = 10,
    } = queryOperLogDto;

    // 构建查询条件
    const query: any = {};

    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    if (operName) {
      query.operName = { $regex: operName, $options: 'i' };
    }

    if (businessType !== undefined && businessType !== null) {
      query.businessType = businessType;
    }

    if (status !== undefined && status !== null) {
      query.status = status;
    }

    if (beginTime || endTime) {
      query.operTime = {};
      if (beginTime) {
        query.operTime.$gte = new Date(beginTime);
      }
      if (endTime) {
        // 结束时间加一天，包含当天
        const end = new Date(endTime);
        end.setDate(end.getDate() + 1);
        query.operTime.$lt = end;
      }
    }

    // 计算分页参数
    const skip = (page - 1) * pageSize;
    const limit = pageSize;

    // 并行执行查询和计数
    const [list, total] = await Promise.all([
      this.operLogModel
        .find(query)
        .sort({ operTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.operLogModel.countDocuments(query).exec(),
    ]);

    return { list, total };
  }

  /**
   * 根据ID查询操作日志详情
   */
  async findOne(id: string): Promise<OperLog | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.operLogModel.findById(id).lean().exec();
  }

  /**
   * 批量删除操作日志
   */
  async remove(ids: string[]): Promise<{ deletedCount: number }> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await this.operLogModel
      .deleteMany({
        _id: { $in: validIds.map((id) => new Types.ObjectId(id)) },
      })
      .exec();

    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * 清空所有操作日志
   */
  async clean(): Promise<{ deletedCount: number }> {
    const result = await this.operLogModel.deleteMany({}).exec();
    return { deletedCount: result.deletedCount || 0 };
  }
}
