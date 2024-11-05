import { promises as fs } from 'fs';
import * as fsExtra from 'fs-extra';

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
