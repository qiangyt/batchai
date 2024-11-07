import { Controller, Get, Param, Delete, Query } from '@nestjs/common';
import { RepoFacade } from '../service';
import { Kontext, RequestKontext, Page, RequiredRoles, Role } from '../framework';
import { RepoBasic, RepoDetail, RepoSearchParams } from '../dto';
import { RepoApi } from '../api';

@Controller('rest/v1/repos')
export class RepoRest implements RepoApi {
	constructor(private facade: RepoFacade) {}

	@RequiredRoles(Role.Admin)
	@Get()
	async listAllRepo(@RequestKontext() x: Kontext): Promise<RepoBasic[]> {
		return this.facade.listAllRepo(x);
	}

	@RequiredRoles(Role.None)
	@Get('search')
	async searchRepo(@RequestKontext() x: Kontext, @Query() params: RepoSearchParams): Promise<Page<RepoBasic>> {
		return this.facade.searchRepo(x, params);
	}

	@RequiredRoles(Role.None)
	@Get('path/:ownerName/:repoName')
	async getRepoByOwnerAndName(
		@RequestKontext() x: Kontext,
		@Param('ownerName') ownerName: string,
		@Param('name') name: string,
	): Promise<RepoDetail> {
		return this.facade.getRepoByOwnerAndName(x, ownerName, name);
	}

	@RequiredRoles(Role.None)
	@Get('id/:id')
	async loadRepo(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<RepoDetail> {
		return this.facade.loadRepo(x, id);
	}

	@RequiredRoles(Role.Admin)
	@Delete('id/:id')
	async removeRepo(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<void> {
		return this.facade.removeRepo(x, id);
	}
}
