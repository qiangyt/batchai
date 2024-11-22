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
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
	ForbiddenException,
	Delete,
	Query,
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
import { Octokit } from '@octokit/rest';
import { extractNameFromEmail, GithubRepo } from 'src/helper';

export enum GrantLevel {
	Default = 'Default',
	Promoted = 'Promoted',
	Full = 'Full',
}

export const DEFAULT_NUM_QUOTE = 5;

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	name: string;

	@Column({ name: 'display_name', nullable: true })
	displayName: string;

	@Column({ name: 'avatar_url', nullable: true })
	avatarUrl: string;

	@Column({ name: 'github_email', nullable: true, unique: true })
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

	getNumQuote(): number {
		switch (this.grantLevel) {
			case GrantLevel.Default:
				return DEFAULT_NUM_QUOTE;
			case GrantLevel.Promoted:
				return 0;
			case GrantLevel.Full:
				return 0;
			default:
				return 5;
		}
	}

	ensureHasAdminRole() {
		if (!this.admin) {
			throw new ForbiddenException();
		}
	}

	static with(obj: any): User {
		if (!obj) return obj;
		User.with(obj.creater);
		User.with(obj.updater);
		Object.setPrototypeOf(obj, User.prototype);
		return obj;
	}
}

export class UserCreateReq {
	@IsNotEmpty()
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	displayName?: string;

	@IsOptional()
	@IsString()
	avatarUrl?: string;

	@IsNotEmpty()
	@IsString()
	grantLevel: GrantLevel;

	@IsEmail()
	@IsOptional()
	email?: string;

	@IsEmail()
	@IsOptional()
	githubEmail?: string;

	@IsOptional()
	@IsString()
	password?: string;
}

export interface UserApi {
	listAllUser(x: Kontext): Promise<UserBasic[]>;

	loadUser(x: Kontext, id: number): Promise<UserDetail>;

	isStarredBy(x: Kontext, id: number): Promise<boolean>;

	renewSession(x: Kontext, refreshToken: string): Promise<SignInDetail>;
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

	ensureHasAdminRole() {
		if (!this.admin) {
			throw new ForbiddenException();
		}
	}

	async render(u: User): Promise<UserBasic> {
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

	static async from(u: User): Promise<UserBasic> {
		if (!u) return null;
		return new UserBasic().render(u);
	}

	static async fromMany(users: User[]): Promise<UserBasic[]> {
		return Promise.all(users.map(UserBasic.from));
	}

	static async fromPage(p: Page<User>): Promise<Page<UserBasic>> {
		const elements = await UserBasic.fromMany(p.elements);
		return new Page<UserBasic>(p.page, p.limit, elements, p.total);
	}
}

export class UserDetail extends UserBasic {
	grantLevel: GrantLevel;

	creater: UserBasic;

	updater: UserBasic;

	async render(u: User): Promise<UserDetail> {
		await super.render(u);

		this.grantLevel = u.grantLevel;
		this.creater = await UserBasic.from(u.creater);
		this.updater = await UserBasic.from(u.updater);

		return this;
	}

	static async from(u: User): Promise<UserDetail> {
		if (!u) return null;
		return new UserDetail().render(u);
	}
}

export class SignInReq {
	@IsNotEmpty()
	@IsString()
	username: string;

	@IsNotEmpty()
	@IsString()
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
		u.githubEmail = req.githubEmail;
		u.admin = admin;

		if (req.password) {
			u.password = await bcrypt.hash(req.password, 10);
		}

		this.logger.log(`created user: ${JSON.stringify(u)}`);

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

	async findByGithubEmail(githubEmail: string): Promise<User> {
		return this.dao.findOneBy({ githubEmail });
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

	async buildSignInDetail(
		x: Kontext,
		u: User,
		githubAccessToken: string,
		githubRefreshToken: string,
	): Promise<SignInDetail> {
		x.user = u;

		const payload = { sub: u.id }; //, adm: u.admin, usr: u.name };
		const accessToken = this.jwtService.sign(payload, { secret: process.env.JWT_SECRET, expiresIn: 60 * 60 * 1000 });
		x.accessToken = accessToken;

		return {
			user: await UserDetail.from(u),
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

	async renewSession(x: Kontext, refreshToken: string): Promise<SignInDetail> {
		const payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_SECRET });
		const id = payload.sub;
		const u = await this.load(id);

		return this.buildSignInDetail(x, u, null, null);
	}

	async checkGrantLevel(githubAccessToken: string): Promise<GrantLevel> {
		const octokit = new Octokit({ auth: githubAccessToken });
		try {
			await octokit.activity.checkRepoIsStarredByAuthenticatedUser({ owner: 'qiangyt', repo: 'batchai' });
			return GrantLevel.Promoted;
		} catch (error) {
			if (error.status !== 404) {
				throw error;
			}
			return GrantLevel.Default;
		}
	}

	async signinByGithub(
		x: Kontext,
		githubAccessToken: string,
		githubRefreshToken: string,
		profile: Profile,
	): Promise<SignInDetail> {
		this.logger.log(`begin sign-in github user: ${JSON.stringify(profile)}`);

		const githubEmail = profile.emails ? profile.emails[0].value : null;
		let u = await this.findByGithubEmail(githubEmail);
		if (!u) {
			u = await this.create(
				x,
				{
					name: extractNameFromEmail(githubEmail),
					email: githubEmail,
					githubEmail,
					grantLevel: GrantLevel.Default,
				},
				false,
			);
		}

		u.githubId = profile.id;
		u.githubDisplayName = profile.displayName;
		u.githubEmail = githubEmail;
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

		if (!u.admin) {
			u.grantLevel = await this.checkGrantLevel(githubAccessToken);
		}

		u = await this.dao.save(u);
		this.logger.log(`successfully sign-in github user: ${JSON.stringify(u)}`);

		/*try {
			const batchaiRepo = new GithubRepo((output) => this.logger.log(output), null, 'qiangyt', 'batchai', false, null);
			if (await batchaiRepo.isStarredBy(u.githubEmail)) {
				this.logger.log(`successfully sign-in github user: ${JSON.stringify(u)}`);
			}
			this.logger.log(`successfully sign-in github user: ${JSON.stringify(u)}`);
		} catch (err) {
			this.logger.log(`successfully sign-in github user: ${JSON.stringify(u)}`);
		}*/

		return this.buildSignInDetail(x, u, githubAccessToken, githubRefreshToken);
	}

	async isStarredBy(id: number): Promise<boolean> {
		const u = await this.load(id);
		const batchaiRepo = new GithubRepo((output) => this.logger.log(output), null, 'qiangyt', 'batchai', false, null);
		return await batchaiRepo.isStarredBy(u.githubEmail);
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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loadUserEntity(x: Kontext, id: number): Promise<User> {
		return this.service.load(id);
	}

	@Transactional({ readOnly: true })
	async signinByPassword(x: Kontext, req: SignInReq): Promise<SignInDetail> {
		return this.service.signinByPassword(x, req);
	}

	@Transactional({ readOnly: true })
	async renewSession(x: Kontext, refreshToken: string): Promise<SignInDetail> {
		return this.service.renewSession(x, refreshToken);
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

	@Transactional()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async removeUser(x: Kontext, id: number): Promise<void> {
		const u = await this.service.load(id);
		return this.service.remove(u);
	}

	@Transactional({ readOnly: true })
	async isStarredBy(x: Kontext, id: number): Promise<boolean> {
		return this.service.isStarredBy(id);
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

	@RequiredRoles(Role.Admin)
	@Delete('id/:id')
	async removeUser(@RequestKontext() x: Kontext, @Param('id') id: number): Promise<void> {
		return this.facade.removeUser(x, id);
	}

	@RequiredRoles(Role.User)
	@Get('id/:id/starred')
	async isStarredBy(x: Kontext, id: number): Promise<boolean> {
		return this.facade.isStarredBy(x, id);
	}

	@RequiredRoles(Role.None)
	@Get('renew')
	async renewSession(x: Kontext, @Query('refreshToken') refreshToken: string): Promise<SignInDetail> {
		return this.facade.renewSession(x, refreshToken);
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
