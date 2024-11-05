import { CommandStatus } from '../constants';
import { Kontext } from '../framework';
import { CommandCreateReq, CommandDetail, CommandBasic } from '../dto';

export interface CommandApi {
	createCommand(x: Kontext, req: CommandCreateReq): Promise<CommandDetail>;

	listAllCommand(x: Kontext): Promise<CommandBasic[]>;

	listCommandByStatus(x: Kontext, status: CommandStatus): Promise<CommandBasic[]>;

	loadCommand(x: Kontext, id: number): Promise<CommandDetail>;

	loadCommandLog(x: Kontext, id: number): Promise<string>;

	resetCommand(x: Kontext, id: number): Promise<CommandDetail>;

	resumeCommand(x: Kontext, id: number): Promise<CommandDetail>;

	stopCommand(x: Kontext, id: number): Promise<CommandDetail>;

	removeCommand(x: Kontext, id: number): Promise<void>;
}
