import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController, SystemUserController } from './user.controller';
import { AuthGuard } from '@/common/guards/auth.guard';

@Global()
@Module({
  controllers: [UserController, SystemUserController],
  providers: [UserService, AuthGuard],
  exports: [UserService, AuthGuard],
})
export class UserModule {}
