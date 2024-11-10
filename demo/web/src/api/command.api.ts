import { UIContextType } from '@/lib/ui.context';
import withAxios from './request'
import { SessionState, CommandDetail, CommandCreateReq, CommandUpdateReq, ListAvaiableTargetPathsParams } from '@/lib';


export async function createCommand(s:SessionState, ui: UIContextType, params: CommandCreateReq): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).post('/commands', params));
}

export async function loadCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).get(`/commands/id/${id}`));
}

export async function loadCommandLog(s:SessionState, ui: UIContextType, id: number): Promise<string> {
  return await withAxios(s, ui).get(`/commands/id/${id}/log`);
}

export async function listAvaiableTargetPaths(s:SessionState, ui: UIContextType, id: number, params: ListAvaiableTargetPathsParams): Promise<string[]> {
  return withAxios(s, ui).get(`/commands/id/${id}/available_paths`, { params });
}

export async function restartCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).patch(`/commands/id/${id}/restart`));
}

export async function resumeCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).patch(`/commands/id/${id}/resume`));
}

export async function stopCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).patch(`/commands/id/${id}/stop`));
}

export async function updateCommand(s:SessionState, ui: UIContextType, id:number, params: CommandUpdateReq): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).put(`/commands/id/${id}`, params));
}

export async function removeCommand(s:SessionState, ui: UIContextType, id:number): Promise<void> {
  return withAxios(s, ui).delete(`/commands/id/${id}`);
}
