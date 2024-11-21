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

export async function copyFileOrDir(srcFile: string, destFile: string) {
	await mkdirp(path.dirname(destFile));
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

export async function readTextFile(p: string): Promise<any> {
	if (!(await fileExists(p))) {
		return null;
	}

	return await fs.readFile(p, 'utf-8');
}

export async function readJsonFile(p: string): Promise<any> {
	const content = await readTextFile(p);
	if (content === null) {
		return null;
	}
	return JSON.parse(content);
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

/**
 * List all files with a specific extension in a given directory and its subdirectories.
 * @param p The target directory path.
 * @param ext The file extension to filter (e.g., `.ts`, `.js`).
 * @returns A promise that resolves to an array of file paths with the specified extension.
 */
export async function traverseFilesWithExtension(p: string, ext: string): Promise<string[]> {
	const result: string[] = [];

	/**
	 * Recursively reads the directory and adds files with the specified extension to the result array.
	 * @param currentPath The current directory being processed.
	 */
	async function readDirRecursively(currentPath: string): Promise<void> {
		// Read the contents of the current directory
		const entries = await fs.readdir(currentPath, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(currentPath, entry.name);
			if (entry.isDirectory()) {
				// If the entry is a directory, recursively process it
				await readDirRecursively(fullPath);
			} else if (entry.isFile() && fullPath.endsWith(ext)) {
				// If the entry is a file and matches the extension, add it to the result
				result.push(fullPath);
			}
		}
	}

	// Start reading from the root directory
	await readDirRecursively(p);

	return result;
}
