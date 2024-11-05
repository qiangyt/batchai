import { Page } from '../framework';
import { Command } from '../entity';
import { RepoBasic } from '.';
import { CommandRunStatus, CommandStatus } from '../constants';
import { AuditableDto } from '../framework';
import { BadRequestException } from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';

export class CommandBasic extends AuditableDto {
	command: string;
	status: CommandStatus;
	commitId: string;
	commitUrl: string;

	render(c: Command): CommandBasic {
		super.render(c);
		this.command = c.command;
		this.status = c.status;
		this.commitId = c.commitId;
		this.commitUrl = c.commitUrl();
		return this;
	}

	static from(c: Command): CommandBasic {
		if (!c) return null;
		return new CommandBasic().render(c);
	}

	static fromMany(cmds: Command[]): CommandBasic[] {
		return cmds.map(CommandBasic.from);
	}

	static fromPage(p: Page<Command>): Page<CommandBasic> {
		return new Page<CommandBasic>(p.page, p.limit, CommandBasic.fromMany(p.elements), p.total);
	}
}

export class CommandDetail extends CommandBasic {
	repo: RepoBasic;

	hasChanges: boolean;

	runStatus: CommandRunStatus;

	globalOptions: string[];

	commandOptions: string[];

	targetPaths: string[];

	commandLine: string;

	async renderCommand(c: Command): Promise<CommandDetail> {
		super.render(c);
		this.repo = RepoBasic.from(await c.repo);
		this.hasChanges = c.hasChanges;
		this.runStatus = c.runStatus;
		this.globalOptions = c.globalOptions;
		this.commandOptions = c.commandOptions;
		this.targetPaths = c.targetPaths;
		return this;
	}

	static async fromCommand(c: Command): Promise<CommandDetail> {
		if (!c) return null;
		const r = new CommandDetail();
		return await r.renderCommand(c);
	}
}

export class CommandCreateReq {
	@IsNotEmpty()
	repoPath: string;

	@IsNotEmpty()
	command: string;

	testLibraries: string[];

	targetPaths: string[];

	commandOptions(): string[] {
		if (this.command === 'review') {
			return ['--fix'];
		}
		if (this.command === 'test') {
			if (this.testLibraries) {
				const r: string[] = [];
				this.testLibraries.forEach((lib) => r.push('--library', lib));
				return r;
			}
		}
		throw new BadRequestException(`unsupported command: ${this.command}`);
	}

	parseRepoPath(): { ownerName: string; repoName: string } {
		let p = this.repoPath.trim();
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
		const repoName = elements[1];
		if (!ownerName || !repoName) {
			throw new BadRequestException(`invalid repository path: ${p}; example: qiangyt/batchai`);
		}

		return { ownerName, repoName };
	}
}
