import { AuditableEntity } from './entity';
import { UserBasic } from './user';

export abstract class AuditableDto {
	id: number;

	createdAt: Date;

	creater: UserBasic;

	updatedAt: Date;

	updater: UserBasic;

	render(entity: AuditableEntity): AuditableDto {
		this.id = entity.id;
		this.createdAt = entity.createdAt;
		this.creater = UserBasic.from(entity.creater);
		this.updatedAt = entity.updatedAt;
		this.updater = UserBasic.from(entity.updater);
		return this;
	}
}
