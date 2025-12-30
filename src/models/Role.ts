export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export const isRole = (value: string): value is Role => {
  return Object.values(Role).includes(value as Role);
}