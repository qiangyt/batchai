"use client";

import { UserBasic } from './user.dto';

export abstract class AuditableDto {
  id: number;

  createdAt: Date;

  creater: UserBasic;

  updatedAt: Date;

  updater: UserBasic;
  
  static cast(obj: any) {
    if (!obj) return;
    Object.setPrototypeOf(obj, AuditableDto.prototype);
    UserBasic.cast(obj.creater);
    UserBasic.cast(obj.updater);
  }
  
}
