import { Injectable, Logger } from '@nestjs/common';
import { mkdirp } from 'mkdirp';
import path from 'path';
import { DATA_DIR } from 'src/constants';
import AdmZip from 'adm-zip';
import { copyFileOrDir, removeFileOrDir } from 'src/helper';
import { Command, Repo } from 'src/entity';

@Injectable()
export class ArtifactFiles {
	private readonly logger = new Logger(ArtifactFiles.name);

	private workPath(...elements: string[]) {
		return path.join(DATA_DIR, 'work', ...elements);
	}

	async workFolder(mk: boolean, ...elements: string[]) {
		const r = this.workPath(...elements);
		if (mk) await mkdirp(r);
		return r;
	}

	async workFile(mk: boolean, ...elements: string[]) {
		const r = this.workPath(...elements);
		if (mk) await mkdirp(path.dirname(r));
		return r;
	}

	static timestampedName(key: string) {
		const date = new Date();

		const y = date.getFullYear();
		const mon = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		const h = String(date.getHours()).padStart(2, '0');
		const min = String(date.getMinutes()).padStart(2, '0');
		const ms = String(date.getMilliseconds()).padStart(3, '0');

		return `${y}_${mon}${d}_${h}${min}_${ms}.${key}`;
	}

	private archivePath(...elements: string[]) {
		return path.join(DATA_DIR, 'archive', ...elements);
	}

	private async archiveFile(...elements: string[]) {
		const r = this.archivePath(...elements);
		await mkdirp(path.dirname(r));
		return r;
	}

	async repoFolder(repo: Repo) {
		return this.workFolder(true, repo.owner.name, repo.name);
	}

	async forkedRepoFolder(repo: Repo) {
		const owner = repo.owner;
		return this.workFolder(false, owner.name, repo.name, 'forked');
	}

	async repoArchive(repo: Repo) {
		const ownerName = repo.owner.name;
		const name = `${ownerName}.${repo.name}.zip`;
		return this.archiveFile(ownerName, name);
	}

	async repoTimestampedArchive(repo: Repo) {
		const ownerName = repo.owner.name;
		const name = `${ownerName}.${repo.name}.${ArtifactFiles.timestampedName(repo.id.toString())}.zip`;
		return this.archiveFile(ownerName, name);
	}

	async archiveRepo(repo: Repo) {
		const repoId = repo.id;

		const [repoFolder, archiveFile] = await Promise.all([this.repoFolder(repo), this.repoArchive(repo)]);
		this.logger.log(
			`archive repository folder: repoId=${repoId}, repoFolder=${repoFolder}, archiveFile=${archiveFile}`,
		);
		const zip = new AdmZip();
		await zip.addLocalFolderPromise(repoFolder, { zipPath: `${repo.owner.name}_${repo.name}` });
		await zip.writeZipPromise(archiveFile);

		const timestampedArchiveFile = await this.repoTimestampedArchive(repo);
		this.logger.log(
			`copy repository archive file: repoId=${repoId}, archiveFile=${archiveFile}, copy=${timestampedArchiveFile}`,
		);
		await copyFileOrDir(archiveFile, timestampedArchiveFile);

		this.logger.log(`finish archiving repository folder: repoId=${repoId}, repoFolder=${repoFolder}`);
	}

	async removeRepo(repo: Repo) {
		await this.archiveRepo(repo);

		const repoFolder = await this.repoFolder(repo);
		await removeFileOrDir(repoFolder);

		this.logger.log(`finish removing repository folder: repoFolder=${repoFolder}`);
	}

	async commandArchive(cmd: Command) {
		const repo = await cmd.repo;
		const ownerName = repo.owner.name;
		const repoName = repo.name;
		const name = `${ownerName}.${repoName}.${cmd.command}.zip`;

		return this.archiveFile(ownerName, repoName, name);
	}
	async commandTimestampedArchive(cmd: Command) {
		const repo = await cmd.repo;
		const ownerName = repo.owner.name;
		const repoName = repo.name;
		const name = `${ownerName}.${repoName}.${cmd.command}.${ArtifactFiles.timestampedName(cmd.id.toString())}.zip`;

		return this.archiveFile(ownerName, repoName, name);
	}

	async archiveCommand(cmd: Command) {
		const cmdId = cmd.id;
		const repo = await cmd.repo;

		const [cmdFolder, archiveFile] = await Promise.all([this.commandFolder(cmd), this.commandArchive(cmd)]);
		this.logger.log(
			`archive command folder: commandId=${cmdId}, commandFolder=${cmdFolder}, archiveFile=${archiveFile}`,
		);
		const zip = new AdmZip();
		await zip.addLocalFolderPromise(cmdFolder, { zipPath: `${repo.owner.name}_${repo.name}_${cmd.command}` });
		await zip.writeZipPromise(archiveFile);

		const timestampedArchiveFile = await this.commandTimestampedArchive(cmd);
		this.logger.log(
			`copy command archive file: commandId=${cmdId}, archiveFile=${archiveFile}, copy=${timestampedArchiveFile}`,
		);
		await copyFileOrDir(archiveFile, timestampedArchiveFile);

		this.logger.log(`finish archiving command folder: commandId=${cmdId}, commandFolder=${cmdFolder}`);
	}

	async removeCommand(cmd: Command, archive: boolean) {
		if (archive) await this.archiveCommand(cmd);

		const cmdFolder = await this.commandFolder(cmd);
		await removeFileOrDir(cmdFolder);
		this.logger.log(`finish removing command folder: commandFolder=${cmdFolder}`);
	}

	async commandFolder(cmd: Command) {
		const repo = await cmd.repo;
		const owner = repo.owner;

		return this.workFolder(false, owner.name, repo.name, cmd.command);
	}

	async commandRepoFolder(cmd: Command) {
		const repo = await cmd.repo;
		const owner = repo.owner;

		return this.workFolder(false, owner.name, repo.name, cmd.command, 'repo');
	}

	async commandRepoBatchaiFolder(cmd: Command) {
		const repo = await cmd.repo;
		const owner = repo.owner;

		return this.workFolder(false, owner.name, repo.name, cmd.command, 'repo', 'build', 'batchai');
	}

	async commandRepoGitIgnore(cmd: Command) {
		const repo = await cmd.repo;
		const owner = repo.owner;

		return this.workFile(false, owner.name, repo.name, cmd.command, 'repo', '.gitignore');
	}

	async commandRepoGitFolder(cmd: Command) {
		const repo = await cmd.repo;
		const owner = repo.owner;

		return this.workFolder(false, owner.name, repo.name, cmd.command, 'repo', '.git');
	}

	async commandExecutionLog(cmd: Command) {
		const repo = await cmd.repo;
		const owner = repo.owner;

		return this.workFile(true, owner.name, repo.name, cmd.command, 'execution.log');
	}

	async commandAuditLog(cmd: Command) {
		const repo = await cmd.repo;
		const owner = repo.owner;

		return this.workFile(true, owner.name, repo.name, cmd.command, 'audit.log');
	}
}
