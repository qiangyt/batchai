import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './framework';
import { Command } from './entity';

export const AppDataSource = new DataSource({
	type: 'sqlite',
	database: '/data/batchai-examples/database.sqlite',
	//synchronize: true,
	logging: true,
	entities: [User, Command],
	migrations: [],
	subscribers: [],
});
