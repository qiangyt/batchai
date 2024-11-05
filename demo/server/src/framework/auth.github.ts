import { Injectable, Logger, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { SignInDetail, UserFacade } from './user';
import { Get } from '@nestjs/common';
import { RequiredRoles, Role } from './role';
import { Response } from 'express';
import { Controller } from '@nestjs/common';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
	private readonly logger = new Logger(GithubStrategy.name);

	constructor(private readonly userFacade: UserFacade) {
		super({
			clientID: process.env.BATCHAI_EXAMPLES_GITHUB_APP__CLIENT_ID,
			clientSecret: process.env.BATCHAI_EXAMPLES_GITHUB_APP__CLIENT_SECRET,
			callbackURL: process.env.BATCHAI_EXAMPLES_GITHUB_APP__CLIENT_CALLBACK,
			scope: ['user:email'],
		});

		const proxyUrl = process.env.https_proxy;
		this.logger.log(`github proxy: ${proxyUrl}`);
		if (proxyUrl) {
			const proxyAgent = new HttpsProxyAgent(proxyUrl);
			this._oauth2.setAgent(proxyAgent);
		}
	}

	async validate(accessToken: string, refreshToken: string, profile: Profile, done: any): Promise<any> {
		const result = await this.userFacade.signinByGithub(null, accessToken, refreshToken, profile);
		done(null, result);
	}
}

@Controller('rest/v1/auth/github')
export class GithubAuthRest {
	constructor(private facade: UserFacade) {}

	@Get('redirect')
	@RequiredRoles(Role.None)
	async githubRedirect(@Query('redirect_url') redirectUrl: string, @Res() res: Response) {
		res.cookie('redirect_url', redirectUrl, { httpOnly: true });
		res.redirect('/rest/v1/auth/github');
	}

	@Get()
	@RequiredRoles(Role.None)
	@UseGuards(AuthGuard('github'))
	async githubLogin() {
		// nothing to do but needed
	}

	@Get('callback')
	@RequiredRoles(Role.None)
	@UseGuards(AuthGuard('github'))
	githubCallback(@Req() req: any, @Res() res: Response) {
		const signInDetail: SignInDetail = req.user;
		const signInDetailData = encodeURIComponent(JSON.stringify(signInDetail));

		const redirectUrl = req.cookies['redirect_url'];
		res.clearCookie('redirect_url');

		res.redirect(`${redirectUrl}?signInDetail=${signInDetailData}`);
	}
}
