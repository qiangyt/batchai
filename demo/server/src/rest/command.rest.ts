import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CommandStatus } from '../constants';
import { CommandFacade } from '../service';
import { CommandApi } from '../api';
import { RequiredRoles, Role, Kontext, RequestKontext } from '../framework';
import { CommandDetail, CommandBasic, CommandCreateReq } from '../dto';

@Controller('rest/v1/commands')
export class CommandRest implements CommandApi {
  constructor(private facade: CommandFacade) {}

  @RequiredRoles(Role.User)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createCommand(@RequestKontext() x: Kontext, @Body() params: CommandCreateReq): Promise<CommandDetail> {
    return this.facade.createCommand(x, params);
  }

  @RequiredRoles(Role.None)
  @Get('status/:status')
  async listCommandByStatus(
    @RequestKontext() x: Kontext,
    @Param('status') status: CommandStatus,
  ): Promise<CommandBasic[]> {
    return this.facade.listCommandByStatus(x, status);
  }

  @RequiredRoles(Role.None)
  @Get()
  async listAllCommand(@RequestKontext() x: Kontext): Promise<CommandBasic[]> {
    return this.facade.listAllCommand(x);
  }

  @RequiredRoles(Role.None)
  @Get('id/:id')
  async loadCommand(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<CommandDetail> {
    return this.facade.loadCommand(x, id);
  }

  @RequiredRoles(Role.None)
  @Get('id/:id/log')
  loadCommandLog(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<string> {
    return this.facade.loadCommandLog(x, id);
  }

  @RequiredRoles(Role.User)
  @Patch('id/:id/reset')
  async resetCommand(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<CommandDetail> {
    return this.facade.resetCommand(x, id);
  }

  @RequiredRoles(Role.User)
  @Patch('id/:id/resume')
  async resumeCommand(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<CommandDetail> {
    return this.facade.resumeCommand(x, id);
  }

  @RequiredRoles(Role.User)
  @Patch('id/:id/stop')
  async stopCommand(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<CommandDetail> {
    return this.facade.stopCommand(x, id);
  }

  @RequiredRoles(Role.Admin)
  @Delete('id/:id')
  async removeCommand(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<void> {
    return this.facade.removeCommand(x, id);
  }
}
