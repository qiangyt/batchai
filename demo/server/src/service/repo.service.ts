import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { dirExists, GithubRepo, listPathsWithPrefix, removeFileOrDir } from '../helper';
import { EXAMPLES_ORG, Repo } from '../entity';
import { ListAvaiableTargetPathsParams, RepoCreateReq, RepoSearchParams } from '../dto';
import { Page, Kontext, User } from '../framework';
import { ArtifactFiles } from './artifact.files';
import path from 'path';
import { mkdirp } from 'mkdirp';

@Injectable()
export class RepoService {
	private readonly logger = new Logger(RepoService.name);

	constructor(
		@InjectRepository(Repo) private dao: Repository<Repo>,
		private readonly artifactFiles: ArtifactFiles,
	) {}

	async search(params: RepoSearchParams): Promise<Page<Repo>> {
		params.normalize();

		let qbuilder = this.dao
			.createQueryBuilder('repo')
			.leftJoinAndSelect('repo.commands', 'commands')
			.leftJoinAndSelect('repo.owner', 'owner')
			.leftJoinAndSelect('repo.creater', 'creater')
			.leftJoinAndSelect('repo.updater', 'updater')
			.skip(params.page * params.limit)
			.take(params.limit)
			.orderBy('repo.id', 'DESC');

		const q = params.query;
		if (q) {
			const indexOfSlash = q.indexOf('/');
			if (indexOfSlash < 0) {
				qbuilder = qbuilder
					.where('owner.name LIKE :ownerName', { ownerName: `${q}%` })
					.orWhere('repo.name LIKE :repoName', { repoName: `${q}%` });
			} else {
				const ownerName = q.substring(0, indexOfSlash).trim();
				if (ownerName) {
					qbuilder = qbuilder.where('owner.name LIKE :ownerName', { ownerName: `${ownerName}%` });
				}
				const repoName = q.substring(indexOfSlash + 1).trim();
				if (repoName) {
					qbuilder = qbuilder.andWhere('repo.name LIKE :repoName', { repoName: `${repoName}%` });
				}
			}
		}

		const [reposes, total] = await qbuilder.getManyAndCount();

		return new Page<Repo>(params.page, params.limit, reposes, total);
	}

	async getByOwnerAndName(ownerName: string, name: string): Promise<Repo> {
		return this.dao.findOneBy({
			owner: { name: ownerName },
			name: name,
		});
	}

	async create(x: Kontext, req: RepoCreateReq, owner: User): Promise<Repo> {
		this.logger.log(`creating repository ${JSON.stringify(req)}, owner=${JSON.stringify(owner)}`);

		const { ownerName, repoName } = req.parsePath();
		if (await this.dao.existsBy({ owner: { id: owner.id }, name: repoName })) {
			throw new ConflictException(`repository=${req.path}}`);
		}

		let r = new Repo();
		r.owner = owner;
		r.name = repoName;
		r.creater = x.user;

		r = await this.dao.save(r);

		const workDir = await this.artifactFiles.forkedRepoFolder(r);

		const repoObj = new GithubRepo((output) => this.logger.log(output), workDir, ownerName, repoName, false, null);
		if (!(await repoObj.checkRemote())) {
			throw new BadRequestException(`invalid github repository: ${repoObj.url()}`);
		}
		this.logger.log(`remote repository ${r.repoUrl()} is ok`);

		const forked = repoObj.forkedRepo(true, EXAMPLES_ORG, repoName);

		let forkRepoExists = await dirExists(path.join(workDir, '.git'));
		if (forkRepoExists) {
			this.logger.log(`found fork directory ${workDir}`);
			if (!(await forked.checkRemote())) {
				this.logger.log(`remote repository ${forked.url} doesn't exist`);
				await removeFileOrDir(workDir);
				this.logger.log(`removed folder: ${workDir}`);

				forkRepoExists = false;
			}
		}

		if (!forkRepoExists) {
			this.logger.log(`not found work directory ${workDir}`);

			await mkdirp(path.dirname(workDir));

			await repoObj.fork(true, EXAMPLES_ORG);

			await forked.clone(1);
			await forked.addRemoteUrl('forked_from', r.repoUrl());

			this.logger.log(`forked repository ${r.repoUrl()} as ${forked.url()}`);
		}

		return r;
	}

	listAll(): Promise<Repo[]> {
		return this.dao.find({ order: { updatedAt: 'DESC' } });
	}

	findById(id: number): Promise<Repo> {
		return this.dao.findOneBy({ id });
	}

	async load(id: number): Promise<Repo> {
		const r = await this.findById(id);
		if (!r) {
			throw new NotFoundException(`id=${id}`);
		}
		return r;
	}

	async remove(repo: Repo, removeWorkingCopy: boolean): Promise<void> {
		this.logger.log(`removing repository ${JSON.stringify(repo)}`);

		await this.artifactFiles.archiveRepo(repo);
		if (removeWorkingCopy) {
			await this.artifactFiles.removeRepo(repo);
		}

		await this.dao.remove(repo);

		this.logger.log(`removing repository ${repo.id}`);
	}

	async listAvaiableTargetPaths(id: number, params: ListAvaiableTargetPathsParams): Promise<string[]> {
		params.normalize();

		const r = await this.load(id);
		const forkedFolder = await this.artifactFiles.forkedRepoFolder(r);
		if (!(await dirExists(forkedFolder))) {
			return [];
		}

		return listPathsWithPrefix(forkedFolder, params.path);
	}
}
