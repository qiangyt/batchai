import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CommandStatus, CommandRunStatus } from '../constants';
import { promises as fs } from 'fs';
import { SchedulerRegistry } from '@nestjs/schedule';
import PQueue from 'p-queue';
import { spawnAsync, GithubRepo, fileExists, renameFileOrDir } from '../helper';
import { Repo, Command } from '../entity';
import { CommandCreateReq, CommandLog, CommandUpdateReq } from '../dto';
import { Kontext } from '../framework';
import AdmZip from 'adm-zip';

@Injectable()
export class CommandService {
	private readonly logger = new Logger(CommandService.name);

	private readonly queue = new PQueue({ concurrency: 1 });

	constructor(
		private scheduler: SchedulerRegistry,
		@InjectRepository(Command) private dao: Repository<Command>,
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
		this.logger.warn(`adding command to queue: ${JSON.stringify(c)}`);

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

		this.logger.warn(`successfully added command to queue: ${c.id}`);
		return c;
	}

	async update(x: Kontext, id: number, params: CommandUpdateReq): Promise<Command> {
		this.logger.warn(`updating command: id=${id}`);

		params.normalize();

		let c = await this.load(id);
		if (c.status === CommandStatus.Running) {
			throw new ConflictException(`cannot update a running command: ${JSON.stringify(c)}`);
		}

		const u = x.user;

		if (c.enableSymbolReference !== params.enableSymbolReference) {
			u.ensureHasAdminRole();
			c.enableSymbolReference = params.enableSymbolReference;
		}

		c.force = params.force;

		if (c.num !== params.num) {
			u.ensureHasAdminRole();
			c.num = params.num;
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
		this.logger.warn(`Successfully updated command: ${c}`);

		if (params.executeItRightNow) {
			if (c.status !== CommandStatus.Running && c.status !== CommandStatus.Queued) {
				c = await this.enqueue(x, c);
			}
		}

		return c;
	}

	async create(x: Kontext, params: CommandCreateReq, repo: Repo): Promise<Command> {
		this.logger.warn(`creating command: paramss=${params}, repo=${repo}`);

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

		if (params.num !== null && params.num !== undefined) {
			c.num = params.num;
		} else {
			c.num = 0;
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
		this.logger.warn(`successfully created command: paramss=${c}`);

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

	async loadLog(id: number): Promise<CommandLog[]> {
		const c = await this.load(id);
		if (!c) {
			throw new NotFoundException(`id=${id}`);
		}

		const logFile = await c.logFile();
		if (!(await fileExists(logFile))) {
			return [];
		}

		const content = await fs.readFile(logFile, 'utf-8');
		return content
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.map((line) => JSON.parse(line));
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

		let logFile;

		try {
			logFile = await c.logFile();
			await this.doRun(c, logFile);

			c = await this.updateStatus(x, c, CommandStatus.Succeeded);
			this.logger.log(`run command: succeeded: ${JSON.stringify(c)}`);
		} catch (err) {
			if (logFile) {
				try {
					await this.log(logFile, err.toString());
				} catch (err) {
					this.logger.error(`run command: failed to log: err=${err}, ${JSON.stringify(c)}`);
				}
			}

			c = await this.updateStatus(x, c, CommandStatus.Failed);

			this.logger.log(`run command: failed: err=${err}, ${JSON.stringify(c)}`);
		}
	}

	private async updateStatus(x: Kontext, c: Command, status: CommandStatus): Promise<Command> {
		c.status = status;
		c.updater = x?.user;
		return this.dao.save(c);
	}

	private async updateRunStatus(c: Command, runStatus: CommandRunStatus): Promise<Command> {
		c.runStatus = runStatus;
		return this.dao.save(c);
	}

	async restart(x: Kontext, c: Command): Promise<Command> {
		this.logger.warn(`restarting command: ${c}`);

		if (c.status === CommandStatus.Running) {
			throw new ConflictException(`cannot restart a running command: ${JSON.stringify(c)}`);
		}

		c.hasChanges = false;
		c.status = CommandStatus.Pending;
		c.runStatus = CommandRunStatus.Begin;
		c.updater = x?.user;
		await this.dao.save(c);

		c = await this.enqueue(x, c);
		this.logger.warn(`successfully restarted command: ${c}`);
		return c;
	}

	async resume(x: Kontext, c: Command): Promise<Command> {
		this.logger.warn(`resuming command: ${c}`);

		if (c.status !== CommandStatus.Pending && c.status !== CommandStatus.Failed) {
			throw new ConflictException(`cannot resume a ${c.status} command`);
		}
		c = await this.enqueue(x, c);
		this.logger.warn(`successfully resumed command: ${c}`);
		return c;
	}

	async stop(x: Kontext, c: Command): Promise<Command> {
		this.logger.warn(`stopping command: ${c}`);

		if (c.status !== CommandStatus.Running) {
			throw new ConflictException(`cannot stop a ${c.status} command`);
		}
		c = await this.updateStatus(x, c, CommandStatus.Pending);

		this.logger.warn(`successfully stopped command: ${c}`);
		return c;
	}

	async remove(c: Command): Promise<void> {
		this.logger.warn(`removing command: ${c}`);

		if (c.status === CommandStatus.Running) {
			throw new ConflictException(`cannot remove a ${c.status} command`);
		}

		await this.archiveArtifacts(c);
		await this.dao.remove(c);

		this.logger.warn(`successfully removed command: ${c}`);
	}

	async archiveArtifacts(c: Command): Promise<void> {
		this.logger.warn(`archiving command: ${c}`);

		const date = new Date();

		const y = date.getFullYear();
		const mon = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		const h = String(date.getHours()).padStart(2, '0');
		const min = String(date.getMinutes()).padStart(2, '0');
		const ms = String(date.getMilliseconds()).padStart(3, '0');

		const ts = `${y}_${mon}${d}_${h}${min}_${ms}`;

		const [logFile, logArchiveFile] = await Promise.all([c.logFile(), c.logArchiveFile(ts)]);

		await renameFileOrDir(logFile, logArchiveFile);

		this.logger.warn(`successfully archived command: ${c}`);
	}

	private async log(logFile: string, message: string): Promise<void> {
		const jsonLine = JSON.stringify(new CommandLog(new Date().toISOString(), message));
		return fs.appendFile(logFile, jsonLine + `\n`, { encoding: 'utf8' });
	}

	private async newRepoObject(c: Command): Promise<GithubRepo> {
		const logFile = await c.logFile();
		const repo = await c.repo;

		return new GithubRepo(
			(output) => this.log(logFile, output),
			`/data/batchai-examples/repo`,
			repo.owner.name,
			repo.name,
			false,
		);
	}

	private async doRun(c: Command, logFile: string) {
		const repo = await c.repo;
		const repoObj = await this.newRepoObject(c);

		const fork = repoObj.forkedRepo();
		const workDir = fork.repoDir();

		if (c.status !== CommandStatus.Running) return;
		if (c.nextRunStatus() === CommandRunStatus.CheckedOut) {
			await fork.checkout(`batchai/${c.command}`, true);
			c = await this.updateRunStatus(c, CommandRunStatus.CheckedOut);
		}

		if (c.status !== CommandStatus.Running) return;
		if (c.nextRunStatus() === CommandRunStatus.BatchAIExecuted) {
			const cmdLine = c.commandLine(workDir);
			this.logger.log(`exec begin: ${cmdLine}`);

			const code = await spawnAsync(
				workDir,
				'batchai',
				c.commandLineArgs(workDir),
				(stdout) => this.log(logFile, stdout),
				(stderr) => this.log(logFile, stderr),
			);
			this.logger.log(`exec end: exitCode=${code}, command=${cmdLine}`);

			if (code !== 0) {
				throw new Error(`batchai execution failed: command=${cmdLine}`);
			}
			this.logger.log(`exec succeeded: command=${cmdLine}`);
			c = await this.updateRunStatus(c, CommandRunStatus.BatchAIExecuted);
		}

		if (c.status !== CommandStatus.Running) return;
		if (c.nextRunStatus() === CommandRunStatus.ChangesAdded) {
			await fork.add();
			c = await this.updateRunStatus(c, CommandRunStatus.ChangesAdded);
		}

		if (c.status !== CommandStatus.Running) return;
		if (c.nextRunStatus() === CommandRunStatus.ChangesCommited) {
			const hasChanges = await fork.commit(`changes by batchai "${c.command}"`);
			c.hasChanges = hasChanges;
			c = await this.updateRunStatus(c, CommandRunStatus.ChangesCommited);
		}

		if (c.hasChanges) {
			this.logger.log(`run: no changs found: command=${c.id}`);
			if (c.status !== CommandStatus.Running) return;
			if (c.nextRunStatus() === CommandRunStatus.ChangesPushed) {
				await fork.removeRemoteBranch(); // removes existing remote branch, if possible
				await fork.push();
				c = await this.updateRunStatus(c, CommandRunStatus.ChangesPushed);
			}

			if (c.status !== CommandStatus.Running) return;
			if (c.nextRunStatus() === CommandRunStatus.ChangesArchived) {
				this.logger.log(`run: zipping the folder: command=${c.id}`);
				const zip = new AdmZip();
				zip.addLocalFolder(workDir);
				zip.writeZip(repo.artifactArchiveFile());
				this.logger.log(`run: zipped the folder: command=${c.id}`);

				c = await this.updateRunStatus(c, CommandRunStatus.ChangesArchived);
			}

			if (c.status !== CommandStatus.Running) return;
			if (c.nextRunStatus() === CommandRunStatus.GetCommitId) {
				c.commitId = await fork.getLastCommitId();
				c.runStatus = CommandRunStatus.GetCommitId;
				c = await this.dao.save(c);
			}
		} else {
			this.logger.log(`run: found changs: command=${c.id}`);
			const zip = new AdmZip();
			zip.addLocalFolder(workDir);
			zip.writeZip(repo.artifactArchiveFile());
			this.logger.log(`run: zipped the folder: command=${c.id}`);

			c = await this.updateRunStatus(c, CommandRunStatus.ChangesArchived);
		}

		// if (c.status !== CommandStatus.Running) return;
		// if (c.nextRunStatus() === CommandRunStatus.CreatedPR) {
		//   const title = `changes by batchai "${req.command}"`;
		//   await forkedRepo.createPR(title, 'This is a demo only, feel free to close it.');
		//   c = await this.updateRunStatus(c, CommandRunStatus.CreatedPR);
		// }

		c = await this.updateRunStatus(c, CommandRunStatus.End);
	}
}
