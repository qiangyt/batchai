import * as path from 'path';

export enum CommandStatus {
	Pending = 'Pending',
	Queued = 'Queued',
	Running = 'Running',
	Succeeded = 'Succeeded',
	Failed = 'Failed',
}

export enum CommandRunStatus {
	Begin = 'Begin',
	SyncRepo = 'SyncRepo',
	CheckedOut = 'CheckedOut',
	BatchAIExecuted = 'BatchAIExecuted',
	ChangesAdded = 'ChangesAdded',
	ChangesCommited = 'ChangesCommited',
	ChangesPushed = 'ChangesPushed',
	ChangesArchived = 'ChangesArchived',
	GetCommitId = 'GetCommitId',
	//CreatedPR = 'CreatedPR',
	End = 'End',
}

export const DATA_DIR = '/data/batchai-examples';
export const SQLITE_FILE = path.join(DATA_DIR, 'database.sqlite');
