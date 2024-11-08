import { Page, UserBasic, AuditableDto } from '../framework';
import { Repo } from '../entity';
import { CommandBasic } from './command.dto';
import { BadRequestException } from '@nestjs/common';
import { IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RepoBasic extends AuditableDto {
	owner: UserBasic;

	name: string;

	repoUrl: string;

	checkCommand: CommandBasic;

	testCommand: CommandBasic;

	render(repo: Repo): RepoBasic {
		super.render(repo);

		this.owner = UserBasic.from(repo.owner);
		this.name = repo.name;
		this.repoUrl = repo.repoUrl();
		if (repo.commands) {
			repo.commands.forEach((c_) => {
				const c = CommandBasic.from(c_);
				if (c.command === 'check') {
					this.checkCommand = c;
				} else if (c.command === 'test') {
					this.testCommand = c;
				}
			});
		}

		return this;
	}

	static from(repo: Repo): RepoBasic {
		if (!repo) return null;
		return new RepoBasic().render(repo);
	}

	static fromMany(repos: Repo[]): RepoBasic[] {
		return repos.map((r) => RepoBasic.from(r));
	}

	static fromPage(p: Page<Repo>): Page<RepoBasic> {
		return new Page<RepoBasic>(p.page, p.limit, RepoBasic.fromMany(p.elements), p.total);
	}
}

export class RepoDetail extends RepoBasic {
	render(repo: Repo): RepoDetail {
		super.render(repo);
		return this;
	}

	static from(repo: Repo): RepoDetail {
		if (!repo) return null;
		return new RepoDetail().render(repo);
	}
}

export class RepoSearchParams {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	page: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit: number;

	@IsOptional()
	query: string;

	normalize() {
		if (!this.page || this.page < 0) this.page = 0;

		if (!this.limit || this.limit < 1) this.limit = 20;
		else if (this.limit > 100) this.limit = 20;
	}
}

export class RepoCreateReq {
	@IsNotEmpty()
	path: string;

	parsePath(): { ownerName: string; name: string } {
		let p = this.path.trim();
		if (p.toLowerCase().startsWith('https://')) {
			p = p.substring('https://'.length);
		}
		if (p.indexOf('@') >= 0) {
			throw new BadRequestException('do not input credential in the repository path');
		}
		if (p.toLowerCase().startsWith('github.com/')) {
			p = p.substring('github.com/'.length);
		}
		if (p.startsWith('/')) {
			p = p.substring('/'.length);
		}
		if (p.endsWith('/')) {
			p = p.substring(0, p.length - 1);
		}

		const elements = p.split('/', 2);
		if (elements.length != 2) {
			throw new BadRequestException(`invalid repository path: ${p}; example: qiangyt/batchai`);
		}
		const ownerName = elements[0];
		const name = elements[1];
		if (!ownerName || !name) {
			throw new BadRequestException(`invalid repository path: ${p}; example: qiangyt/batchai`);
		}

		return { ownerName, name };
	}
}
