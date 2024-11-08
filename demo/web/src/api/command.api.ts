import { UIContextType } from '@/lib/ui.context';
import withAxios from './request'
import { SessionState, CommandDetail, CommandCreateReq, CommandUpdateReq } from '@/lib';


export async function createCommand(s:SessionState, ui: UIContextType, params: CommandCreateReq): Promise<CommandDetail> {
  return CommandDetail.with(await withAxios(s, ui).post('/commands', params));
}

export async function loadCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  const r:CommandDetail = await withAxios(s, ui).get(`/commands/id/${id}`);
  Object.setPrototypeOf(r, CommandDetail.prototype);
  return r;
}

export async function loadCommandLog(s:SessionState, ui: UIContextType, id: number): Promise<string> {
  return await withAxios(s, ui).get(`/commands/id/${id}/log`);
}

export async function resetCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  const r:CommandDetail = await withAxios(s, ui).patch(`/commands/id/${id}/reset`);
  Object.setPrototypeOf(r, CommandDetail.prototype);
  return r;
}

export async function resumeCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  const r:CommandDetail = await withAxios(s, ui).patch(`/commands/id/${id}/resume`);
  Object.setPrototypeOf(r, CommandDetail.prototype);
  return r;
}

export async function stopCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  const r:CommandDetail = await withAxios(s, ui).patch(`/commands/id/${id}/stop`);
  Object.setPrototypeOf(r, CommandDetail.prototype);
  return r;
}

export async function updateCommand(s:SessionState, ui: UIContextType, id:number, params: CommandUpdateReq): Promise<CommandDetail> {
  const r:CommandDetail = await withAxios(s, ui).put(`/commands/id/${id}`, params);
  Object.setPrototypeOf(r, CommandDetail.prototype);
  return r;
}

export async function removeCommand(s:SessionState, ui: UIContextType, id:number): Promise<void> {
  withAxios(s, ui).patch(`/commands/id/${id}/remove`);
}
