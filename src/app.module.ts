import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ImportsModule } from './imports/imports.module';
import { CommonModule } from './common/common.module';
import { resolveLocalStorageDirSegment } from './common/utils/safe-output-path';

@Module({
  imports: [
    CommonModule,
    ImportsModule,
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dir = resolveLocalStorageDirSegment(
          config.get<string>('LOCAL_STORAGE_PATH', 'results'),
        );
        return [
          {
            rootPath: join(process.cwd(), dir),
            serveRoot: config.get<string>('ASSETS_URL_PATH', '/assets'),
            serveStaticOptions: {
              index: false,
              fallthrough: true,
            },
          },
        ];
      },
    }),
  ],
})
export class AppModule {}
