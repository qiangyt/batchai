import { AuditableEntity } from './entity';
import { UserBasic } from './user';

export abstract class AuditableDto {
	id: number;

	createdAt: Date;

	creater: UserBasic;

	updatedAt: Date;

	updater: UserBasic;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async render(entity: AuditableEntity, ...deps: any[]): Promise<AuditableDto> {
		this.id = entity.id;
		this.createdAt = entity.createdAt;
		this.creater = await UserBasic.from(entity.creater);
		this.updatedAt = entity.updatedAt;
		this.updater = await UserBasic.from(entity.updater);
		return this;
	}
}
