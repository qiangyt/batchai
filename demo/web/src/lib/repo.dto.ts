"use client";

import { UserBasic } from './user.dto';
import { AuditableDto } from './dto';
import { CommandBasic } from './command.dto';
import { Page } from './page';

export class RepoBasic extends AuditableDto {
  owner: UserBasic;

  name: string;

  repoUrl: string;

  checkCommand: CommandBasic;

  testCommand: CommandBasic;

  repoPath(full=true) :string{
    const r = `${this.owner.name}/${this.name}`;
    return full ? `github.com/${r}` : r;
  }

  static cast(obj: any): RepoBasic {
    if (!obj) return obj;
    AuditableDto.cast(obj);
    UserBasic.cast(obj.owner);
    CommandBasic.cast(obj.checkCommand);
    CommandBasic.cast(obj.testCommand);
    Object.setPrototypeOf(obj, RepoBasic.prototype);
    return obj;
  }

  static castMany(repos: any[]): RepoBasic[] {
    if (!repos) return repos;
    return repos.map(RepoBasic.cast);
  }

  static fromPage(p: any): Page<RepoBasic> {
    if (!p) return p;
    Page.cast(p);
    RepoBasic.castMany(p.elements);
    return p;
  }
  
}

export class RepoDetail extends RepoBasic {
  static cast(obj: any): RepoDetail {
    if (!obj) return obj;
    RepoBasic.cast(obj);
    Object.setPrototypeOf(obj, RepoDetail.prototype);
    return obj;
  }
  
}

export class RepoSearchParams {
  page: number;

  limit: number;

  query: string;
}

export class RepoCreateReq {
  path: string;  
}
