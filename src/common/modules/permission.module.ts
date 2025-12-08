import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionGuard } from '../guards/permission.guard';
import { Menu, MenuSchema } from '../../modules/menu/entities/menu.entity';
import { Role, RoleSchema } from '../../modules/role/entities/role.entity';

/**
 * 权限模块
 * 提供 PermissionGuard 及其依赖的 Mongoose Models
 * 标记为全局模块，允许在任何模块中使用 PermissionGuard
 */
@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Menu.name, schema: MenuSchema },
            { name: Role.name, schema: RoleSchema },
        ]),
    ],
    providers: [PermissionGuard],
    exports: [PermissionGuard, MongooseModule],
})
export class PermissionModule {}
