import { UIContextType } from '@/lib/ui.context';
import withAxios from './request'
import { SessionState, UserBasic, UserDetail } from '@/lib';

// @RequiredRoles(Role.Admin)
export async function ListAllUser(ctx:SessionState, ui: UIContextType): Promise<UserBasic[]> {
  return UserBasic.withMany(await withAxios(ctx, ui).get('/users'));
}

// @RequiredRoles(Role.Admin)
export async function LoadUser(ctx:SessionState, ui: UIContextType, id:number): Promise<UserDetail> {
  return UserDetail.with(await withAxios(ctx, ui).get(`/users/${id}`));
}
