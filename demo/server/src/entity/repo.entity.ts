import { Entity, Column, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { User, AuditableEntity } from '../framework';
import { Command } from './command.entity';

export const EXAMPLES_ORG = 'batchai-examples';

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

	@Column({ nullable: true })
	locked: boolean;

	repoUrl(): string {
		return `https://github.com/${this.owner.name}/${this.name}`;
	}

	forkUrl(): string {
		return `https://github.com/${EXAMPLES_ORG}/${this.name}`;
	}
}
