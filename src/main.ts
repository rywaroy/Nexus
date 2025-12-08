import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformReturnInterceptor } from './common/interceptor/transformreturn.interceptor';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';

const PREFIX = 'api';
const SWAGGER_V1 = `${PREFIX}/v1/swagger`;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix(PREFIX);

  app.useStaticAssets('public', {
    prefix: '/static/',
  });

  const options = new DocumentBuilder()
    .setTitle('标题')
    .setDescription('描述信息')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  // 会自动将所有路由显示出来
  SwaggerModule.setup(SWAGGER_V1, app, document); // api/swagger = API文档的路径，访问：http://localhost:3000/api/v1/swagger

  // 跨域资源共享
  app.enableCors();

  // 拦截处理-错误异常
  app.useGlobalFilters(new HttpExceptionFilter());

  // 拦截处理-返回格式
  app.useGlobalInterceptors(new TransformReturnInterceptor());

  // 日志
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 使用管道验证数据
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();
