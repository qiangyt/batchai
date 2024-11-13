import { Entity, Column, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { User, AuditableEntity } from '../framework';
import { JOB_LOG_ARCHIVE_DIR, JOB_LOG_DIR } from '../constants';
import { Command } from './command.entity';
import path from 'path';
import { mkdirp } from 'mkdirp';
import { GithubRepo } from 'src/helper';

@Entity()
@Unique(['owner', 'name'])
export class Repo extends AuditableEntity {
	@OneToMany(() => Command, (command) => command.repo, { eager: true, createForeignKeyConstraints: false })
	commands: Command[];

	@ManyToOne(() => User, { eager: true, createForeignKeyConstraints: false })
	@JoinColumn({ name: 'owner_id' })
	owner: User;

	@Column({ name: 'name' })
	name: string;

	private logDirPath: string;

	repoUrl(): string {
		return `https://github.com/${this.owner.name}/${this.name}`;
	}

	async logDir(): Promise<string> {
		if (!this.logDirPath) {
			const p = path.join(JOB_LOG_DIR, this.owner.name, this.name);
			await mkdirp(p);

			this.logDirPath = p;
		}
		return this.logDirPath;
	}

	async logArchiveDir(): Promise<string> {
		const p = path.join(JOB_LOG_ARCHIVE_DIR, this.owner.name, this.name);
		await mkdirp(p);
		return p;
	}

	async repoArchiveDir(ts: string): Promise<string> {
		const ownerArchiveDir = await this.owner.archiveDir();
		const repoArchiveDirParent = path.join(ownerArchiveDir, this.name);
		await mkdirp(repoArchiveDirParent);
		return path.join(repoArchiveDirParent, ts);
	}

	forkedRepoObject(log: (output: string) => void): GithubRepo {
		const repoObj = this.repoObject(log);
		return repoObj.forkedRepo();
	}

	forkedRepoDir(log: (output: string) => void): string {
		const fork = this.forkedRepoObject(log);
		return fork.repoDir();
	}

	artifactArchiveFile(): string {
		const artifactDir = this.forkedRepoDir(null);
		return path.join(path.dirname(artifactDir), `${this.owner.name}_${this.name}.zip`);
	}

	repoObject(log: (output: string) => void): GithubRepo {
		return new GithubRepo(log, '/data/batchai-examples/repo', this.owner.name, this.name, false);
	}
}
