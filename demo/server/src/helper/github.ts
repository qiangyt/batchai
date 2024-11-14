import { execAsync, spawnAsync, dirExists, sleepSecondds } from '.';
import path from 'path';
import { mkdirp } from 'mkdirp';
import { Octokit } from '@octokit/rest';

const EXAMPLES_ORG = 'batchai-examples';

let _octokit: Octokit;

export function getOctokit() {
	if (!_octokit) {
		_octokit = new Octokit({
			auth: process.env.GITHUB_TOKEN,
		});
	}
	return _octokit;
}

export async function remoteRepoExists(owner: string, repo: string): Promise<boolean> {
	try {
		await getOctokit().repos.get({ owner, repo });
		return true;
	} catch (error: any) {
		if (error.status === 404) {
			return false;
		}
		throw error;
	}
}

export class GithubRepo {
	private _url: string;
	readonly ownerDir: string;
	private _repoDir: string;
	private _branch: string;

	constructor(
		private log: (output: string) => void,
		private readonly baseDir: string,
		private readonly owner: string,
		private name: string,
		private readonly ssh: boolean,
		private readonly forkedFrom?: GithubRepo,
	) {
		this._url = this.ssh ? `git@github.com:${owner}/${name}.git` : `https://github.com/${owner}/${name}`;
		this.ownerDir = path.join(baseDir, owner);
		this._repoDir = path.join(this.ownerDir, name);
	}

	url(): string {
		return this._url;
	}

	branch(): string {
		return this._branch;
	}

	repoDir(): string {
		return this._repoDir;
	}

	async checkRemote(): Promise<boolean> {
		try {
			const r = await getOctokit().repos.get({ owner: this.owner, repo: this.name });
			this._branch = r.data.default_branch;
			return true;
		} catch (error: any) {
			if (error.status === 404) {
				return false;
			}
			throw error;
		}
	}

	async clone(depth: number = 1): Promise<void> {
		this.log(`cloning ${this._url}...`);

		await mkdirp(this.ownerDir);

		const args = ['clone', '--depth', `${depth}`, this._url];
		const code = await spawnAsync(this.ownerDir, 'git', args, this.log, this.log);
		if (code !== 0) {
			throw new Error(`git clone failed: exitCode=${code}, command line="${['git', ...args].join(' ')}"`);
		}

		this.log(`cloned ${this._url}...`);
	}

	async pull(): Promise<void> {
		this.log(`pulling in ${this._repoDir}...`);

		const code = await spawnAsync(this._repoDir, 'git', ['pull'], this.log, this.log);
		if (code !== 0) {
			throw new Error(`git pull failed: exitCode=${code}, command line="git pull"}`);
		}

		this.log(`successfully pulled ${this._repoDir}...`);
	}

	async add(): Promise<void> {
		this.log(`adding files in ${this._repoDir}...`);

		const code = await spawnAsync(this._repoDir, 'git', ['add', '.'], this.log, this.log);
		if (code !== 0) {
			throw new Error(`git add failed: exitCode=${code}, command line="git add ."`);
		}

		this.log(`successfully added files in ${this._repoDir}...`);
	}

	async removeRemoteBranch(): Promise<void> {
		this.log(`removing remote branch in ${this._repoDir}...`);
		try {
			await getOctokit().rest.repos.getBranch({
				owner: this.owner,
				repo: this.name,
				branch: this._branch,
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
		//   ref: `heads/${this.branch}`,
		// });

		const code = await spawnAsync(
			this._repoDir,
			'git',
			['push', 'origin', '--delete', this._branch],
			this.log,
			this.log,
		);
		if (code !== 0) {
			throw new Error(`git push failed: exitCode=${code}, command line="git push origin --delete ${this._branch}"`);
		}

		this.log(`successfully removed remote branch in ${this._repoDir}...`);
	}

	async push(): Promise<void> {
		this.log(`pushing files in ${this._repoDir}...`);
		const code = await spawnAsync(
			this._repoDir,
			'git',
			['push', '--set-upstream', 'origin', this._branch],
			this.log,
			this.log,
		);
		if (code !== 0) {
			throw new Error(
				`git push failed: exitCode=${code}, command line="git push --set-upstream origin ${this._branch}"`,
			);
		}
		this.log(`successfully pushed files in ${this._repoDir}...`);
	}

	async commit(commitMsg: string): Promise<boolean> {
		this.log(`commiting files in ${this._repoDir}...`);

		let nothingToCommit = false;
		const args = ['commit', '-m', commitMsg];
		const code = await spawnAsync(
			this._repoDir,
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
		this.log(`successfully committed files in ${this._repoDir}...`);
		return !nothingToCommit;
	}

	async cloneOrPull(): Promise<void> {
		if (await dirExists(this._repoDir)) {
			await this.pull();
		} else {
			await this.clone();
		}
	}

	async rename(newName: string): Promise<void> {
		this.log(`renaming ${this.owner}/${this.name} to ${this.owner}/${newName}...`);

		await getOctokit().repos.update({ owner: this.owner, repo: this.name, name: newName });

		this.name = newName;
		this._url = this.ssh
			? `gi;t@github.com:${this.owner}/${newName}.git`
			: `https://github.com/${this.owner}/${newName}`;
		this._repoDir = path.join(this.ownerDir, newName);

		this.log(`successfully renamed ${this.owner}/${newName} to ${this.owner}/${newName}`);
	}

	async checkout(newBranch: string, cleanAnyway: boolean): Promise<void> {
		if (cleanAnyway) {
			this.log(`clean up in ${this._repoDir}...`);
			const code = await spawnAsync(this._repoDir, 'git', ['clean', '-fd'], this.log, this.log);
			if (code !== 0) {
				throw new Error(`git clean failed: exitCode=${code}, command line="git clean -fd"`);
			}
			this.log(`successfully clean up in ${this._repoDir}...`);
		}

		this.log(`checking out in ${this._repoDir}...`);

		try {
			let args = ['rev-parse', '--verify', newBranch];
			let code = await spawnAsync(this._repoDir, 'git', args, this.log, this.log);
			if (code !== 0) {
				throw new Error(`git rev-parse failed: exitCode=${code}, command line="${['git', ...args].join(' ')}"`);
			}

			this.log(`branch '${newBranch}' exists. Checking out...`);

			args = ['checkout', newBranch];
			code = await spawnAsync(this._repoDir, 'git', args, this.log, this.log);
			if (code !== 0) {
				throw new Error(`git checkout failed: exitCode=${code}, command line="${['git', ...args].join(' ')}"`);
			}

			this._branch = newBranch;
			this.log(`successfully checked out to branch '${newBranch}'.`);
		} catch (err) {
			this.log(`branch '${newBranch}' does not exist (err=${err}). Creating and checking out...`);
			const args = ['checkout', '-b', newBranch];
			const code = await spawnAsync(this._repoDir, 'git', args, this.log, this.log);
			if (code !== 0) {
				throw new Error(`git checkout failed: exitCode=${code}, command line="${['git', ...args].join(' ')}"`);
			}

			this._branch = newBranch;
			this.log(`successfully created and checked out to new branch '${newBranch}'.`);
		}
	}

	forkedRepo(ssh: boolean = true, targetOwner: string = EXAMPLES_ORG): GithubRepo {
		return new GithubRepo(this.log, this.baseDir, targetOwner, this.name, ssh, this);
	}

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
			repo: this.name,
			per_page: 100,
		});

		return forks.data.some((fork) => fork.owner.login === user);
	}

	async fork(ssh: boolean = true, targetOwner: string = EXAMPLES_ORG): Promise<GithubRepo> {
		const result = this.forkedRepo(ssh, targetOwner);
		if (await result.checkRemote()) {
			this.log(`already forked`);
			return result;
		}

		this.log(`Forking ${this.owner}/${this.name}...`);

		await getOctokit().repos.createFork({ owner: this.owner, repo: this.name, organization: targetOwner });
		this.log(`successfully created fork: ${this.owner}/${this.name} to ${targetOwner}`);

		for (let i = 0; i < 10; i++) {
			if (await result.checkRemote()) {
				break;
			}
			await sleepSecondds(5);
		}
		this.log(`found forked repo: ${this.owner}/${this.name} to ${targetOwner}`);

		return result;
	}

	async createPR(title: string, desc: string): Promise<string> {
		if (!this.forkedFrom) {
			throw new Error(`${this.owner}/${this.name} is not a forked repository`);
		}
		this.log('creating a PR...');

		const pr = await getOctokit().pulls.create({
			owner: this.owner,
			repo: this.name,
			title,
			head: `${this._branch}`, //head: `${this.owner}:${this.branch}`,
			base: this.forkedFrom._branch,
			body: desc,
		});

		const prUrl = pr.data.html_url;
		this.log(`successed created a PR: ${prUrl}`);
		return prUrl;
	}

	async getLastCommitId(): Promise<string> {
		this.log(`getting last commit id in ${this._repoDir}...`);

		const args = ['log', '-1', '--format=%H'];
		const { stdout, stderr, exitCode } = await execAsync(this._repoDir, 'git', args, this.log);
		if (exitCode !== 0) {
			throw new Error(
				`git log -1 --format=%H: exitCode=${exitCode}, stdout=${stdout}, stderr=${stderr}, command line="${['git', ...args].join(' ')}"`,
			);
		}

		this.log(`successfully got last commit id in ${this._repoDir}...`);
		return stdout.trim();
	}
}
