import { join } from 'path';

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ServeStaticModule } from '@nestjs/serve-static';
import { PUBLIC_FOLDER_NAME, PUBLIC_URL } from './common/constants';
import { authConfig } from './config/auth.config';
import { emailConfig } from './config/email.config';
import { githubConfig } from './config/github.config';
import { jwtConfig } from './config/jwt.config';
import { loggerSentryConfig } from './config/logger-sentry.config';
import { loggerConfig } from './config/logger.config';
import sampleConfig from './config/sample.config';
import { typeormConfig } from './config/typeorm.config';
import { ApiKeyMiddleware } from './modules/auth/midleware/api-key.middleware';
import { ClaudeApiModule } from './modules/claude-api/claude-api.module';
import { LoggerModule } from './modules/logger/logger.module';
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', PUBLIC_FOLDER_NAME),
      serveRoot: PUBLIC_URL,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        typeormConfig,
        jwtConfig,
        loggerConfig,
        loggerSentryConfig,
        emailConfig,
        authConfig,
        githubConfig,
        sampleConfig,
      ],
    }),

    LoggerModule,
    ClaudeApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .exclude('(.*)')
      //.exclude('auth/(.*)')
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
