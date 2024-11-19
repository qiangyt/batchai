import { execAsync, spawnAsync, sleepSecondds } from '.';
import path from 'path';
import { Octokit } from '@octokit/rest';

let _octokit: Octokit;

export function getOctokit() {
	if (!_octokit) {
		_octokit = new Octokit({
			auth: process.env.GITHUB_TOKEN,
		});
	}
	return _octokit;
}

export class GithubRepo {
	private _url: string;
	private _defaultBranch: string;

	constructor(
		readonly log: (output: string) => void,
		readonly repoDir: string,
		readonly owner: string,
		private _name: string,
		readonly ssh: boolean,
		private _branch: string,
	) {
		this._url = this.ssh ? `git@github.com:${owner}/${name}.git` : `https://github.com/${owner}/${_name}`;
	}

	url(): string {
		return this._url;
	}

	name(): string {
		return this._name;
	}

	branch(): string {
		return this._branch;
	}

	defaultBranch(): string {
		return this._defaultBranch;
	}

	async checkRemote(): Promise<boolean> {
		try {
			const r = await getOctokit().repos.get({ owner: this.owner, repo: this.name() });
			this._defaultBranch = r.data.default_branch;
			return true;
		} catch (error: any) {
			if (error.status === 404) {
				return false;
			}
			throw error;
		}
	}

	async clone(depth: number = 1): Promise<void> {
		this.log(`cloning ${this.url()} to ${this.repoDir}`);

		const baseDir = path.dirname(this.repoDir);
		const repoDirName = path.basename(this.repoDir);

		const args = ['clone', '--depth', `${depth}`, this.url(), repoDirName];
		const code = await spawnAsync(baseDir, 'git', args, this.log, this.log);
		if (code !== 0) {
			throw new Error(`git clone failed: exitCode=${code}, command line="${['git', ...args].join(' ')}"`);
		}

		this.log(`cloned ${this.url()} to ${this.repoDir}`);
	}

	async pull(remoteName: string): Promise<void> {
		this.log(`pulling ${remoteName} for ${this.url()} in ${this.repoDir}...`);

		const code = await spawnAsync(this.repoDir, 'git', ['pull', remoteName], this.log, this.log);
		if (code !== 0) {
			throw new Error(`git pull failed: exitCode=${code}, command line="git pull ${remoteName}"}`);
		}

		this.log(`successfully pulled ${remoteName} for ${this.url()} in ${this.repoDir}`);
	}

	async add(): Promise<void> {
		this.log(`adding files for ${this.url()} in ${this.repoDir}`);

		const code = await spawnAsync(this.repoDir, 'git', ['add', '.'], this.log, this.log);
		if (code !== 0) {
			throw new Error(`git add failed: exitCode=${code}, command line="git add ."`);
		}

		this.log(`successfully added files for ${this.url()} in ${this.repoDir}`);
	}

	async removeRemoteBranch(): Promise<void> {
		this.log(`removing remote branch for ${this.url()} in ${this.repoDir}`);
		try {
			await getOctokit().rest.repos.getBranch({
				owner: this.owner,
				repo: this.name(),
				branch: this.branch(),
			});
		} catch (err) {
			if (err.status === 404) {
				// remote branch not exists
				this.log(`no remote branch`);
				return;
			}
			throw err;
		}

		// await octokit.rest.git.deleteRef({
		//   owner: this.owner,
		//   repo: this.name,
		//   ref: `heads/${this.branch()}`,
		// });

		const code = await spawnAsync(
			this.repoDir,
			'git',
			['push', 'origin', '--delete', this.branch()],
			this.log,
			this.log,
		);
		if (code !== 0) {
			throw new Error(`git push failed: exitCode=${code}, command line="git push origin --delete ${this.branch()}"`);
		}

		this.log(`successfully removed remote branch for ${this.url()} in ${this.repoDir}`);
	}

	async push(remoteName: string): Promise<void> {
		this.log(`pushing files to ${remoteName} for ${this.url()} in ${this.repoDir}`);
		const code = await spawnAsync(
			this.repoDir,
			'git',
			['push', '--set-upstream', remoteName, this.branch()],
			this.log,
			this.log,
		);
		if (code !== 0) {
			throw new Error(
				`git push failed: exitCode=${code}, command line="git push --set-upstream ${remoteName} ${this.branch()}"`,
			);
		}
		this.log(`successfully pushed files to ${remoteName} for ${this.url()} in ${this.repoDir}`);
	}

	async commit(commitMsg: string): Promise<boolean> {
		this.log(`commiting files for ${this.url()} in ${this.repoDir}`);

		let nothingToCommit = false;
		const args = ['commit', '-m', commitMsg];
		const code = await spawnAsync(
			this.repoDir,
			'git',
			args,
			(output) => {
				if (output.indexOf('nothing to commit') >= 0) {
					nothingToCommit = true;
				}
				this.log(output);
			},
			this.log,
		);

		if (code !== 0) {
			if (!nothingToCommit) {
				throw new Error(`git commit failed: exitCode=${code}, command line="git ${args.join(' ')}"`);
			}
		}
		this.log(`successfully committed files for ${this.url()} in ${this.repoDir}`);
		return !nothingToCommit;
	}

	async rename(newName: string): Promise<void> {
		this.log(`renaming ${this.owner}/${this.name} to ${this.owner}/${newName}...`);

		await getOctokit().repos.update({ owner: this.owner, repo: this.name(), name: newName });

		this._name = newName;
		this._url = this.ssh
			? `git@github.com:${this.owner}/${newName}.git`
			: `https://github.com/${this.owner}/${newName}`;

		this.log(`successfully renamed ${this.owner}/${newName} to ${this.owner}/${newName}`);
	}

	async checkout(newBranch: string, cleanAnyway: boolean): Promise<void> {
		if (cleanAnyway) {
			this.log(`clean up in ${this.repoDir}...`);
			const code = await spawnAsync(this.repoDir, 'git', ['clean', '-fd'], this.log, this.log);
			if (code !== 0) {
				throw new Error(`git clean failed: exitCode=${code}, command line="git clean -fd"`);
			}
			this.log(`successfully clean up in ${this.repoDir}...`);
		}

		this.log(`checking out in ${this.repoDir}...`);

		try {
			let args = ['rev-parse', '--verify', newBranch];
			let code = await spawnAsync(this.repoDir, 'git', args, this.log, this.log);
			if (code !== 0) {
				throw new Error(`git rev-parse failed: exitCode=${code}, command line="${['git', ...args].join(' ')}"`);
			}

			this.log(`branch '${newBranch}' exists. Checking out...`);

			args = ['checkout', newBranch];
			code = await spawnAsync(this.repoDir, 'git', args, this.log, this.log);
			if (code !== 0) {
				throw new Error(`git checkout failed: exitCode=${code}, command line="${['git', ...args].join(' ')}"`);
			}

			this._branch = newBranch;
			this.log(`successfully checked out to branch '${newBranch}'.`);
		} catch (err) {
			this.log(`branch '${newBranch}' does not exist (err=${err}). Creating and checking out...`);
			const args = ['checkout', '-b', newBranch];
			const code = await spawnAsync(this.repoDir, 'git', args, this.log, this.log);
			if (code !== 0) {
				throw new Error(`git checkout failed: exitCode=${code}, command line="${['git', ...args].join(' ')}"`);
			}

			this._branch = newBranch;
			this.log(`successfully created and checked out to new branch '${newBranch}'.`);
		}
	}

	//forkedRepo(ssh: boolean = true, targetOwner: string = EXAMPLES_ORG): GithubRepo {
	//	return new GithubRepo(this.log, this.baseDir, targetOwner, this.name, ssh, this);
	//}

	// async isStarredBy(user: string): Promise<boolean> {
	//   const stargazers = await getOctokit().request('GET /repos/{owner}/{repo}/stargazers', {
	//     owner: this.owner,
	//     repo: this.name,
	//     headers: {
	//       'X-GitHub-Api-Version': '2022-11-28',
	//     },
	//   });
	//   return stargazers.data.some((stargazer) => stargazer.login === user);
	// }

	async isForkedBy(user: string): Promise<boolean> {
		const forks = await getOctokit().repos.listForks({
			owner: this.owner,
			repo: this.name(),
			per_page: 100,
		});

		return forks.data.some((fork) => fork.owner.login === user);
	}

	forkedRepo(ssh: boolean, forkOwner: string, forkName?: string): GithubRepo {
		if (!forkName) forkName = this.name();
		return new GithubRepo(this.log, this.repoDir, forkOwner, forkName, ssh, this.defaultBranch());
	}

	async fork(ssh: boolean, forkOwner: string): Promise<GithubRepo> {
		const r = this.forkedRepo(ssh, forkOwner, this.name());
		if (await r.checkRemote()) {
			this.log(`already forked`);
			return;
		}

		this.log(`Forking ${this.url()}...`);

		await getOctokit().repos.createFork({ owner: this.owner, repo: this.name(), organization: forkOwner });
		this.log(`successfully created fork: ${this.url()} to ${r.url()}`);

		for (let i = 0; i < 10; i++) {
			if (await r.checkRemote()) {
				break;
			}
			await sleepSecondds(5);
		}
		this.log(`found forked repo: ${this.url()}to ${r.url()}`);
	}

	async addRemoteUrl(remoteName: string, remoteUrl: string) {
		this.log(`adding remote url ${remoteUrl} as ${remoteName}`);

		const args = ['remote', 'add', remoteName, remoteUrl];
		const code = await spawnAsync(this.repoDir, 'git', args, this.log, this.log);
		if (code !== 0) {
			throw new Error(`git remote add failed: exitCode=${code}, command line="${['git', ...args].join(' ')}"`);
		}

		this.log(`successfully added remote url ${remoteUrl} as ${remoteName}`);
	}

	// async createPR(title: string, desc: string): Promise<string> {
	// 	if (!this.forkedFrom) {
	// 		throw new Error(`${this.owner}/${this.name} is not a forked repository`);
	// 	}
	// 	this.log('creating a PR...');

	// 	const pr = await getOctokit().pulls.create({
	// 		owner: this.owner,
	// 		repo: this.name,
	// 		title,
	// 		head: `${this._branch}`, //head: `${this.owner}:${this.branch}`,
	// 		base: this.forkedFrom._branch,
	// 		body: desc,
	// 	});

	// 	const prUrl = pr.data.html_url;
	// 	this.log(`successed created a PR: ${prUrl}`);
	// 	return prUrl;
	// }

	async getLastCommitId(): Promise<string> {
		this.log(`getting last commit id in ${this.repoDir}...`);

		const args = ['log', '-1', '--format=%H'];
		const { stdout, stderr, exitCode } = await execAsync(this.repoDir, 'git', args, this.log);
		if (exitCode !== 0) {
			throw new Error(
				`git log -1 --format=%H: exitCode=${exitCode}, stdout=${stdout}, stderr=${stderr}, command line="${['git', ...args].join(' ')}"`,
			);
		}

		this.log(`successfully got last commit id in ${this.repoDir}...`);
		return stdout.trim();
	}
}
