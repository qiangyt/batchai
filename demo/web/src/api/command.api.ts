import { UIContextType } from '@/lib/ui.context';
import useAxios from './request'
import { SessionState, CommandDetail, CommandCreateReq } from '@/lib';


export async function CreateCommand(s:SessionState, ui: UIContextType, params: CommandCreateReq): Promise<CommandDetail> {
  return CommandDetail.cast(await useAxios(s, ui).get('/commands', {params}));
}

export async function LoadCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  const r:CommandDetail = await useAxios(s, ui).get(`/commands/id/${id}`);
  Object.setPrototypeOf(r, CommandDetail.prototype);
  return r;
}

export async function LoadCommandLog(s:SessionState, ui: UIContextType, id: number): Promise<string> {
  return await useAxios(s, ui).get(`/commands/id/${id}/log`);
}

export async function ResetCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  const r:CommandDetail = await useAxios(s, ui).patch(`/commands/id/${id}/reset`);
  Object.setPrototypeOf(r, CommandDetail.prototype);
  return r;
}

export async function ResumeCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  const r:CommandDetail = await useAxios(s, ui).patch(`/commands/id/${id}/resume`);
  Object.setPrototypeOf(r, CommandDetail.prototype);
  return r;
}

export async function StopCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  const r:CommandDetail = await useAxios(s, ui).patch(`/commands/id/${id}/stop`);
  Object.setPrototypeOf(r, CommandDetail.prototype);
  return r;
}

export async function RemoveCommand(s:SessionState, ui: UIContextType, id:number): Promise<CommandDetail> {
  const r:CommandDetail = await useAxios(s, ui).patch(`/commands/id/${id}/remove`);
  Object.setPrototypeOf(r, CommandDetail.prototype);
  return r;
}
