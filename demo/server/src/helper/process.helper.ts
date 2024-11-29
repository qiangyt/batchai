import { exec, ExecOptions, spawn } from 'child_process';

export function execAsync(
	cwd: string,
	command: string,
	args: string[],
	log?: (output: string) => void,
	silent: boolean = false,
	timeout: number = 0,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const fullCommand = `${command} ${args.join(' ')}`;

	const options: ExecOptions = { cwd, env: { ...process.env } };
	if (timeout > 0) {
		options.timeout = timeout * 1000;
	}

	if (log) log(fullCommand);
	return new Promise((resolve, reject) => {
		exec(fullCommand, options, (err, stdout, stderr) => {
			if (err) {
				const result = {
					stdout: stdout || '',
					stderr: stderr || err.message,
					exitCode: err.code || 1,
				};
				if (silent) {
					resolve(result);
				} else {
					reject(result);
				}
			} else {
				resolve({
					stdout: stdout || '',
					stderr: stderr || '',
					exitCode: 0,
				});
			}
		});
	});
}

export function spawnAsync(
	cwd: string,
	command: string,
	args: string[],
	fnStdout?: (output: string) => void,
	fnStderr?: (output: string) => void,
	timeout: number = 0,
): Promise<number> {
	return new Promise((resolve, reject) => {
		if (fnStdout) fnStdout(`${command} ${args.join(' ')}`);

		const options: ExecOptions = { cwd, env: { ...process.env } };
		const child = spawn(command, args, options);

		child.stdout.on('data', (data) => {
			if (fnStdout) fnStdout(data.toString());
		});

		child.stderr.on('data', (data) => {
			if (fnStderr) fnStderr(data.toString());
		});

		child.on('close', (code) => {
			if (timeoutId) clearTimeout(timeoutId);
			resolve(code);
		});

		child.on('error', (error) => {
			if (timeoutId) clearTimeout(timeoutId);
			reject(error);
		});

		child.on('spawn', () => {
			if (fnStdout) fnStdout('child process started');
		});

		child.on('exit', (code, signal) => {
			if (signal) {
				if (fnStderr) fnStderr(`child process killed by signal: ${signal}`);
			} else {
				if (fnStdout) fnStdout(`child process exited with code: ${code}`);
			}
		});

		const timeoutId =
			timeout <= 0
				? undefined
				: setTimeout(() => {
						child.kill();
						reject(new Error(`Process timed out after ${timeout / 1000} seconds.`));
					}, timeout);
	});
}
