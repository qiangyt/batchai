import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandStatus } from '../constants';
import { CommandService } from './command.service';
import { RepoService } from './repo.service';
import { CommandApi } from '../api';
import { Kontext, Transactional, UserService } from '../framework';
import { CommandBasic, CommandDetail, CommandCreateReq, CommandUpdateReq } from '../dto';

@Injectable()
export class CommandFacade implements CommandApi, OnModuleInit {
	constructor(
		private readonly service: CommandService,
		private readonly repoService: RepoService,
		private readonly userService: UserService,
		private readonly dataSource?: DataSource,
	) {}

	async onModuleInit() {
		this.initCheck(null);
	}

	@Transactional()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async initCheck(x: Kontext) {
		this.service.initCheck();
	}

	@Transactional()
	async createCommand(x: Kontext, params: CommandCreateReq): Promise<CommandDetail> {
		const { ownerName, repoName } = params.parseRepoPath();
		const owner = await this.userService.resolve(x, ownerName);
		const repo = await this.repoService.resolve(x, owner, repoName);

		return CommandDetail.fromCommand(await this.service.create(x, params, repo));
	}

	@Transactional()
	async updateCommand(x: Kontext, id: number, req: CommandUpdateReq): Promise<CommandDetail> {
		return CommandDetail.fromCommand(await this.service.update(x, id, req));
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async listAllCommand(x: Kontext): Promise<CommandBasic[]> {
		return CommandBasic.fromMany(await this.service.listAll());
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async listCommandByStatus(x: Kontext, status: CommandStatus): Promise<CommandBasic[]> {
		return CommandBasic.fromMany(await this.service.listByStatus(status));
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loadCommand(x: Kontext, id: number): Promise<CommandDetail> {
		return CommandDetail.fromCommand(await this.service.load(id));
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loadCommandLog(x: Kontext, id: number): Promise<string> {
		return this.service.loadLog(id);
	}

	@Transactional()
	async restartCommand(x: Kontext, id: number): Promise<CommandDetail> {
		const c = await this.service.load(id);
		return CommandDetail.fromCommand(await this.service.restart(x, c));
	}

	@Transactional()
	async resumeCommand(x: Kontext, id: number): Promise<CommandDetail> {
		const c = await this.service.load(id);
		return CommandDetail.fromCommand(await this.service.resume(x, c));
	}

	@Transactional()
	async stopCommand(x: Kontext, id: number): Promise<CommandDetail> {
		const c = await this.service.load(id);
		return CommandDetail.fromCommand(await this.service.stop(x, c));
	}

	@Transactional()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async removeCommand(x: Kontext, id: number): Promise<void> {
		const c = await this.service.load(id);
		return this.service.remove(c);
	}
}
