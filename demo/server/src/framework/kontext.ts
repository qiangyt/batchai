import { Injectable, createParamDecorator, ExecutionContext, NestInterceptor, CallHandler } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import 'reflect-metadata';
import { Observable } from 'rxjs';
import { User } from './user';
import { Role } from './role';

export class Kontext {
  queryRunner?: QueryRunner;
  accessToken?: string;
  user?: User;
  role?: Role;

  constructor(readonly dataSource: DataSource) {}
}

@Injectable()
export class RequestKontextInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    if (!req.x) {
      const x = new Kontext(this.dataSource);
      x.user = req.user;
      req.x = x;
    }
    return next.handle();
  }
}

export const RequestKontext = createParamDecorator(async (data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.x;
});
