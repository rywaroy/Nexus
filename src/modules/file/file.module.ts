import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { StorageStrategyProvider } from './storage';

@Module({
  imports: [ConfigModule],
  controllers: [FileController],
  providers: [FileService, StorageStrategyProvider],
  exports: [FileService],
})
export class FileModule {}
