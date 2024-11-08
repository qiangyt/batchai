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

	static with(obj: any): CommandBasic {
		if (!obj) return obj;
		AuditableDto.with(obj);
		return obj;
	}

	static withMany(cmds: any[]): CommandBasic[] {
		if (!cmds) return cmds;
		return cmds.map(CommandBasic.with);
	}

	static withPage(p: any): Page<CommandBasic> {
		if (!p) return p;
		Page.with(p);
		CommandBasic.withMany(p.elements);
		return p;
	}

}

export class CommandDetail extends CommandBasic {
  repo: RepoBasic;


	static with(obj: any): CommandDetail {
		if (!obj) return obj;
		CommandBasic.with(obj);
		RepoBasic.with(obj.repo);
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
