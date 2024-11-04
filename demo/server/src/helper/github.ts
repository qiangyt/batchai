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
  private url: string;
  readonly ownerDir: string;
  private _repoDir: string;
  private branch: string;

  constructor(
    private log: (output: string) => void,
    private readonly baseDir: string,
    private readonly owner: string,
    private name: string,
    private readonly ssh: boolean,
    private readonly forkedFrom?: GithubRepo,
  ) {
    this.url = this.ssh ? `git@github.com:${owner}/${name}.git` : `https://github.com/${owner}/${name}`;
    this.ownerDir = path.join(baseDir, owner);
    this._repoDir = path.join(this.ownerDir, name);
  }

  repoDir(): string {
    return this._repoDir;
  }

  async checkRemote(): Promise<boolean> {
    try {
      const r = await getOctokit().repos.get({ owner: this.owner, repo: this.name });
      this.branch = r.data.default_branch;
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  async clone(depth:number=1): Promise<void> {
    this.log(`Cloning ${this.url}...`);

    await mkdirp(this.ownerDir);

    const args = ['clone', '--depth', `${depth}`, this.url];
    const code = await spawnAsync(this.ownerDir, 'git', args, this.log, this.log);
    const msg = `exitCode=${code}, command line="${['git', ...args].join(' ')}"`;
    this.log(`git clone end: ${msg}`);
    if (code !== 0) {
      throw new Error(`git clone failed: ${msg}`);
    }
  }

  async pull(): Promise<void> {
    this.log(`Pulling in ${this._repoDir}...`);

    const code = await spawnAsync(this._repoDir, 'git', ['pull'], this.log, this.log);
    const msg = `exitCode=${code}, command line="git pull"}`;
    this.log(`git pull end: ${msg}`);
    if (code !== 0) {
      throw new Error(`git pull failed: ${msg}`);
    }
  }

  async add(): Promise<void> {
    this.log(`Adding files in ${this._repoDir}...`);

    const code = await spawnAsync(this._repoDir, 'git', ['add', '.'], this.log, this.log);
    const msg = `exitCode=${code}, command line="git add ."}`;
    this.log(`git add end: ${msg}`);
    if (code !== 0) {
      throw new Error(`git add failed: ${msg}`);
    }
  }

  async removeRemoteBranch(): Promise<void> {
    this.log(`Removing remote branch in ${this._repoDir}...`);
    try {
      await getOctokit().rest.repos.getBranch({
        owner: this.owner,
        repo: this.name,
        branch: this.branch,
      });
    } catch (err) {
      if (err.status === 404) {
        // remote branch not exists
        this.log(`No remote branch`);
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
      ['push', 'origin', '--delete', this.branch],
      this.log,
      this.log,
    );
    const msg = `exitCode=${code}, command line="git push origin --delete ${this.branch}"}`;
    this.log(`git push end: ${msg}`);
    if (code !== 0) {
      throw new Error(`git push failed: ${msg}`);
    }

    this.log(`Removed remote branch in ${this._repoDir}...`);
  }

  async push(): Promise<void> {
    this.log(`Pushing files in ${this._repoDir}...`);
    const code = await spawnAsync(
      this._repoDir,
      'git',
      ['push', '--set-upstream', 'origin', this.branch],
      this.log,
      this.log,
    );
    const msg = `exitCode=${code}, command line="git push --set-upstream origin ${this.branch}"`;
    this.log(`git push end: ${msg}`);
    if (code !== 0) {
      throw new Error(`git push failed: ${msg}`);
    }
  }

  async commit(commitMsg: string): Promise<boolean> {
    this.log(`Commiting files in ${this._repoDir}...`);

    let nothingToCommit = false;
    const args = ['commit', '-m', commitMsg];
    const code = await spawnAsync(this._repoDir, 'git', args, 
      (output) => {
      if (output.indexOf('nothing to commit') >= 0) {
        nothingToCommit = true;
      }
      this.log(output);
    }, this.log);

    const msg = `exitCode=${code}, command line="git ${args.join(' ')}"`;
    this.log(`git commit end: ${msg}`);
    if (code !== 0) {
      if (!nothingToCommit) {
        throw new Error(`git commit failed: ${msg}`);
      }
    }

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
    this.log(`Renaming ${this.owner}/${this.name} to ${this.owner}/${newName}...`);

    await getOctokit().repos.update({ owner: this.owner, repo: this.name, name: newName });

    this.name = newName;
    this.url = this.ssh
      ? `gi;t@github.com:${this.owner}/${newName}.git`
      : `https://github.com/${this.owner}/${newName}`;
    this._repoDir = path.join(this.ownerDir, newName);

    this.log(`Successfully renamed ${this.owner}/${newName} to ${this.owner}/${newName}`);
  }

  async checkout(newBranch: string): Promise<void> {
    this.log(`Check out in ${this._repoDir}...`);

    try {
      let args = ['rev-parse', '--verify', newBranch];
      let code = await spawnAsync(this._repoDir, 'git', args);
      let msg = `exitCode=${code}, command line="${['git', ...args].join(' ')}"`;
      this.log(`git rev-parse end: ${msg}`);
      if (code !== 0) {
        throw new Error(`git rev-parse failed: ${msg}`);
      }

      this.log(`Branch '${newBranch}' exists. Checking out...`);

      args = ['checkout', newBranch];
      code = await spawnAsync(this._repoDir, 'git', args, this.log, this.log);
      msg = `exitCode=${code}, command line="${['git', ...args].join(' ')}"`;
      this.log(`git checkout end: ${msg}`);
      if (code !== 0) {
        throw new Error(`git checkout failed: ${msg}`);
      }

      this.branch = newBranch;
      console.log(`Checked out to branch '${newBranch}'.`);
    } catch (err) {
      this.log(`Branch '${newBranch}' does not exist (err=${err}). Creating and checking out...`);
      const args = ['checkout', '-b', newBranch];
      const code = await spawnAsync(this._repoDir, 'git', args, this.log, this.log);
      const msg = `exitCode=${code}, command line="${['git', ...args].join(' ')}"`;
      this.log(`git checkout end: ${msg}`);
      if (code !== 0) {
        throw new Error(`git checkout failed: ${msg}`);
      }

      this.branch = newBranch;
      this.log(`Created and checked out to new branch '${newBranch}'.`);
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
      this.log(`Already forked`);
      return result;
    }

    this.log(`Forking ${this.owner}/${this.name}...`);

    await getOctokit().repos.createFork({ owner: this.owner, repo: this.name, organization: targetOwner });
    this.log(`Created fork: ${this.owner}/${this.name} to ${targetOwner}`);

    for (let i = 0; i < 10; i++) {
      if (await result.checkRemote()) {
        break;
      }
      await sleepSecondds(5);
    }
    this.log(`Found forked repo: ${this.owner}/${this.name} to ${targetOwner}`);

    return result;
  }

  async createPR(title: string, desc: string): Promise<string> {
    if (!this.forkedFrom) {
      throw new Error(`${this.owner}/${this.name} is not a forked repository`);
    }
    this.log('Creating a PR...');

    const pr = await getOctokit().pulls.create({
      owner: this.owner,
      repo: this.name,
      title,
      head: `${this.branch}`, //head: `${this.owner}:${this.branch}`,
      base: this.forkedFrom.branch,
      body: desc,
    });

    const prUrl = pr.data.html_url;
    this.log(`PR reated: ${prUrl}`);
    return prUrl;
  }

  async getLastCommitId(): Promise<string> {
    this.log(`getting last commit id in ${this._repoDir}...`);

    const args = ['log', '-1', '--format=%H'];
    const { stdout, stderr, exitCode } = await execAsync(this._repoDir, 'git', args);
    const msg = `git log -1 --format=%H: exitCode=${exitCode}, stdout=${stdout}, stderr=${stderr}, command line="${['git', ...args].join(' ')}"`;
    this.log(msg);
    if (exitCode !== 0) {
      throw new Error(msg);
    }
    return stdout.trim();
  }
}
