import { Entity, Column, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { User, AuditableEntity } from '../framework';
import path from 'path';
import { mkdirp } from 'mkdirp';
import { JOB_LOG_DIR } from '../constants';
import { Command } from './command.entity';

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

	private repoDirPath: string;

	private logDirPath: string;

	repoUrl(): string {
		return `https://github.com/${this.owner.name}/${this.name}`;
	}

	async logDir(): Promise<string> {
		if (!this.logDirPath) {
			const p = path.join(JOB_LOG_DIR, this.name, this.name);
			await mkdirp(p);

			this.logDirPath = p;
		}
		return this.logDirPath;
	}

	async repoDir(): Promise<string> {
		if (!this.repoDirPath) {
			const ownerDir = await this.owner.dir();
			this.repoDirPath = path.join(ownerDir, this.name);
		}
		return this.repoDirPath;
	}

	private repoGitDirPath: string;

	async repoGitDir(): Promise<string> {
		if (!this.repoGitDirPath) {
			const repoDir = await this.repoDir();
			this.repoGitDirPath = path.join(repoDir, '.git');
		}
		return this.repoGitDirPath;
	}
}
