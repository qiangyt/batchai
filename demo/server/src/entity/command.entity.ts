import { Entity, Column, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CommandStatus, CommandRunStatus } from '../constants';
import path from 'path';
import { BadRequestException } from '@nestjs/common';
import { Repo } from '.';
import { AuditableEntity } from '../framework';

@Entity({ name: 'command' })
@Unique(['repo', 'command'])
export class Command extends AuditableEntity {
  @ManyToOne(() => Repo, { eager: false, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'repo_id' })
  repo: Promise<Repo>;

  @Column()
  command: string;

  @Column({ name: 'has_changes', nullable: true })
  hasChanges: boolean;

  @Column({ type: 'varchar', enum: CommandStatus })
  status: CommandStatus;

  @Column({ type: 'varchar', enum: CommandRunStatus, name: 'run_status', nullable: true })
  runStatus: CommandRunStatus;

  @Column({ name: 'commit_id', nullable: true })
  commitId: string;

  @Column({ name: 'global_options', type: 'json' })
  globalOptions: string[];

  @Column({ name: 'command_options', type: 'json' })
  commandOptions: string[];

  @Column({ name: 'target_paths', type: 'json', nullable: true })
  targetPaths: string[];

  private logFilePath: string;

  commitUrl(): string {
    return `https://github.com/batchai-examples/batchai/commit/${this.commitId}`;
  }

  async logFile(): Promise<string> {
    if (!this.logFilePath) {
      const p = await (await this.repo).logDir();
      this.logFilePath = path.join(p, `${this.id}.log`);
    }
    return this.logFilePath;
  }

  nextRunStatus(): CommandRunStatus {
    switch (this.runStatus) {
      case CommandRunStatus.Begin:
        return CommandRunStatus.CheckedRemote;
      case CommandRunStatus.CheckedRemote:
        return CommandRunStatus.Forked;
      case CommandRunStatus.Forked:
        return CommandRunStatus.ClonedOrPulled;
      case CommandRunStatus.ClonedOrPulled:
        return CommandRunStatus.CheckedOut;
      case CommandRunStatus.CheckedOut:
        return CommandRunStatus.BatchAIExecuted;
      case CommandRunStatus.BatchAIExecuted:
        return CommandRunStatus.ChangesAdded;
      case CommandRunStatus.ChangesAdded:
        return CommandRunStatus.ChangesCommited;
      case CommandRunStatus.ChangesCommited:
        return CommandRunStatus.ChangesPushed;
      case CommandRunStatus.ChangesPushed:
        return CommandRunStatus.GetCommitId;
      case CommandRunStatus.GetCommitId:
      //  return CommandRunStatus.CreatedPR;
      //case CommandRunStatus.CreatedPR:
      //  return CommandRunStatus.End;
      case CommandRunStatus.End:
        return CommandRunStatus.End;
    }
    throw new BadRequestException('unexpected run status: ' + this.runStatus);
  }
}
