import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandService, CommandFacade, RepoService, RepoFacade } from './service';
import { Command, Repo } from './entity';
import { CommandRest, RepoRest } from './rest';
import { FrameworkModule, jwtAuthGuard, requestKontextInterceptor } from './framework';
import { ScheduleModule } from '@nestjs/schedule';
import { SQLITE_FILE } from './constants';

const ENTITIES = [Repo, Command];
const CONTROLLERS = [RepoRest, CommandRest];
const PROVIDERS = [RepoService, RepoFacade, CommandService, CommandFacade, requestKontextInterceptor, jwtAuthGuard];

@Module({
  imports: [
    FrameworkModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      logging: false,
      database: SQLITE_FILE,
      synchronize: true,
      entities: ENTITIES,
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  controllers: CONTROLLERS,
  providers: PROVIDERS,
})
export class AppModule {}
