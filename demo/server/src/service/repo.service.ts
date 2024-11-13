import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { dirExists, GithubRepo, listPathsWithPrefix, remoteRepoExists, renameFileOrDir } from '../helper';
import { Repo } from '../entity';
import { ListAvaiableTargetPathsParams, RepoCreateReq, RepoSearchParams } from '../dto';
import { Page, Kontext, User } from '../framework';

@Injectable()
export class RepoService {
	private readonly logger = new Logger(RepoService.name);

	constructor(@InjectRepository(Repo) private dao: Repository<Repo>) {}

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
		const { ownerName, repoName } = req.parsePath();
		if (await this.dao.existsBy({ owner: { id: owner.id }, name: repoName })) {
			throw new ConflictException(`repository=${req.path}}`);
		}

		if (!(await remoteRepoExists(ownerName, repoName))) {
			throw new BadRequestException(`invalid github repository: owner=${ownerName}, name=${repoName}`);
		}

		let r = new Repo();
		r.owner = owner;
		r.name = repoName;
		r.creater = x.user;

		r = await this.dao.save(r);

		// check remote repository then clone/pull it
		const repoObj = await this.newRepoObject(r);
		this.logger.log(`remote repository ${r.repoUrl()} is ok`);

		let fork = repoObj.forkedRepo();
		const workDir = fork.repoDir();
		if (await dirExists(workDir)) {
			this.logger.log(`found work directory ${workDir}`);
			await fork.checkRemote();
			this.logger.log(`remote repository (forked) ${fork.url()} is ok`);
		} else {
			this.logger.log(`not found work directory ${workDir}`);

			fork = await repoObj.fork();
			this.logger.log(`forked repository ${r.repoUrl} as ${fork.url()}`);
		}

		await fork.cloneOrPull();
		this.logger.log(`cloned/pulled the forked repository ${fork.url()}`);

		return r;
	}

	private async newRepoObject(repo: Repo): Promise<GithubRepo> {
		return new GithubRepo(
			(output) => this.logger.log(output),
			`/data/batchai-examples/repo`,
			repo.owner.name,
			repo.name,
			false,
		);
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

	async remove(repo: Repo): Promise<void> {
		await this.archiveArtifacts(repo);
		await this.dao.remove(repo);
	}

	async archiveArtifacts(repo: Repo): Promise<void> {
		const date = new Date();

		const y = date.getFullYear();
		const mon = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		const h = String(date.getHours()).padStart(2, '0');
		const min = String(date.getMinutes()).padStart(2, '0');
		const ms = String(date.getMilliseconds()).padStart(3, '0');

		const ts = `${y}_${mon}${d}_${h}${min}_${ms}`;

		const repoObj = await this.newRepoObject(repo);
		const forkedRepoDir = repoObj.forkedRepo().repoDir();

		const repoArchiveDir = await repo.repoArchiveDir(ts);
		await renameFileOrDir(forkedRepoDir, repoArchiveDir);
	}

	async listAvaiableTargetPaths(id: number, params: ListAvaiableTargetPathsParams): Promise<string[]> {
		params.normalize();

		const r = await this.load(id);
		const repoObj = await this.newRepoObject(r);
		const fork = repoObj.forkedRepo();
		const repoDir = fork.repoDir();
		if (!(await dirExists(repoDir))) {
			return [];
		}

		return listPathsWithPrefix(repoDir, params.path);
	}
}
