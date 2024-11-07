import { UIContextType } from '@/lib/ui.context';
import useAxios from './request'
import { SessionState, RepoBasic, Page, RepoDetail, RepoSearchParams } from '@/lib';


export async function SearchRepo(ctx:SessionState, ui: UIContextType, params?: RepoSearchParams): Promise<Page<RepoBasic>> {
  const p:(Page<RepoBasic>) = await useAxios(ctx, ui).get('/repos/search', { params });
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
