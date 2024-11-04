import { Injectable } from '@nestjs/common';
import { RepoBasic, RepoDetail, RepoQueryParams } from '../dto';
import { DataSource } from 'typeorm';
import { RepoService } from './repo.service';
import { CommandService } from './command.service';
import { UserService, Page, Transactional, Kontext } from '../framework';
import { RepoApi } from '../api';

@Injectable()
export class RepoFacade implements RepoApi {
  constructor(
    private service: RepoService,
    private commandService: CommandService,
    private userService: UserService,
    private readonly dataSource?: DataSource,
  ) {}

  @Transactional({ readOnly: true })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async queryRepo(x: Kontext, params: RepoQueryParams): Promise<Page<RepoBasic>> {
    const result = await this.service.query(params);
    return RepoBasic.fromPage(result);
  }

  @Transactional({ readOnly: true })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getRepoByOwnerAndName(x: Kontext, ownerName: string, name: string): Promise<RepoDetail> {
    const repo = await this.service.getByOwnerAndName(ownerName, name);
    return RepoDetail.from(repo);
  }

  @Transactional({ readOnly: true })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listAllRepo(x: Kontext): Promise<RepoBasic[]> {
    return RepoBasic.fromMany(await this.service.listAll());
  }

  @Transactional({ readOnly: true })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async loadRepo(x: Kontext, id: number): Promise<RepoDetail> {
    const repo = await this.service.load(id);
    return RepoDetail.from(repo);
  }

  @Transactional()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeRepo(x: Kontext, id: number): Promise<void> {
    const repo = await this.service.load(id);
    return this.service.remove(repo);
  }
}
