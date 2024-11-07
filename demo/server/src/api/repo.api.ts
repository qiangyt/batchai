import { Kontext, Page } from '../framework';
import { RepoDetail, RepoBasic, RepoSearchParams } from '../dto';

export interface RepoApi {
	listAllRepo(x: Kontext): Promise<RepoBasic[]>;

	searchRepo(x: Kontext, params: RepoSearchParams): Promise<Page<RepoBasic>>;

	getRepoByOwnerAndName(x: Kontext, ownerName: string, name: string): Promise<RepoDetail>;

	loadRepo(x: Kontext, id: number): Promise<RepoDetail>;

	removeRepo(x: Kontext, id: number): Promise<void>;
}
