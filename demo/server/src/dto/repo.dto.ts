import { Page, UserBasic, AuditableDto } from '../framework';
import { Repo } from '../entity';
import { CommandBasic, ParsedRepoPath } from './command.dto';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ArtifactFiles } from 'src/service/artifact.files';

export class RepoBasic extends AuditableDto {
	owner: UserBasic;

	name: string;

	repoUrl: string;

	checkCommand: CommandBasic;

	testCommand: CommandBasic;

	artifactArchiveFile: string;

	async render(repo: Repo, artifactFiles: ArtifactFiles): Promise<RepoBasic> {
		await super.render(repo);

		this.owner = await UserBasic.from(repo.owner);
		this.name = repo.name;
		this.repoUrl = repo.repoUrl();
		this.artifactArchiveFile = await artifactFiles.repoArchive(repo);

		if (repo.commands) {
			repo.commands.forEach(async (c_) => {
				const c = await CommandBasic.from(c_, artifactFiles);
				if (c.command === 'check') {
					this.checkCommand = c;
				} else if (c.command === 'test') {
					this.testCommand = c;
				}
			});
		}

		return this;
	}

	static async from(repo: Repo, artifactFiles: ArtifactFiles): Promise<RepoBasic> {
		if (!repo) return null;
		return new RepoBasic().render(repo, artifactFiles);
	}

	static async fromMany(repos: Repo[], artifactFiles: ArtifactFiles): Promise<RepoBasic[]> {
		return Promise.all(repos.map((r) => RepoBasic.from(r, artifactFiles)));
	}

	static async fromPage(p: Page<Repo>, artifactFiles: ArtifactFiles): Promise<Page<RepoBasic>> {
		const elements = await RepoBasic.fromMany(p.elements, artifactFiles);
		return new Page<RepoBasic>(p.page, p.limit, elements, p.total);
	}
}

export class RepoDetail extends RepoBasic {
	locked: boolean;

	async render(repo: Repo, artifactFiles: ArtifactFiles): Promise<RepoDetail> {
		await super.render(repo, artifactFiles);
		this.locked = repo.locked;
		return this;
	}

	static async from(repo: Repo, artifactFiles: ArtifactFiles): Promise<RepoDetail> {
		if (!repo) return null;
		return new RepoDetail().render(repo, artifactFiles);
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
	@IsString()
	query: string;

	normalize() {
		if (!this.page || this.page < 0) this.page = 0;

		if (!this.limit || this.limit < 1) this.limit = 20;
		else if (this.limit > 100) this.limit = 20;
	}
}

export class RepoCreateReq {
	@IsNotEmpty()
	@IsString()
	path: string;

	private parsedRepoPath: ParsedRepoPath;

	parsePath(): ParsedRepoPath {
		if (this.parsedRepoPath === null || this.parsedRepoPath === undefined) {
			this.parsedRepoPath = ParsedRepoPath.parse(this.path);
		}

		return this.parsedRepoPath;
	}
}

export class ListAvaiableTargetPathsParams {
	@IsOptional()
	@IsString()
	path: string;

	normalize() {
		if (this.path) {
			if (this.path.startsWith('/')) {
				this.path = this.path.substring(1);
			}
		}
	}
}
