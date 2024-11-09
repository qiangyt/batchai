"use client";

import { RepoBasic } from './repo.dto';
import { AuditableDto } from './dto';
import { Page } from './page';


export enum CommandStatus {
	Pending = 'Pending',
	Queued = 'Queued',
	Running = 'Running',
	Succeeded = 'Succeeded',
	Failed = 'Failed',
}

export enum CommandRunStatus {
	Begin = 'Begin',
	CheckedRemote = 'CheckedRemote',
	Forked = 'Forked',
	ClonedOrPulled = 'ClonedOrPulled',
	CheckedOut = 'CheckedOut',
	BatchAIExecuted = 'BatchAIExecuted',
	ChangesAdded = 'ChangesAdded',
	ChangesCommited = 'ChangesCommited',
	ChangesPushed = 'ChangesPushed',
	GetCommitId = 'GetCommitId',
	//CreatedPR = 'CreatedPR',
	End = 'End',
}


export class CommandBasic extends AuditableDto {
	command: string;
	commitId?: string;
	commitUrl?: string;
	status?: CommandStatus;

	static with(obj: any): CommandBasic {
		if (!obj) return obj;
		AuditableDto.with(obj);
		return obj;
	}

	static withMany(cmds: any[]): CommandBasic[] {
		if (!cmds) return cmds;
		return cmds.map(CommandBasic.with);
	}

	static withPage(p: any): Page<CommandBasic> {
		if (!p) return p;
		Page.with(p);
		CommandBasic.withMany(p.elements);
		return p;
	}

}

export class CommandDetail extends CommandBasic {
	repo: RepoBasic;

	hasChanges?: boolean;

	runStatus?: CommandRunStatus;

	enableSymbolReference?: boolean;

	force?: boolean;

	num?: number;

	lang?: string;

	checkFix?: boolean;

	testLibrary?: string[];

	testUpdate?: boolean;

	targetPaths?: string[];

	static with(obj: any): CommandDetail {
		if (!obj) return obj;
		CommandBasic.with(obj);
		RepoBasic.with(obj.repo);
		Object.setPrototypeOf(obj, CommandDetail.prototype);
		return obj;
	}

	static init(repo: RepoBasic): CommandDetail {
		const r = new CommandDetail();
		r.command = 'test';
		r.repo = repo;
		r.testLibrary = [];
		r.targetPaths = ['.'];
		return r;
	}

	primaryTestLibrary(): string {
		if (this.testLibrary && this.testLibrary.length > 0) {
			return this.testLibrary[0];
		}
		return null;
	}

	globalOptions(): string[] {
		const r = [];
		if (this.enableSymbolReference) {
			r.push('--enable-symbol-reference');
		}
		if (this.force) {
			r.push('--force');
		}
		if (this.num) {
			r.push(`--num ${this.num}`);
		}
		if (this.lang) {
			r.push(`--lang ${this.lang}`);
		}
		return r;
	}

	commandOptions(): string[] {
		const r = [];
		switch (this.command) {
			case 'check':
				{
					if (this.checkFix) {
						r.push('--fix');
					}
				}
				break;
			case 'test':
				{
					if (this.testLibrary && this.testLibrary.length) {
						this.testLibrary.forEach((lib) => r.push('--library', lib));
					}
					if (this.checkFix) {
						r.push('--fix');
					}
				}
				break;
		}
		return r;
	}

	commandLineArgs(workDir: string = '.'): string[] {
		const r: string[] = [];

		if (this.globalOptions()) {
			r.push(...this.globalOptions());
		}

		r.push(this.command);

		if (this.commandOptions()) {
			r.push(...this.commandOptions());
		}

		r.push(workDir);

		if (this.targetPaths) {
			r.push(...this.targetPaths);
		}
		return r;
	}

	commandLine(workDir: string = '.'): string {
		return `batchai ${this.commandLineArgs(workDir).join(' ')}`;
	}
}

export class CommandUpdateReq {
	enableSymbolReference: boolean;

	force: boolean;

	num: number;

	lang: string;

	checkFix: boolean;

	testLibrary: string[];

	testUpdate: boolean;

	targetPaths: string[];

}

export class CommandCreateReq extends CommandUpdateReq {
	repoPath?: string;
	command?: string;
}

export class ParsedRepoPath {
	constructor(
		public ownerName: string,
		public repoName: string,
	) {}

	static parse(path: string): ParsedRepoPath {
		let p = path.trim();
		if (p.toLowerCase().startsWith('https://')) {
			p = p.substring('https://'.length);
		}
		if (p.indexOf('@') >= 0) {
			throw new Error('do not input credential in the repository path');
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
			return null;
		}
		const ownerName = elements[0];
		const repoName = elements[1];
		if (!ownerName || !repoName) {
			return null;
		}

		return new ParsedRepoPath(ownerName, repoName);
	}
}