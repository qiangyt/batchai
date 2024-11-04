import 'reflect-metadata';
import { ExtractJwt, Strategy as StrategyJwt } from 'passport-jwt';
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { UserFacade } from './user';
import { Role, REQUIRED_ROLE } from './role';
import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { User } from './user';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(ctx: ExecutionContext): Promise<any> {
    const requiredRole = this.reflector.getAllAndOverride<Role>(REQUIRED_ROLE, [ctx.getHandler(), ctx.getClass()]);
    if (!requiredRole) {
      throw new UnauthorizedException();
    }

    const req = this.getRequest(ctx);
    if (!this.hasToken(req)) {
      if (requiredRole === Role.None) return true;
      throw new UnauthorizedException();
    }

    const ok = await super.canActivate(ctx);
    if (ok) {
      if (requiredRole == Role.Admin) {
        const user: User = req.user;
        if (!user.admin) {
          throw new ForbiddenException();
        }
      }
    }

    return ok;
  }

  private hasToken(req: Request): boolean {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer') {
      return false;
    }
    return token !== '';
  }
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userFacade: UserFacade) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const u = await this.userFacade.signinByPassword(null, { username, password });
    if (!u) {
      throw new UnauthorizedException();
    }
    return u;
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(StrategyJwt) {
  constructor(private readonly userFacade: UserFacade) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const uid = parseInt(payload.sub, 10);
    return this.userFacade.loadUser(null, uid);
  }
}
