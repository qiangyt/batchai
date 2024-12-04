import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { HttpExceptionFilter } from './framework/http.exception.filter';
//import * as cookieParser from 'cookie-parser';
//import cookieParser from 'cookie-parser';

dotenv.config({ path: '/data/batchai-examples/.env' });

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const cookieParser = (await import('cookie-parser')).default;
	app.useGlobalFilters(new HttpExceptionFilter());
	app.use(cookieParser());
	app.use(
		helmet({
			crossOriginEmbedderPolicy: false,
			contentSecurityPolicy: {
				directives: {
					imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
					scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
					manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
					frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
				},
			},
		}),
	);

	//app.enableCors();

	app.useGlobalPipes(new ValidationPipe({ transform: true }));

	await app.listen(4080);
}

bootstrap();
