import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CommandStatus, CommandRunStatus } from '../constants';
import { promises as fs } from 'fs';
import { SchedulerRegistry } from '@nestjs/schedule';
import PQueue from 'p-queue';
import {
	spawnAsync,
	GithubRepo,
	readJsonLogFile,
	copyFileOrDir,
	traverseFilesWithExtension,
	dirExists,
	readJsonFile,
	fileExists,
} from '../helper';
import { Repo, Command, EXAMPLES_ORG } from '../entity';
import { CommandCreateReq, CommandDetail, CommandLog, CommandUpdateReq } from '../dto';
import { Kontext } from '../framework';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ArtifactFiles } from './artifact.files';
import { CheckReport, TestReport } from 'src/dto';

class CommandExecutionContext {
	constructor(
		public command: Command,
		readonly auditLog: string,
		readonly executionLog: string,
	) {}

	static async build(command: Command, artifactFiles: ArtifactFiles): Promise<CommandExecutionContext> {
		const [auditLog, executionLog] = await Promise.all([
			artifactFiles.commandAuditLog(command),
			artifactFiles.commandExecutionLog(command),
		]);
		return new CommandExecutionContext(command, auditLog, executionLog);
	}
}

@Injectable()
@WebSocketGateway({ cors: '*' /*, namespace: 'ws/v1/commands'*/ })
export class CommandService {
	private readonly logger = new Logger(CommandService.name);

	private readonly queue = new PQueue({ concurrency: 1 });

	@WebSocketServer()
	websocket: Server;

	constructor(
		private readonly scheduler: SchedulerRegistry,
		@InjectRepository(Command) private readonly dao: Repository<Command>,
		private readonly artifactFiles: ArtifactFiles,
	) {}

	async initCheck() {
		this.logger.debug('cmd check begin');

		const interrupted = await this.listByStatus(CommandStatus.Running);

		if (interrupted.length) {
			this.logger.warn(`found ${interrupted.length} interrupted commands`);
		} else {
			this.logger.log('no interrupted commands');
		}
		await Promise.all(
			interrupted.map((cmd) => {
				this.logger.warn(`interrupted command: ${JSON.stringify(cmd)}`);
				this.updateStatus(null, cmd, CommandStatus.Failed);
			}),
		);

		const cmds = await this.dao.find({
			where: { status: CommandStatus.Queued },
			order: { createdAt: 'ASC' },
		});

		if (interrupted.length) {
			this.logger.warn(`found ${cmds.length} queued commands`);
		} else {
			this.logger.log('no queued commands');
		}
		cmds.map((c) => this.enqueue(null, c));
	}

	private async enqueue(x: Kontext, c: Command): Promise<Command> {
		this.logger.log(`adding command to queue: ${JSON.stringify(c)}`);

		if (c.status !== CommandStatus.Queued) {
			c = await this.updateStatus(x, c, CommandStatus.Queued);
		}

		this.queue.add(async () => {
			try {
				await this.execute(x, c);
			} catch (err) {
				this.logger.log(`run command: queueing failed - err=${err}, ${JSON.stringify(c)}`);
			}
		});

		this.logger.log(`successfully added command to queue: ${c.id}`);
		return c;
	}

	async update(x: Kontext, id: number, params: CommandUpdateReq): Promise<Command> {
		this.logger.log(`updating command: id=${id}`);

		params.normalize();

		let c = await this.load(id);
		if (c.locked) {
			throw new ConflictException(`cannot update a locked command: ${c.id}`);
		}
		if (c.status === CommandStatus.Running) {
			throw new ConflictException(`cannot update a running command: ${c.id}`);
		}

		const u = x.user;

		if (c.enableSymbolReference !== params.enableSymbolReference) {
			u.ensureHasAdminRole();
			c.enableSymbolReference = params.enableSymbolReference;
		}

		c.force = params.force;

		if (params.num !== null && params.num !== undefined) {
			if (c.num !== params.num) {
				c.num = params.num;

				const numQuota = u.getNumQuote();
				if (numQuota > 0) {
					if (c.num <= 0 || c.num > numQuota) {
						throw new BadRequestException('processing usage reached');
					}
				}
			}
		}

		c.lang = params.lang;

		if (c.checkFix !== params.checkFix) {
			u.ensureHasAdminRole();
			c.checkFix = params.checkFix;
		}

		c.testLibrary = params.testLibrary;
		c.testUpdate = params.testUpdate;
		c.targetPaths = params.targetPaths;
		c.creater = u;

		c = await this.dao.save(c);
		this.logger.log(`Successfully updated command: ${c.id}`);

		if (params.executeItRightNow) {
			c = await this.restart(x, c);
		}

		return c;
	}

	async create(x: Kontext, params: CommandCreateReq, repo: Repo): Promise<Command> {
		this.logger.log(`creating command: params=${JSON.stringify(params)}, repo=${JSON.stringify(repo)}`);

		params.normalize();

		if (await this.dao.existsBy({ repo: { id: repo.id }, command: params.command })) {
			throw new ConflictException(`repository=${repo.repoUrl()}, command=${params.command}`);
		}

		const u = x.user;

		let c = new Command();
		c.repo = Promise.resolve(repo);
		c.command = params.command;
		c.status = CommandStatus.Pending;
		c.runStatus = CommandRunStatus.Begin;

		if (params.enableSymbolReference !== null && params.enableSymbolReference !== undefined) {
			u.ensureHasAdminRole();
			c.enableSymbolReference = params.enableSymbolReference;
		} else {
			c.enableSymbolReference = false;
		}

		c.force = params.force;

		const numQuota = u.getNumQuote();
		if (params.num !== null && params.num !== undefined) {
			c.num = params.num;
		} else {
			c.num = numQuota;
		}
		if (numQuota > 0) {
			if (c.num <= 0 || c.num > numQuota) {
				throw new BadRequestException('processing usage reached');
			}
		}

		c.lang = params.lang;

		if (params.checkFix !== null && params.checkFix !== undefined) {
			u.ensureHasAdminRole();
			c.checkFix = params.checkFix;
		} else {
			c.checkFix = params.command === 'check';
		}

		c.testLibrary = params.testLibrary;
		c.testUpdate = params.testUpdate;
		c.targetPaths = params.targetPaths;
		c.creater = u;

		c = await this.dao.save(c);
		this.logger.log(`successfully created command: params=${JSON.stringify(params)}, repo=${JSON.stringify(repo)}`);

		if (params.executeItRightNow) {
			c = await this.enqueue(x, c);
		}

		return c;
	}

	listAll(): Promise<Command[]> {
		return this.dao.find({ order: { updatedAt: 'DESC' } });
	}

	listByStatus(status: CommandStatus): Promise<Command[]> {
		return this.dao.find({
			where: { status },
			order: { id: 'ASC' },
		});
	}

	findById(id: number): Promise<Command> {
		return this.dao.findOneBy({ id });
	}

	async load(id: number): Promise<Command> {
		const r = await this.findById(id);
		if (!r) {
			throw new NotFoundException(`id=${id}`);
		}
		return r;
	}

	async loadAuditLog(id: number): Promise<CommandLog[]> {
		const c = await this.load(id);
		const auditLogFile = await this.artifactFiles.commandAuditLog(c);
		return readJsonLogFile(auditLogFile);
	}

	async loadExecutionLog(id: number): Promise<CommandLog[]> {
		const c = await this.load(id);
		const executionLogFile = await this.artifactFiles.commandAuditLog(c);
		return readJsonLogFile(executionLogFile);
	}

	async loadCommandCheckReports(x: Kontext, id: number): Promise<CheckReport[]> {
		const c = await this.load(id);

		const folder = await this.artifactFiles.commandRepoBatchaiFolder(c);
		if (!(await dirExists(folder))) {
			return [];
		}

		const reportFiles = await traverseFilesWithExtension(folder, '.check.batchai.json');
		const reports = await Promise.all(reportFiles.map(async (f) => CheckReport.with(await readJsonFile(f))));
		return reports.filter((r) => r.has_issue);
	}

	async loadCommandTestReports(x: Kontext, id: number): Promise<TestReport[]> {
		const c = await this.load(id);

		const folder = await this.artifactFiles.commandRepoBatchaiFolder(c);
		if (!(await dirExists(folder))) {
			return [];
		}

		const reportFiles = await traverseFilesWithExtension(folder, '.test.batchai.json');
		return await Promise.all(reportFiles.map(async (f) => TestReport.with(await readJsonFile(f))));
	}

	//@Interval('Commands', 5 * 1000)
	private async execute(x: Kontext, c: Command): Promise<void> {
		this.logger.log(`begin to run command: checking - ${JSON.stringify(c)}`);

		// confirm the command is queued
		if (c.status !== CommandStatus.Queued) {
			this.logger.log(`run command: cancelled - ${JSON.stringify(c)}`);
			return;
		}

		c = await this.updateStatus(x, c, CommandStatus.Running);
		await this.artifactFiles.archiveCommand(c);
		await this.artifactFiles.removeCommand(c);

		const exeCtx = await CommandExecutionContext.build(c, this.artifactFiles);
		try {
			await this.auditLog(exeCtx, `begin to run command`);
			await this.doRun(exeCtx);
			await this.auditLog(exeCtx, `end to run command (succeeded)\n\n\n\n`);

			c = await this.updateStatus(x, c, CommandStatus.Succeeded);
			this.logger.log(`run command: succeeded: ${JSON.stringify(c)}`);
		} catch (err) {
			this.logger.log(`run command: failed: err=${err}, ${JSON.stringify(c)}`);

			try {
				await this.auditLog(exeCtx, err.toString());
				await this.auditLog(exeCtx, `end to run command (failed)\n\n\n\n`);
			} catch (err) {
				this.logger.error(`run command: failed to log: err=${err}, ${JSON.stringify(c)}`);
			}

			c = await this.updateStatus(x, c, CommandStatus.Failed);
		}
	}

	private async updateStatus(x: Kontext, c: Command, status: CommandStatus): Promise<Command> {
		c.status = status;
		c.updater = x?.user;
		c = await this.dao.save(c);

		const update = await CommandDetail.from(c, this.artifactFiles);
		this.websocket.to(`status-${c.id}`).emit(`status-${c.id}`, update);

		return c;
	}

	private async updateRunStatus(c: Command, runStatus: CommandRunStatus): Promise<Command> {
		c.runStatus = runStatus;
		c = await this.dao.save(c);

		const update = await CommandDetail.from(c, this.artifactFiles);
		this.websocket.to(`status-${c.id}`).emit(`status-${c.id}`, update);

		return c;
	}

	@SubscribeMessage('subscribeStatusEvent')
	async subscribeStatusEvent(@ConnectedSocket() client: Socket, @MessageBody() id: number) {
		const c = await this.findById(id);
		if (!c) {
			return;
		}
		client.join(`status-${id}`);
	}

	private async commandLog(cmd: Command, logFile: string, logEventName: string, message: string): Promise<void> {
		const v = new CommandLog(new Date().toISOString(), message);
		const jsonLine = JSON.stringify(v);
		await fs.appendFile(logFile, jsonLine + `\n`, { encoding: 'utf8' });

		this.websocket.to(`log-${cmd.id}`).emit(logEventName, v);
	}

	private async auditLog(exeCtx: CommandExecutionContext, message: string) {
		const cmd = exeCtx.command;
		const id = cmd.id;

		await Promise.all([
			/* audit log */ this.commandLog(cmd, exeCtx.auditLog, `auditLog-${id}`, message),
			/* server log */ this.logger.log(`command log(id=${cmd.id}): ${message}`),
		]);
	}

	private async executionLog(exeCtx: CommandExecutionContext, message: string) {
		const cmd = exeCtx.command;
		const id = cmd.id;

		await Promise.all([
			/* audit log */ this.commandLog(cmd, exeCtx.auditLog, `auditLog-${id}`, message),
			/* execution log */ this.commandLog(cmd, exeCtx.executionLog, `executionLog-${id}`, message),
			/* server log */ this.logger.log(`command log(id=${cmd.id}): ${message}`),
		]);
	}

	@SubscribeMessage('subscribeLogEvent')
	async subscribeLogEvent(
		@ConnectedSocket() client: Socket,
		@MessageBody() id: number,
	): Promise<[CommandLog[], CommandLog[]]> {
		const c = await this.findById(id);
		if (!c) {
			return [[], []];
		}

		const [auditLogFile, executionLogFile] = await Promise.all([
			this.artifactFiles.commandAuditLog(c),
			this.artifactFiles.commandExecutionLog(c),
		]);
		const [auditLogLines, executionLogLines] = await Promise.all([
			readJsonLogFile(auditLogFile),
			readJsonLogFile(executionLogFile),
		]);

		client.join(`log-${id}`);

		return [auditLogLines, executionLogLines];
	}

	async restart(x: Kontext, c: Command): Promise<Command> {
		this.logger.log(`restarting command: ${JSON.stringify(c)}`);

		if (c.status === CommandStatus.Running) {
			throw new ConflictException(`cannot restart a running command: ${c.id}`);
		}

		c.hasChanges = false;
		c.status = CommandStatus.Pending;
		c.runStatus = CommandRunStatus.Begin;
		c.updater = x?.user;
		await this.dao.save(c);

		c = await this.enqueue(x, c);
		this.logger.log(`successfully restarted command: ${JSON.stringify(c)}`);
		return c;
	}

	async resume(x: Kontext, c: Command): Promise<Command> {
		this.logger.log(`resuming command: ${JSON.stringify(c)}`);

		if (c.status !== CommandStatus.Pending && c.status !== CommandStatus.Failed) {
			throw new ConflictException(`cannot resume a ${c.status} command`);
		}
		c = await this.enqueue(x, c);
		this.logger.log(`successfully resumed command: ${JSON.stringify(c)}`);
		return c;
	}

	async stop(x: Kontext, c: Command): Promise<Command> {
		this.logger.log(`stopping command: ${JSON.stringify(c)}`);

		if (c.status !== CommandStatus.Running) {
			throw new ConflictException(`cannot stop a ${c.status} command`);
		}
		c = await this.updateStatus(x, c, CommandStatus.Pending);

		this.logger.log(`successfully stopped command: ${JSON.stringify(c)}`);
		return c;
	}

	async remove(c: Command, removeWorkingCopy: boolean): Promise<void> {
		this.logger.log(`removing command: ${JSON.stringify(c)}`);

		if (c.locked) {
			throw new ConflictException(`cannot update a locked command: ${c.id}`);
		}
		if (c.status === CommandStatus.Running) {
			throw new ConflictException(`cannot remove a ${c.status} command`);
		}

		if (removeWorkingCopy) {
			await this.artifactFiles.archiveCommand(c);
		}
		await this.artifactFiles.removeCommand(c);

		await this.dao.remove(c);

		this.logger.log(`successfully removed command: ${JSON.stringify(c)}`);
	}

	private async doRun(exeCtx: CommandExecutionContext) {
		let c = exeCtx.command;

		const repo = await c.repo;
		const forkedDir = await this.artifactFiles.forkedRepoFolder(repo);

		const forked = new GithubRepo(
			(output) => this.auditLog(exeCtx, output),
			forkedDir,
			EXAMPLES_ORG,
			repo.name,
			false,
			null,
		);

		if (c.status !== CommandStatus.Running) return;
		if (c.nextRunStatus() === CommandRunStatus.SyncRepo) {
			if (!(await forked.checkRemote())) {
				throw new BadRequestException(`invalid github repository: ${forked.url()}`);
			}
			this.auditLog(exeCtx, 'remote repository validation - succeeded');

			this.auditLog(exeCtx, 'syncing with fork source repository');
			try {
				await forked.pull('forked_from');
				this.auditLog(exeCtx, 'pull the fork source repository - succeeded');
			} catch (err) {
				this.auditLog(exeCtx, `pull from forked_from failed, will try to fetch unshallow: err=${err}}`);

				await forked.fetchUnshallow();
				this.auditLog(exeCtx, `fetch unshallow - succeeded`);

				await forked.pull('forked_from');
				this.auditLog(exeCtx, 'pull the fork source repository - succeeded');
			}

			await forked.push('origin');
			this.auditLog(exeCtx, `push changes to the forked repository ${forked.url()}`);
			this.auditLog(exeCtx, 'synced with fork source repository');

			c = exeCtx.command = await this.updateRunStatus(c, CommandRunStatus.SyncRepo);
		}

		const cmdRepoFolder = await this.artifactFiles.commandRepoFolder(c);
		const cmdRepoObj = new GithubRepo(
			(output) => this.auditLog(exeCtx, output),
			cmdRepoFolder,
			forked.owner,
			forked.name(),
			forked.ssh,
			await forked.branch(),
		);

		if (c.status !== CommandStatus.Running) return;
		if (c.nextRunStatus() === CommandRunStatus.CheckedOut) {
			await copyFileOrDir(forkedDir, cmdRepoFolder);
			await cmdRepoObj.checkout(`batchai/${c.command}`, true);
			this.auditLog(exeCtx, `checked out branch: batchai/${c.command}`);

			c = exeCtx.command = await this.updateRunStatus(c, CommandRunStatus.CheckedOut);
		}

		if (c.status !== CommandStatus.Running) return;
		if (c.nextRunStatus() === CommandRunStatus.BatchAIExecuted) {
			const cmdLine = c.commandLine(cmdRepoFolder);
			this.auditLog(exeCtx, `exec begin: ${cmdLine}`);

			const code = await spawnAsync(
				cmdRepoFolder,
				'batchai',
				c.commandLineArgs(cmdRepoFolder),
				(stdout) => this.executionLog(exeCtx, stdout),
				(stderr) => this.executionLog(exeCtx, stderr),
			);
			this.auditLog(exeCtx, `exec end: exitCode=${code}, command=${cmdLine}`);

			if (code !== 0) {
				throw new Error(`batchai execution failed: command=${cmdLine}`);
			}
			this.auditLog(exeCtx, `exec succeeded: command=${cmdLine}`);
			c = exeCtx.command = await this.updateRunStatus(c, CommandRunStatus.BatchAIExecuted);
		}

		if (c.status !== CommandStatus.Running) return;
		if (c.nextRunStatus() === CommandRunStatus.ChangesAdded) {
			await cmdRepoObj.add();

			this.auditLog(exeCtx, `added changes`);
			c = exeCtx.command = await this.updateRunStatus(c, CommandRunStatus.ChangesAdded);
		}

		if (c.status !== CommandStatus.Running) return;
		if (c.nextRunStatus() === CommandRunStatus.ChangesCommited) {
			const hasChanges = await cmdRepoObj.commit(`changes by batchai "${c.command}"`);
			c.hasChanges = hasChanges;
			if (hasChanges) {
				this.auditLog(exeCtx, 'found changes');
			} else {
				this.auditLog(exeCtx, 'no changes');
			}

			c = exeCtx.command = await this.updateRunStatus(c, CommandRunStatus.ChangesCommited);
		}

		if (c.hasChanges) {
			if (c.status !== CommandStatus.Running) return;
			if (c.nextRunStatus() === CommandRunStatus.ChangesPushed) {
				await cmdRepoObj.removeRemoteBranch(); // removes existing remote branch, if possible
				await cmdRepoObj.push('origin');

				this.auditLog(exeCtx, `removed existing remote branch`);
				c = exeCtx.command = await this.updateRunStatus(c, CommandRunStatus.ChangesPushed);
			}

			if (c.status !== CommandStatus.Running) return;
			if (c.nextRunStatus() === CommandRunStatus.ChangesArchived) {
				this.artifactFiles.archiveCommand(c);
				await this.artifactFiles.archiveRepo(repo);

				this.auditLog(exeCtx, `archived current changes`);
				c = exeCtx.command = await this.updateRunStatus(c, CommandRunStatus.ChangesArchived);
			}

			if (c.status !== CommandStatus.Running) return;
			if (c.nextRunStatus() === CommandRunStatus.GetCommitId) {
				c.commitId = await cmdRepoObj.getLastCommitId();
				c.runStatus = CommandRunStatus.GetCommitId;

				this.auditLog(exeCtx, `get last commit id: ${c.commitId}`);
				c = exeCtx.command = await this.dao.save(c);
			}
		} else {
			this.artifactFiles.archiveCommand(c);
			await this.artifactFiles.archiveRepo(repo);

			this.auditLog(exeCtx, `archived without changes`);
			c = exeCtx.command = await this.updateRunStatus(c, CommandRunStatus.ChangesArchived);
		}

		// if (c.status !== CommandStatus.Running) return;
		// if (c.nextRunStatus() === CommandRunStatus.CreatedPR) {
		//   const title = `changes by batchai "${req.command}"`;
		//   await forkedRepo.createPR(title, 'This is a demo only, feel free to close it.');
		//   c = await this.updateRunStatus(c, CommandRunStatus.CreatedPR);
		// }

		c = exeCtx.command = await this.updateRunStatus(c, CommandRunStatus.End);
	}

	async resolveCommandArchive(id: number): Promise<string> {
		const c = await this.load(id);
		const p = await this.artifactFiles.commandArchive(c);
		if (!(await fileExists(p))) {
			await this.artifactFiles.archiveCommand(c);
		}
		return p;
	}

	async lock(id: number): Promise<Command> {
		this.logger.log(`locking command: ${id}`);

		let c = await this.load(id);
		if (c.locked) {
			throw new BadRequestException('already locked');
		}
		c.locked = true;

		c = await this.dao.save(c);
		this.logger.log(`successfully locked command: ${id}`);
		return c;
	}

	async unlock(id: number): Promise<Command> {
		this.logger.log(`unlocking command: ${id}`);

		let c = await this.load(id);
		if (!c.locked) {
			throw new BadRequestException('already unlocked');
		}
		c.locked = false;

		c = await this.dao.save(c);
		this.logger.log(`successfully unlocked command: ${id}`);
		return c;
	}
}
