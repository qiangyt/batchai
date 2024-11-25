import { Controller, Get, Param, Delete, Query, HttpStatus, HttpCode, Post, Body, Res, Patch } from '@nestjs/common';
import { Response } from 'express';
import { RepoFacade } from '../service';
import { Kontext, RequestKontext, Page, RequiredRoles, Role } from '../framework';
import { ListAvaiableTargetPathsParams, RepoBasic, RepoCreateReq, RepoDetail, RepoSearchParams } from '../dto';
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
	async removeRepo(
		@RequestKontext() x: Kontext,
		@Param('id') id: number,
		@Query('removeWorkingCopy') removeWorkingCopy: boolean,
	): Promise<void> {
		return this.facade.removeRepo(x, id, removeWorkingCopy);
	}

	@RequiredRoles(Role.User)
	@HttpCode(HttpStatus.CREATED)
	@Post()
	async createRepo(@RequestKontext() x: Kontext, @Body() params: RepoCreateReq): Promise<RepoDetail> {
		return this.facade.createRepo(x, params);
	}

	@RequiredRoles(Role.User)
	@Get('id/:id/available_paths')
	listAvaiableTargetPaths(
		@RequestKontext() x: Kontext,
		@Param('id') id: number,
		@Query() params: ListAvaiableTargetPathsParams,
	): Promise<string[]> {
		return this.facade.listAvaiableTargetPaths(x, id, params);
	}

	@RequiredRoles(Role.None)
	@Get('id/:id/artifact')
	async downloadArtifact(@RequestKontext() x: Kontext, @Param('id') id: number, @Res() res: Response) {
		const zipFilePath = await this.resolveRepoArchive(x, id);
		res.download(zipFilePath);
	}

	async resolveRepoArchive(x: Kontext, id: number): Promise<string> {
		return this.facade.resolveRepoArchive(x, id);
	}

	@RequiredRoles(Role.Admin)
	@Patch('id/:id/lock')
	async lockRepo(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<RepoDetail> {
		return this.facade.lockRepo(x, id);
	}

	@RequiredRoles(Role.Admin)
	@Patch('id/:id/unlock')
	async unlockRepo(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<RepoDetail> {
		return this.facade.unlockRepo(x, id);
	}
}
