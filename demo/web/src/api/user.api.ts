import { UIContextType } from '@/lib/ui.context';
import withAxios from './request'
import { SessionState, SignInDetail, UserBasic, UserDetail } from '@/lib';

// @RequiredRoles(Role.Admin)
export async function listAllUser(ctx: SessionState, ui: UIContextType): Promise<UserBasic[]> {
  return UserBasic.withMany(await withAxios(ctx, ui).get('/users'));
}

// @RequiredRoles(Role.Admin)
export async function loadUser(ctx: SessionState, ui: UIContextType, id: number): Promise<UserDetail> {
  return UserDetail.with(await withAxios(ctx, ui).get(`/users/id/${id}`));
}

// @RequiredRoles(Role.User)
export async function renewUser(refreshToken: string): Promise<SignInDetail> {
  return SignInDetail.with(await withAxios(null, null).get(`/users/renew`, { params: { refreshToken } }));
}
