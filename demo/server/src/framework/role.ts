import { SetMetadata } from '@nestjs/common';
import 'reflect-metadata';

export enum Role {
  Admin = 'Admin',
  User = 'User',
  None = 'None',
}

export const REQUIRED_ROLE = 'required-role';
export const RequiredRoles = (role: Role = Role.Admin) => {
  if (!role) role = Role.Admin;
  return SetMetadata(REQUIRED_ROLE, role);
};
