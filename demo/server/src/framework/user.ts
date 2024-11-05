import {
	Entity,
	Column,
	CreateDateColumn,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
	JoinColumn,
} from 'typeorm';
import path from 'path';
import { mkdirp } from 'mkdirp';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Page } from './page';
import {
	ConflictException,
	NotFoundException,
	UnauthorizedException,
	Injectable,
	OnModuleInit,
	Controller,
	Get,
	Param,
	Body,
	Post,
	Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Transactional } from './transaction';
import { DataSource } from 'typeorm';
import { Kontext, RequestKontext } from './kontext';
import { RequiredRoles, Role } from './role';
import { Profile } from 'passport-github2';
import { REPO_DIR } from '../constants';
import { Octokit } from '@octokit/rest';

export enum GrantLevel {
	Default = 'Default', // --num = 5,
	Promoted = 'Promoted', // --num = 100, either starred or forked
	Full = 'Full', // -- num = 0, customer
}

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column({ name: 'display_name', nullable: true })
	displayName: string;

	@Column({ name: 'avatar_url', nullable: true })
	avatarUrl: string;

	@Column({ name: 'github_email', nullable: true })
	githubEmail: string;

	@Column({ name: 'github_id', nullable: true })
	githubId: string;

	@Column({ name: 'github_profile_url', nullable: true })
	githubProfileUrl: string;

	@Column({ name: 'github_photo_url', nullable: true })
	githubPhotoUrl: string;

	@Column({ name: 'github_display_name', nullable: true })
	githubDisplayName: string;

	@Column({ nullable: true })
	email: string;

	@Column({ nullable: true })
	password: string;

	@Column()
	admin: boolean;

	@Column({ name: 'granted_level', type: 'varchar', enum: GrantLevel })
	grantLevel: GrantLevel;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@ManyToOne(() => User, { eager: false, createForeignKeyConstraints: false })
	@JoinColumn({ name: 'creater_id' })
	creater: User;

	@UpdateDateColumn({ name: 'updated_at' })
	@Index()
	updatedAt: Date;

	@JoinColumn({ name: 'updater_id' })
	@ManyToOne(() => User, { eager: false, createForeignKeyConstraints: false })
	updater?: User;

	private dirPath: string;

	async dir(): Promise<string> {
		if (!this.dirPath) {
			const p = path.join(REPO_DIR, this.name);
			await mkdirp(p);

			this.dirPath = p;
		}
		return this.dirPath;
	}

	num(): number {
		switch (this.grantLevel) {
			case GrantLevel.Default:
				return 5;
			case GrantLevel.Promoted:
				return 100;
			case GrantLevel.Full:
				return 0;
			default:
				return 5;
		}
	}
}

export class UserCreateReq {
	@IsNotEmpty()
	name: string;

	displayName?: string;

	avatarUrl?: string;

	grantLevel: GrantLevel;

	@IsEmail()
	email?: string;

	@IsNotEmpty()
	password?: string;
}

export interface UserApi {
	listAllUser(x: Kontext): Promise<UserBasic[]>;

	loadUser(x: Kontext, id: number): Promise<UserDetail>;
}

export class UserBasic {
	id: number;

	name: string;

	email: string;

	displayName: string;

	avatarUrl: string;

	githubProfileUrl: string;

	admin: boolean;

	createdAt: Date;

	updatedAt: Date;

	render(u: User): UserBasic {
		this.id = u.id;
		this.name = u.name;
		this.email = u.email;
		this.displayName = u.displayName;
		this.avatarUrl = u.avatarUrl;
		this.githubProfileUrl = u.githubProfileUrl;
		this.admin = u.admin;
		this.createdAt = u.createdAt;
		this.updatedAt = u.updatedAt;

		return this;
	}

	static from(u: User): UserBasic {
		if (!u) return null;
		return new UserBasic().render(u);
	}

	static fromMany(users: User[]): UserBasic[] {
		return users.map(UserBasic.from);
	}

	static fromPage(p: Page<User>): Page<UserBasic> {
		return new Page<UserBasic>(p.page, p.limit, UserBasic.fromMany(p.elements), p.total);
	}
}

export class UserDetail extends UserBasic {
	grantLevel: GrantLevel;

	creater: UserBasic;

	updater: UserBasic;

	render(u: User): UserDetail {
		super.render(u);
		this.grantLevel = u.grantLevel;
		this.creater = UserBasic.from(u.creater);
		this.updater = UserBasic.from(u.updater);
		return this;
	}

	static from(u: User): UserDetail {
		if (!u) return null;
		return new UserDetail().render(u);
	}
}

export class SignInReq {
	@IsNotEmpty()
	username: string;

	@IsNotEmpty()
	password: string;
}

export class SignInDetail {
	user: UserDetail;
	accessToken: string;
	refreshToken: string;
	githubAccessToken?: string;
	githubRefreshToken?: string;
}

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(
		private jwtService: JwtService,
		@InjectRepository(User) private dao: Repository<User>,
	) {}

	async initAdminUser(x: Kontext): Promise<void> {
		const env = process.env;
		const name = env.ADMIN_NAME;
		if (!(await this.findByName(name))) {
			this.create(
				x,
				{ name, email: env.ADMIN_MAIL, password: env.ADMIN_INIT_PASSWORD, grantLevel: GrantLevel.Full },
				true,
			);
		}
	}

	async create(x: Kontext, req: UserCreateReq, admin: boolean): Promise<User> {
		if (await this.dao.existsBy({ name: req.name })) {
			throw new ConflictException(`user.name=${req.name}`);
		}

		const u = new User();
		u.name = req.name;
		u.displayName = req.displayName;
		u.grantLevel = req.grantLevel;
		u.avatarUrl = req.avatarUrl;
		u.email = req.email;
		u.admin = admin;

		if (req.password) {
			u.password = await bcrypt.hash(req.password, 10);
		}

		return await this.dao.save(u);
	}

	async resolve(x: Kontext, name: string): Promise<User> {
		const u = await this.findByName(name);
		if (u) return u;

		return this.create(x, { name, grantLevel: GrantLevel.Default }, false);
	}

	async findByName(name: string): Promise<User> {
		return this.dao.findOneBy({ name });
	}

	listAll(): Promise<User[]> {
		return this.dao.find();
	}

	findById(id: number): Promise<User> {
		return this.dao.findOneBy({ id });
	}

	async load(id: number): Promise<User> {
		const u = await this.findById(id);
		if (!u) {
			throw new NotFoundException(`id=${id}`);
		}
		return u;
	}

	async remove(u: User): Promise<void> {
		await this.dao.remove(u);
	}

	buildSignInDetail(x: Kontext, u: User, githubAccessToken: string, githubRefreshToken: string): SignInDetail {
		x.user = u;

		const payload = { sub: u.id }; //, adm: u.admin, usr: u.name };
		const accessToken = this.jwtService.sign(payload, { secret: process.env.JWT_SECRET, expiresIn: 60 * 60 * 1000 });
		x.accessToken = accessToken;

		return {
			user: UserDetail.from(u),
			accessToken,
			refreshToken: this.jwtService.sign(payload, {
				secret: process.env.JWT_SECRET,
				expiresIn: 30 * 24 * 60 * 60 * 1000,
			}),
			githubAccessToken,
			githubRefreshToken,
		};
	}

	async signinByPassword(x: Kontext, req: SignInReq): Promise<SignInDetail> {
		const u = await this.dao.findOneBy({ name: req.username });
		if (!u) {
			throw new UnauthorizedException();
		}

		const isMatch = await bcrypt.compare(req.password, u.password);
		if (!isMatch) {
			throw new UnauthorizedException();
		}

		return this.buildSignInDetail(x, u, null, null);
	}

	async signinByGithub(
		x: Kontext,
		githubAccessToken: string,
		githubRefreshToken: string,
		profile: Profile,
	): Promise<SignInDetail> {
		let u = await this.resolve(x, profile.username);

		u.githubId = profile.id;
		u.githubDisplayName = profile.displayName;
		u.githubEmail = profile.emails ? profile.emails[0].value : null;
		u.githubProfileUrl = profile.profileUrl;
		u.githubPhotoUrl = profile.photos ? profile.photos[0].value : null;

		if (!u.email) {
			u.email = u.githubEmail;
		}
		if (!u.displayName) {
			u.displayName = u.githubDisplayName || u.name;
		}
		if (!u.avatarUrl) {
			u.avatarUrl = u.githubPhotoUrl;
		}

		if (u.grantLevel === GrantLevel.Default) {
			const octokit = new Octokit({ auth: githubAccessToken });
			try {
				await octokit.activity.checkRepoIsStarredByAuthenticatedUser({ owner: 'qiangyt', repo: 'batchai' });
				u.grantLevel = GrantLevel.Full; // --> Promoted
			} catch (error) {
				if (error.status !== 404) {
					throw error;
				}
			}
		}

		u = await this.dao.save(u);

		return this.buildSignInDetail(x, u, githubAccessToken, githubRefreshToken);
	}
}

@Injectable()
export class UserFacade implements UserApi, OnModuleInit {
	constructor(
		private service: UserService,
		private dataSource: DataSource,
	) {}

	async onModuleInit() {
		this.initAdminUser(null);
	}

	@Transactional()
	private async initAdminUser(x: Kontext): Promise<void> {
		return this.service.initAdminUser(x);
	}

	@Transactional()
	async createUser(x: Kontext, req: UserCreateReq): Promise<UserDetail> {
		return UserDetail.from(await this.service.create(x, req, false));
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async listAllUser(x: Kontext): Promise<UserBasic[]> {
		return UserBasic.fromMany(await this.service.listAll());
	}

	@Transactional({ readOnly: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loadUser(x: Kontext, id: number): Promise<UserDetail> {
		return UserDetail.from(await this.service.load(id));
	}

	@Transactional({ readOnly: true })
	async signinByPassword(x: Kontext, req: SignInReq): Promise<SignInDetail> {
		return this.service.signinByPassword(x, req);
	}

	@Transactional()
	async signinByGithub(
		x: Kontext,
		githubAccessToken: string,
		githubRefreshToken: string,
		profile: Profile,
	): Promise<SignInDetail> {
		return this.service.signinByGithub(x, githubAccessToken, githubRefreshToken, profile);
	}
}

@Controller('rest/v1/users')
export class UserRest implements UserApi {
	constructor(private facade: UserFacade) {}

	@RequiredRoles(Role.Admin)
	@Get()
	async listAllUser(@RequestKontext() x: Kontext): Promise<UserBasic[]> {
		return this.facade.listAllUser(x);
	}

	@RequiredRoles(Role.Admin)
	@Get('id/:id')
	async loadUser(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<UserDetail> {
		return this.facade.loadUser(x, id);
	}
}

@Controller('rest/v1/auth')
export class AuthRest {
	constructor(private facade: UserFacade) {}

	@RequiredRoles(Role.None)
	@Post()
	async signinByPassword(@RequestKontext() x: Kontext, @Body() req: SignInReq): Promise<SignInDetail> {
		return this.facade.signinByPassword(x, req);
	}
}
