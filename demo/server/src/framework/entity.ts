import {
	Entity,
	CreateDateColumn,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
	JoinColumn,
	ManyToOne,
} from 'typeorm';
import { User } from './user';

@Entity()
export class SimpleEntity {
	@PrimaryGeneratedColumn()
	id: number;
}

@Entity()
export class AuditableEntity extends SimpleEntity {
	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@JoinColumn({ name: 'creater_id' })
	@ManyToOne(() => User, { eager: true, createForeignKeyConstraints: false })
	creater: User;

	@UpdateDateColumn({ name: 'updated_at' })
	@Index()
	updatedAt: Date;

	@JoinColumn({ name: 'updater_id' })
	@ManyToOne(() => User, { eager: true, createForeignKeyConstraints: false })
	updater?: User;
}
