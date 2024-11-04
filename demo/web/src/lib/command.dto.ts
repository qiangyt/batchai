"use client";

import { RepoBasic } from './repo.dto';
import { AuditableDto } from './dto';
import { Page } from './page';
import { UserBasic } from './user.dto';


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


export class CommandBasic extends AuditableDto {
  command: string;
  commitId: string;
  commitUrl: string;
  status: CommandStatus;

  static cast(obj: any): CommandBasic {
    if (!obj) return obj;
    AuditableDto.cast(obj);
    return obj;
  }

  static castMany(cmds: any[]): CommandBasic[] {
    if (!cmds) return cmds;
    return cmds.map(CommandBasic.cast);
  }

  static fromPage(p: any): Page<CommandBasic> {
    if (!p) return p;
    Page.cast(p);
    CommandBasic.castMany(p.elements);
    return p;
  }

}

export class CommandDetail extends CommandBasic {
  repo: RepoBasic;

  hasChanges: boolean;

  runStatus: CommandRunStatus;

  globalOptions: string[];

  commandOptions: string[];

  targetPaths: string[];

  static cast(obj: any): CommandDetail {
    if (!obj) return obj;
    CommandBasic.cast(obj);
    RepoBasic.cast(obj.repo);
    Object.setPrototypeOf(obj, CommandDetail.prototype);
    return obj;
  }

  commandArgs():string{
    const args = [
      ...this.globalOptions, 
      this.command, 
      ...this.commandOptions, 
      ".", 
      ...this.targetPaths
    ];
    return args.join(' ');
  }

  commandLine():string{
    return `batchai ${this.commandArgs()}`;
  }
  
}

export class CommandCreateReq {
  repoPath?: string;
  command?: string;

  testLibraries?: string[];

  targetPaths?: string[];
  
}
