import { Test, TestingModule } from '@nestjs/testing';
import { CommandRest } from './command.rest';
import { CommandService } from '../service/command.service';

describe('CommandRest', () => {
	let controller: CommandRest;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [CommandRest],
			providers: [CommandService],
		}).compile();

		controller = module.get<CommandRest>(CommandRest);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
