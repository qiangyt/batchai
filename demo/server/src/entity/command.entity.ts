import { Entity, Column, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CommandStatus, CommandRunStatus } from '../constants';
import path from 'path';
import { BadRequestException } from '@nestjs/common';
import { Repo } from '.';
import { AuditableEntity } from '../framework';

@Entity({ name: 'command' })
@Unique(['repo', 'command'])
export class Command extends AuditableEntity {
	@ManyToOne(() => Repo, { eager: false, createForeignKeyConstraints: false })
	@JoinColumn({ name: 'repo_id' })
	repo: Promise<Repo>;

	@Column()
	command: string;

	@Column({ name: 'has_changes', nullable: true })
	hasChanges: boolean;

	@Column({ type: 'varchar', enum: CommandStatus })
	status: CommandStatus;

	@Column({ type: 'varchar', enum: CommandRunStatus, name: 'run_status', nullable: true })
	runStatus: CommandRunStatus;

	@Column({ name: 'commit_id', nullable: true })
	commitId: string;

	@Column({ name: 'enable_symbol_reference', nullable: true })
	enableSymbolReference: boolean;

	@Column({ name: 'force', nullable: true })
	force: boolean;

	@Column({ name: 'num', nullable: true })
	num: number;

	@Column({ name: 'lang', nullable: true })
	lang: string;

	@Column({ name: 'check_fix', nullable: true })
	checkFix: boolean;

	@Column({ name: 'test_library', nullable: true, type: 'json' })
	testLibrary: string[];

	@Column({ name: 'test_update', nullable: true })
	testUpdate: boolean;

	@Column({ name: 'target_paths', type: 'json', nullable: true })
	targetPaths: string[];

	commitUrl(): string {
		return `https://github.com/batchai-examples/batchai/commit/${this.commitId}`;
	}

	private _logFile: string;

	async logFile(): Promise<string> {
		if (!this._logFile) {
			const p = await (await this.repo).logDir();
			this._logFile = path.join(p, `${this.id}.log`);
		}
		return this._logFile;
	}

	nextRunStatus(): CommandRunStatus {
		switch (this.runStatus) {
			case CommandRunStatus.Begin:
				return CommandRunStatus.CheckedRemote;
			case CommandRunStatus.CheckedRemote:
				return CommandRunStatus.Forked;
			case CommandRunStatus.Forked:
				return CommandRunStatus.ClonedOrPulled;
			case CommandRunStatus.ClonedOrPulled:
				return CommandRunStatus.CheckedOut;
			case CommandRunStatus.CheckedOut:
				return CommandRunStatus.BatchAIExecuted;
			case CommandRunStatus.BatchAIExecuted:
				return CommandRunStatus.ChangesAdded;
			case CommandRunStatus.ChangesAdded:
				return CommandRunStatus.ChangesCommited;
			case CommandRunStatus.ChangesCommited:
				return CommandRunStatus.ChangesPushed;
			case CommandRunStatus.ChangesPushed:
				return CommandRunStatus.GetCommitId;
			case CommandRunStatus.GetCommitId:
			//  return CommandRunStatus.CreatedPR;
			//case CommandRunStatus.CreatedPR:
			//  return CommandRunStatus.End;
			case CommandRunStatus.End:
				return CommandRunStatus.End;
		}
		throw new BadRequestException('unexpected run status: ' + this.runStatus);
	}

	private _globalOptions: string[];

	globalOptions(): string[] {
		if (this._globalOptions === null || this._globalOptions === undefined) {
			const options = [];
			if (this.enableSymbolReference) {
				options.push('--enable-symbol-reference');
			}
			if (this.force) {
				options.push('--force');
			}
			if (this.num) {
				options.push(`--num ${this.num}`);
			}
			if (this.lang) {
				options.push(`--lang ${this.lang}`);
			}
			this._globalOptions = options;
		}
		return this._globalOptions;
	}

	private _commandOptions: string[];

	commandOptions(): string[] {
		if (this._commandOptions === null || this._commandOptions === undefined) {
			const options = [];
			switch (this.command) {
				case 'check':
					{
						if (this.checkFix) {
							options.push('--fix');
						}
					}
					break;
				case 'test':
					{
						if (this.testLibrary && this.testLibrary.length) {
							this.testLibrary.forEach((lib) => options.push('--library', lib));
						}
						if (this.checkFix) {
							options.push('--fix');
						}
					}
					break;
			}
			this._commandOptions = options;
		}
		return this._globalOptions;
	}

	private _commandLineArgs: string[];

	commandLineArgs(workDir: string): string[] {
		if (this._commandLineArgs === null || this._commandLineArgs === undefined) {
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

			this._commandLineArgs = r;
		}
		return this._commandLineArgs;
	}

	commandLine(workDir: string): string {
		return `batchai ${this.commandLineArgs(workDir).join(' ')}`;
	}
}
