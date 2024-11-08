import { UIContextType } from '@/lib/ui.context';
import withAxios from './request'
import { SessionState, UserBasic, UserDetail } from '@/lib';

export async function ListAllUser(ctx:SessionState, ui: UIContextType): Promise<UserBasic[]> {
  const r:UserBasic[] = await withAxios(ctx, ui).get('/users');
  r.forEach((e) => {
    Object.setPrototypeOf(e, UserBasic.prototype);
  });
  return r;
}

export async function LoadUser(ctx:SessionState, ui: UIContextType, id:number): Promise<UserDetail> {
  const r:UserDetail = await withAxios(ctx, ui).get(`/users/${id}`);
  Object.setPrototypeOf(r, UserDetail.prototype);
  return r;
}
