import { Page } from '../framework';
import { Command } from '../entity';
import { RepoBasic } from '.';
import { CommandRunStatus, CommandStatus } from '../constants';
import { AuditableDto } from '../framework';
import { BadRequestException } from '@nestjs/common';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ArtifactFiles } from 'src/service/artifact.files';
import { I18nService } from 'nestjs-i18n';

export class SubscribeCommandLogReq {
	constructor(
		readonly id: number /* command id */,
		readonly amountOfAuditLog: number /* 0-based amount of audit log lines that the client has */,
		readonly amountOfExecutionLog: number /* 0-based amount of execution log lines that the client has */,
	) {}
}

export class CommandLog {
	constructor(
		readonly timestamp: string,
		readonly message: string,
	) {}
}

export class CommandBasic extends AuditableDto {
	command: string;
	status: CommandStatus;
	commitId: string;
	commitUrl: string;

	async render(c: Command, artifactFiles: ArtifactFiles): Promise<CommandBasic> {
		await super.render(c, artifactFiles);

		this.command = c.command;
		this.status = c.status;
		this.commitId = c.commitId;
		this.commitUrl = c.commitUrl();
		return this;
	}

	static async from(c: Command, artifactFiles: ArtifactFiles): Promise<CommandBasic> {
		if (!c) return null;
		return new CommandBasic().render(c, artifactFiles);
	}

	static async fromMany(cmds: Command[], artifactFiles: ArtifactFiles): Promise<CommandBasic[]> {
		return Promise.all(cmds.map((c) => CommandBasic.from(c, artifactFiles)));
	}

	static async fromPage(p: Page<Command>, artifactFiles: ArtifactFiles): Promise<Page<CommandBasic>> {
		const elements = await CommandBasic.fromMany(p.elements, artifactFiles);
		return new Page<CommandBasic>(p.page, p.limit, elements, p.total);
	}
}

export class CommandDetail extends CommandBasic {
	repo: RepoBasic;

	hasChanges: boolean;

	runStatus: CommandRunStatus;

	enableSymbolReference: boolean;
	force: boolean;
	num: number;
	lang: string;
	checkFix: boolean;
	testLibrary: string[];
	testUpdate: boolean;

	targetPaths: string[];
	locked: boolean;

	async render(c: Command, artifactFiles: ArtifactFiles): Promise<CommandDetail> {
		await super.render(c, artifactFiles);

		this.repo = await RepoBasic.from(await c.repo, artifactFiles);
		this.hasChanges = c.hasChanges;
		this.runStatus = c.runStatus;
		this.enableSymbolReference = c.enableSymbolReference;
		this.force = c.force;
		this.num = c.num;
		this.lang = c.lang;
		this.checkFix = c.checkFix;
		this.testLibrary = c.testLibrary;
		this.testUpdate = c.testUpdate;
		this.targetPaths = c.targetPaths;
		this.locked = c.locked;

		return this;
	}

	static async from(c: Command, artifactFiles: ArtifactFiles): Promise<CommandDetail> {
		if (!c) return null;
		const r = new CommandDetail();
		return r.render(c, artifactFiles);
	}
}

export class CommandUpdateReq {
	@IsBoolean()
	@IsOptional()
	enableSymbolReference?: boolean;

	@IsBoolean()
	@IsOptional()
	force: boolean;

	@IsInt()
	@IsOptional()
	num: number;

	@IsString()
	@IsOptional()
	lang: string;

	@IsBoolean()
	@IsOptional()
	checkFix: boolean;

	@IsArray()
	@IsOptional()
	testLibrary: string[];

	@IsBoolean()
	@IsOptional()
	testUpdate: boolean;

	@IsArray()
	@IsOptional()
	targetPaths: string[];

	@IsBoolean()
	@IsOptional()
	executeItRightNow: boolean;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	normalize(i18n: I18nService) {
		if (this.num <= 0) {
			this.num = 0;
		}
		if (this.testLibrary === undefined || this.testLibrary === null) {
			this.testLibrary = [];
		}
		if (this.targetPaths === undefined || this.targetPaths === null) {
			this.targetPaths = [];
		}
		if (this.executeItRightNow === undefined || this.executeItRightNow === null) {
			this.executeItRightNow = true;
		}
	}
}

export class ParsedRepoPath {
	constructor(
		public ownerName: string,
		public repoName: string,
	) {}

	static parse(path: string, i18n: I18nService): ParsedRepoPath {
		let p = path.trim();
		if (p.toLowerCase().startsWith('https://')) {
			p = p.substring('https://'.length);
		}
		if (p.indexOf('@') >= 0) {
			throw new BadRequestException(i18n.t('error.DONT_INPUT_CREDENTIAL_IN_REPO_PATH', { args: { path } }));
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
			throw new BadRequestException(i18n.t('INVALID_REPOSITORY_PATH', { args: { path } }));
		}
		const ownerName = elements[0];
		const repoName = elements[1];
		if (!ownerName || !repoName) {
			throw new BadRequestException(i18n.t('INVALID_REPOSITORY_PATH', { args: { path } }));
		}

		return new ParsedRepoPath(ownerName, repoName);
	}
}

export class CommandCreateReq extends CommandUpdateReq {
	@IsInt()
	repoId: number;

	@IsNotEmpty()
	command: string;

	normalize(i18n: I18nService) {
		if (this.command !== 'check' && this.command !== 'test') {
			throw new BadRequestException(i18n.t('UNSUPPORTED_COMMAND', { args: { command: this.command } }));
		}
		super.normalize(i18n);
	}
}
