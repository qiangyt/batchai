import { promises as fs } from 'fs';
import * as fsExtra from 'fs-extra';
import { mkdirp } from 'mkdirp';
import * as path from 'path';

export async function removeFileOrDir(p: string): Promise<void> {
	return new Promise((resolve, reject) => {
		fsExtra.remove(p, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
}

export async function copyFile(srcFile: string, destFile: string) {
	await mkdirp(path.basename(destFile));
	return fsExtra.copy(srcFile, destFile);
}

export async function renameFileOrDir(oldPath: string, newPath: string): Promise<void> {
	try {
		await fs.stat(oldPath);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return;
		}
		throw error;
	}

	return fs.rename(oldPath, newPath);
}

export async function dirExists(p: string): Promise<boolean> {
	try {
		return (await fs.stat(p)).isDirectory();
	} catch (error) {
		if (error.code === 'ENOENT') {
			return false;
		}
		throw error;
	}
}

export async function fileExists(p: string): Promise<boolean> {
	try {
		return (await fs.stat(p)).isFile();
	} catch (error) {
		if (error.code === 'ENOENT') {
			return false;
		}
		throw error;
	}
}

export async function listPathsWithPrefix(rootDir: string, prefix: string): Promise<string[]> {
	if (prefix.startsWith('/')) prefix = prefix.slice(1);
	if (prefix.endsWith('/')) prefix = prefix.slice(0, prefix.length - 1);

	const r: string[] = [];

	for (const f of await fs.readdir(path.join(rootDir, prefix))) {
		if (f === '.git') continue;

		const fullP = path.join(rootDir, f);
		const relP = path.relative(rootDir, fullP);

		r.push(relP);
	}

	return r;
}

export async function readJsonLogFile(logFile: string): Promise<any[]> {
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
