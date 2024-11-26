"use client";

import { UserBasic } from './user.dto';

export abstract class AuditableDto {
  id: number;

  createdAt: Date;

  creater: UserBasic;

  updatedAt: Date;

  updater: UserBasic;

  static with(obj: any) {
    if (!obj) return;
    Object.setPrototypeOf(obj, AuditableDto.prototype);
    UserBasic.with(obj.creater);
    UserBasic.with(obj.updater);
  }

}
