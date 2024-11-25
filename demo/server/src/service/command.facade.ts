import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandStatus } from '../constants';
import { CommandService } from './command.service';
import { RepoService } from './repo.service';
import { CommandApi } from '../api';
import { Kontext, Transactional, UserService } from '../framework';
import { CommandBasic, CommandDetail, CommandCreateReq, CommandUpdateReq, CommandLog } from '../dto';
import { ArtifactFiles } from './artifact.files';
import { CheckReport, TestReport } from 'src/dto';

@Injectable()
export class CommandFacade implements CommandApi, OnModuleInit {
	constructor(
		private readonly service: CommandService,
		private readonly repoService: RepoService,
		private readonly userService: UserService,
		private readonly artifactFiles: ArtifactFiles,
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
		const repo = await this.repoService.load(params.repoId);

		return CommandDetail.from(await this.service.create(x, params, repo), this.artifactFiles);
	}

	@Transactional()
	async updateCommand(x: Kontext, id: number, req: CommandUpdateReq): Promise<CommandDetail> {
		return CommandDetail.from(await this.service.update(x, id, req), this.artifactFiles);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async listAllCommand(x: Kontext): Promise<CommandBasic[]> {
		return CommandBasic.fromMany(await this.service.listAll(), this.artifactFiles);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async listCommandByStatus(x: Kontext, status: CommandStatus): Promise<CommandBasic[]> {
		return CommandBasic.fromMany(await this.service.listByStatus(status), this.artifactFiles);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loadCommand(x: Kontext, id: number): Promise<CommandDetail> {
		return CommandDetail.from(await this.service.load(id), this.artifactFiles);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loadCommandAuditLog(x: Kontext, id: number): Promise<CommandLog[]> {
		return this.service.loadAuditLog(id);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loadCommandExecutionLog(x: Kontext, id: number): Promise<CommandLog[]> {
		return this.service.loadExecutionLog(id);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loadCommandCheckReports(x: Kontext, id: number): Promise<CheckReport[]> {
		return this.service.loadCommandCheckReports(x, id);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loadCommandTestReports(x: Kontext, id: number): Promise<TestReport[]> {
		return this.service.loadCommandTestReports(x, id);
	}

	@Transactional()
	async restartCommand(x: Kontext, id: number): Promise<CommandDetail> {
		const c = await this.service.load(id);
		return CommandDetail.from(await this.service.restart(x, c), this.artifactFiles);
	}

	@Transactional()
	async resumeCommand(x: Kontext, id: number): Promise<CommandDetail> {
		const c = await this.service.load(id);
		return CommandDetail.from(await this.service.resume(x, c), this.artifactFiles);
	}

	@Transactional()
	async stopCommand(x: Kontext, id: number): Promise<CommandDetail> {
		const c = await this.service.load(id);
		return CommandDetail.from(await this.service.stop(x, c), this.artifactFiles);
	}

	@Transactional()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async removeCommand(x: Kontext, id: number): Promise<void> {
		const c = await this.service.load(id);
		return this.service.remove(c, true);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async resolveCommandArchive(x: Kontext, id: number): Promise<string> {
		return this.service.resolveCommandArchive(id);
	}

	@Transactional()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async lockCommand(x: Kontext, id: number): Promise<CommandDetail> {
		return CommandDetail.from(await this.service.lock(id), this.artifactFiles);
	}

	@Transactional()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async unlockCommand(x: Kontext, id: number): Promise<CommandDetail> {
		return CommandDetail.from(await this.service.unlock(id), this.artifactFiles);
	}
}
