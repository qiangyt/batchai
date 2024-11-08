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

  static with(obj: any): RepoBasic {
    if (!obj) return obj;
    AuditableDto.with(obj);
    UserBasic.with(obj.owner);
    CommandBasic.with(obj.checkCommand);
    CommandBasic.with(obj.testCommand);
    Object.setPrototypeOf(obj, RepoBasic.prototype);
    return obj;
  }

  static castMany(repos: any[]): RepoBasic[] {
    if (!repos) return repos;
    return repos.map(RepoBasic.with);
  }

  static fromPage(p: any): Page<RepoBasic> {
    if (!p) return p;
    Page.with(p);
    RepoBasic.castMany(p.elements);
    return p;
  }

}

export class RepoDetail extends RepoBasic {
  static with(obj: any): RepoDetail {
    if (!obj) return obj;
    RepoBasic.with(obj);
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
