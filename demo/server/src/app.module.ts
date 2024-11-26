import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtifactFiles, CommandService, CommandFacade, RepoService, RepoFacade } from './service';
import { Command, Repo } from './entity';
import { CommandRest, RepoRest } from './rest';
import { FrameworkModule, jwtAuthGuard, requestKontextInterceptor } from './framework';
import { ScheduleModule } from '@nestjs/schedule';
import { SQLITE_FILE } from './constants';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import path from 'path';

const ENTITIES = [Repo, Command];
const CONTROLLERS = [RepoRest, CommandRest];
const PROVIDERS = [
	ArtifactFiles,
	RepoService,
	RepoFacade,
	CommandService,
	CommandFacade,
	requestKontextInterceptor,
	jwtAuthGuard,
];

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
		I18nModule.forRoot({
			fallbackLanguage: 'en',
			loaderOptions: {
				path: path.join(__dirname, '/i18n/'),
				watch: process.env.NODE_ENV !== 'production',
			},
			resolvers: [AcceptLanguageResolver],
			//typesOutputPath: path.join(__dirname, '../src/generated/i18n.generated.ts'),
		}),
	],
	controllers: CONTROLLERS,
	providers: PROVIDERS,
})
export class AppModule {}
