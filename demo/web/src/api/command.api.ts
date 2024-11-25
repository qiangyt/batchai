import { UIContextType } from '@/lib/ui.context';
import withAxios from './request'
import { SessionState, CommandDetail, CommandCreateReq, CommandUpdateReq, ListAvaiableTargetPathsParams, CommandLog } from '@/lib';
import { CheckReport, TestReport } from '@/lib';

// @RequiredRoles(Role.User)
export async function createCommand(s:SessionState, ui: UIContextType, params: CommandCreateReq): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).post('/commands', params));
}

export async function loadCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).get(`/commands/id/${id}`));
}

// @RequiredRoles(Role.User)
export async function restartCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).patch(`/commands/id/${id}/restart`));
}

// @RequiredRoles(Role.User)
export async function stopCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).patch(`/commands/id/${id}/stop`));
}

// @RequiredRoles(Role.User)
export async function updateCommand(s:SessionState, ui: UIContextType, id:number, params: CommandUpdateReq): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).put(`/commands/id/${id}`, params));
}

// @RequiredRoles(Role.Admin)
export async function removeCommand(s:SessionState, ui: UIContextType, id:number): Promise<void> {
  return withAxios(s, ui).delete(`/commands/id/${id}`);
}

// @RequiredRoles(Role.None)
export async function loadCommandCheckReports(s:SessionState, ui: UIContextType, id: number): Promise<CheckReport[]> {
  return CheckReport.withMany(await withAxios(s, ui).get(`/commands/id/${id}/check_reports`));
}

// @RequiredRoles(Role.None)
export async function loadCommandTestReports(s:SessionState, ui: UIContextType, id: number): Promise<TestReport[]> {
  return TestReport.withMany(await withAxios(s, ui).get(`/commands/id/${id}/test_reports`));
}

// @RequiredRoles(Role.Admin)
export async function lockCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).patch(`/commands/id/${id}/lock`));
}

// @RequiredRoles(Role.Admin)
export async function unlockCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).patch(`/commands/id/${id}/unlock`));
}