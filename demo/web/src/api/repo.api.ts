import { UIContextType } from '@/lib/ui.context';
import useAxios from './request'
import { SessionState, RepoBasic, Page, RepoDetail, RepoQueryParams } from '@/lib';


export async function QueryRepo(ctx:SessionState, ui: UIContextType, params?: RepoQueryParams): Promise<Page<RepoBasic>> {
  const p:(Page<RepoBasic>) = await useAxios(ctx, ui).get('/repos/query', { params });
  p.elements.forEach((e) => {
    Object.setPrototypeOf(e, RepoBasic.prototype);
  });
  return p;
}

export async function LoadRepo(ctx:SessionState, ui: UIContextType, id:number): Promise<RepoDetail> {
  const r:RepoDetail = await useAxios(ctx, ui).get(`/repos/id/${id}`);
  Object.setPrototypeOf(r, RepoDetail.prototype);
  return r;
}
