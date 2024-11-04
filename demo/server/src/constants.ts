import path from 'path';

export enum CommandStatus {
  Pending = 'Pending',
  Queued = 'Queued',
  Running = 'Running',
  Succeeded = 'Succeeded',
  Failed = 'Failed',
}

export enum CommandRunStatus {
  Begin = 'Begin',
  CheckedRemote = 'CheckedRemote',
  Forked = 'Forked',
  ClonedOrPulled = 'ClonedOrPulled',
  CheckedOut = 'CheckedOut',
  BatchAIExecuted = 'BatchAIExecuted',
  ChangesAdded = 'ChangesAdded',
  ChangesCommited = 'ChangesCommited',
  ChangesPushed = 'ChangesPushed',
  GetCommitId = 'GetCommitId',
  //CreatedPR = 'CreatedPR',
  End = 'End',
}

export const DATA_DIR = '/data/batchai-examples';
export const SQLITE_FILE = path.join(DATA_DIR, 'database.sqlite');
export const JOB_LOG_DIR = path.join(DATA_DIR, 'job_log');
export const REPO_DIR = path.join(DATA_DIR, 'repo');
