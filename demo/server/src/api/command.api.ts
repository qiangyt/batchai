import { CommandStatus } from '../constants';
import { Kontext } from '../framework';
import { CommandCreateReq, CommandDetail, CommandBasic, CommandUpdateReq, CommandLog } from '../dto';
import { CheckReport, TestReport } from 'src/dto';

export interface CommandApi {
	createCommand(x: Kontext, req: CommandCreateReq): Promise<CommandDetail>;

	updateCommand(x: Kontext, id: number, req: CommandUpdateReq): Promise<CommandDetail>;

	listAllCommand(x: Kontext): Promise<CommandBasic[]>;

	listCommandByStatus(x: Kontext, status: CommandStatus): Promise<CommandBasic[]>;

	loadCommand(x: Kontext, id: number): Promise<CommandDetail>;

	loadCommandAuditLog(x: Kontext, id: number): Promise<CommandLog[]>;

	loadCommandCheckReports(x: Kontext, id: number): Promise<CheckReport[]>;

	loadCommandTestReports(x: Kontext, id: number): Promise<TestReport[]>;

	loadCommandExecutionLog(x: Kontext, id: number): Promise<CommandLog[]>;

	restartCommand(x: Kontext, id: number): Promise<CommandDetail>;

	resumeCommand(x: Kontext, id: number): Promise<CommandDetail>;

	stopCommand(x: Kontext, id: number): Promise<CommandDetail>;

	removeCommand(x: Kontext, id: number): Promise<void>;

	resolveCommandArchive(x: Kontext, id: number): Promise<string>;
}
