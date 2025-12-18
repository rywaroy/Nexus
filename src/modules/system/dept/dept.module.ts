import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeptController } from './dept.controller';
import { DeptService } from './dept.service';
import { Dept, DeptSchema } from './entities/dept.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dept.name, schema: DeptSchema }]),
    UserModule,
  ],
  controllers: [DeptController],
  providers: [DeptService],
  exports: [DeptService],
})
export class DeptModule { }
