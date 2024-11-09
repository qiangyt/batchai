import { UIContextType } from '@/lib/ui.context';
import withAxios from './request'
import { SessionState, UserBasic, UserDetail } from '@/lib';

export async function ListAllUser(ctx:SessionState, ui: UIContextType): Promise<UserBasic[]> {
  return UserBasic.withMany(await withAxios(ctx, ui).get('/users'));
}

export async function LoadUser(ctx:SessionState, ui: UIContextType, id:number): Promise<UserDetail> {
  return UserDetail.with(await withAxios(ctx, ui).get(`/users/${id}`));
}
