import { promises as fs } from 'fs';
import * as fsExtra from 'fs-extra';
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
