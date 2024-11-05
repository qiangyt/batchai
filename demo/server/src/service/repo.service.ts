import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { remoteRepoExists } from '../helper';
import { Repo } from '../entity';
import { RepoCreateReq, RepoQueryParams } from '../dto';
import { Page, Kontext, User } from '../framework';

@Injectable()
export class RepoService {
	constructor(@InjectRepository(Repo) private dao: Repository<Repo>) {}

	async query(params: RepoQueryParams): Promise<Page<Repo>> {
		params.normalize();

		let q = this.dao
			.createQueryBuilder('repo')
			.leftJoinAndSelect('repo.commands', 'commands')
			.leftJoinAndSelect('repo.owner', 'owner')
			.leftJoinAndSelect('repo.creater', 'creater')
			.leftJoinAndSelect('repo.updater', 'updater')
			.skip((params.page - 1) * params.limit)
			.take(params.limit)
			.orderBy('repo.id', 'DESC');

		if (params.ownerName) {
			q = q.where('repo.owner.name LIKE :ownerName', { ownerName: `${params.ownerName}%` });
		}
		if (params.repoName) {
			q = q.andWhere('repo.name LIKE :name', { name: `${params.repoName}%` });
		}

		const [reposes, total] = await q.getManyAndCount();

		return new Page<Repo>(params.page, params.limit, reposes, total);
	}

	async getByOwnerAndName(ownerName: string, name: string): Promise<Repo> {
		return this.dao.findOneBy({
			owner: { name: ownerName },
			name: name,
		});
	}

	async create(x: Kontext, req: RepoCreateReq, owner: User): Promise<Repo> {
		const { ownerName, name: name } = req.parsePath();
		if (!(await remoteRepoExists(ownerName, name))) {
			throw new Error(`repository not found: owner=${ownerName}, name=${name}`);
		}

		if (await this.dao.existsBy({ owner: { id: owner.id }, name: name })) {
			throw new ConflictException(`repository=${req.path}}`);
		}

		const r = new Repo();
		r.owner = owner;
		r.name = name;
		r.creater = x.user;

		return await this.dao.save(r);
	}

	async resolve(x: Kontext, owner: User, repoName: string): Promise<Repo> {
		let r = await this.getByOwnerAndName(owner.name, repoName);
		if (r) {
			return r;
		}

		if (!(await remoteRepoExists(owner.name, repoName))) {
			throw new Error(`repository not found: ${r.repoUrl()}`);
		}

		r = new Repo();
		r.owner = owner;
		r.name = repoName;
		r.creater = x.user;

		return await this.dao.save(r);
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
		await this.dao.remove(repo);
	}
}
