import { UIContextType } from '@/lib/ui.context';
import withAxios from './request'
import { SessionState, RepoBasic, Page, RepoDetail, RepoSearchParams, RepoCreateReq, ListAvaiableTargetPathsParams } from '@/lib';


export async function searchRepo(s:SessionState, ui: UIContextType, params?: RepoSearchParams): Promise<Page<RepoBasic>> {
  const p:(Page<RepoBasic>) = await withAxios(s, ui).get('/repos/search', { params });
  return RepoBasic.withPage(p);
}

export async function loadRepo(s:SessionState, ui: UIContextType, id:number): Promise<RepoDetail> {
  return RepoDetail.with(await withAxios(s, ui).get(`/repos/id/${id}`));
}

export async function createRepo(s: SessionState, ui: UIContextType, params: RepoCreateReq): Promise<RepoDetail> {
  return RepoDetail.with(await withAxios(s, ui).post(`/repos`, params));
}

export async function removeRepo(s:SessionState, ui: UIContextType, id:number): Promise<void> {
  return withAxios(s, ui).delete(`/repos/id/${id}`);
}

export async function listAvaiableTargetPaths(s:SessionState, ui: UIContextType, id: number, params: ListAvaiableTargetPathsParams): Promise<string[]> {
  return withAxios(s, ui).get(`/repos/id/${id}/available_paths`, { params });
}

export async function doesRepoDirExists(s:SessionState, ui: UIContextType, id: number): Promise<boolean> {
  return withAxios(s, ui).get(`/repos/id/${id}/dir/exists`);
}