import { Injectable } from '@nestjs/common';
import { ListAvaiableTargetPathsParams, RepoBasic, RepoCreateReq, RepoDetail, RepoSearchParams } from '../dto';
import { DataSource } from 'typeorm';
import { RepoService } from './repo.service';
import { CommandService } from './command.service';
import { UserService, Page, Transactional, Kontext } from '../framework';
import { RepoApi } from '../api';
import { ArtifactFiles } from './artifact.files';

@Injectable()
export class RepoFacade implements RepoApi {
	constructor(
		private service: RepoService,
		private commandService: CommandService,
		private userService: UserService,
		private readonly artifactFiles: ArtifactFiles,
		private readonly dataSource?: DataSource,
	) {}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async searchRepo(x: Kontext, params: RepoSearchParams): Promise<Page<RepoBasic>> {
		const result = await this.service.search(params);
		return RepoBasic.fromPage(result, this.artifactFiles);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async getRepoByOwnerAndName(x: Kontext, ownerName: string, name: string): Promise<RepoDetail> {
		const repo = await this.service.getByOwnerAndName(ownerName, name);
		return RepoDetail.from(repo, this.artifactFiles);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async listAllRepo(x: Kontext): Promise<RepoBasic[]> {
		return RepoBasic.fromMany(await this.service.listAll(), this.artifactFiles);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loadRepo(x: Kontext, id: number): Promise<RepoDetail> {
		const repo = await this.service.load(id);
		return RepoDetail.from(repo, this.artifactFiles);
	}

	@Transactional()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async removeRepo(x: Kontext, id: number, removeWorkingCopy: boolean): Promise<void> {
		const repo = await this.service.load(id);
		await Promise.all(repo.commands.map((c) => this.commandService.remove(c, removeWorkingCopy)));
		return this.service.remove(repo, removeWorkingCopy);
	}

	@Transactional()
	async createRepo(x: Kontext, params: RepoCreateReq): Promise<RepoDetail> {
		const { ownerName } = params.parsePath();
		const owner = await this.userService.resolve(x, ownerName);
		const repo = await this.service.create(x, params, owner);
		return RepoDetail.from(repo, this.artifactFiles);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async listAvaiableTargetPaths(x: Kontext, id: number, params: ListAvaiableTargetPathsParams): Promise<string[]> {
		return this.service.listAvaiableTargetPaths(id, params);
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async resolveRepoArchive(x: Kontext, id: number): Promise<string> {
		return this.service.resolveRepoArchive(id);
	}

	@Transactional()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async lockRepo(x: Kontext, id: number): Promise<RepoDetail> {
		return RepoDetail.from(await this.service.lock(id), this.artifactFiles);
	}

	@Transactional()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async unlockRepo(x: Kontext, id: number): Promise<RepoDetail> {
		return RepoDetail.from(await this.service.unlock(id), this.artifactFiles);
	}
}
