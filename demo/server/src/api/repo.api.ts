import { Kontext, Page } from '../framework';
import { RepoDetail, RepoBasic, RepoSearchParams, RepoCreateReq, ListAvaiableTargetPathsParams } from '../dto';

export interface RepoApi {
	createRepo(x: Kontext, params: RepoCreateReq): Promise<RepoDetail>;

	listAllRepo(x: Kontext): Promise<RepoBasic[]>;

	searchRepo(x: Kontext, params: RepoSearchParams): Promise<Page<RepoBasic>>;

	getRepoByOwnerAndName(x: Kontext, ownerName: string, name: string): Promise<RepoDetail>;

	loadRepo(x: Kontext, id: number): Promise<RepoDetail>;

	removeRepo(x: Kontext, id: number, removeWorkingCopy: boolean): Promise<void>;

	listAvaiableTargetPaths(x: Kontext, id: number, params: ListAvaiableTargetPathsParams): Promise<string[]>;

	resolveRepoArchive(x: Kontext, id: number): Promise<string>;

	lockRepo(x: Kontext, id: number): Promise<RepoDetail>;

}
