"use client";

import { Page } from "./page";

export enum GrantLevel {
  Default = 'Default',
  Promoted = 'Promoted',
  Full = 'Full',
}

export class UserCreateReq {
  
  name: string;

  displayName?: string;

  avatarUrl?: string;

  grantLevel: GrantLevel;

  email?: string;

  password?: string;
}

export class UserBasic {
  id: number;

  name: string;

  email: string;

  displayName: string;

  avatarUrl: string;

  admin: boolean;

  createdAt: Date;

  updatedAt: Date;

  githubProfileUrl: string;

  static with(obj: any): UserBasic {
    if (!obj) return obj;
    Object.setPrototypeOf(obj, UserBasic.prototype);
    return obj;
  }

  static withMany(users: any[]): UserBasic[] {
    if (!users) return users;
    return users.map(UserBasic.with);
  }

  static withPage(p: any): Page<UserBasic> {
    if (!p) return p;
    Page.with(p);
    UserBasic.withMany(p.elements);
    return p;
  }
  
}

export class UserDetail extends UserBasic {
  grantLevel: GrantLevel;

  creater: UserBasic;

  updater: UserBasic;

  static with(obj: any): UserDetail {
    if (!obj) return obj;
    UserBasic.with(obj);
    UserBasic.with(obj.creater);
    UserBasic.with(obj.updater);
    Object.setPrototypeOf(obj, UserDetail.prototype);
    return obj;
  }
  
}

export class SignInReq {
  username: string;
  password: string;
}

export class SignInDetail {
  user: UserDetail;
  accessToken: string;
  refreshToken: string;
  githubAccessToken:string;
  githubRefreshToken: string;
}
