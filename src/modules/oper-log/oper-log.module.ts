import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { OperLogService } from './oper-log.service';
import { OperLogController } from './oper-log.controller';
import { OperLog, OperLogSchema } from './entities/oper-log.entity';
import { OperationLogInterceptor } from '../../common/interceptor/operation-log.interceptor';
import { UserModule } from '../user/user.module';
import { Menu, MenuSchema } from '../menu/entities/menu.entity';
import { Role, RoleSchema } from '../role/entities/role.entity';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: OperLog.name, schema: OperLogSchema },
            { name: Menu.name, schema: MenuSchema },
            { name: Role.name, schema: RoleSchema },
        ]),
        UserModule,
    ],
    controllers: [OperLogController],
    providers: [
        OperLogService,
        {
            provide: APP_INTERCEPTOR,
            useClass: OperationLogInterceptor,
        },
    ],
    exports: [OperLogService],
})
export class OperLogModule {}
