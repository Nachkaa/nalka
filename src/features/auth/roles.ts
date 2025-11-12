export type Role = "OWNER" | "ADMIN" | "MEMBER";

export const ROLE_RANK: Record<Role, number> = {
  OWNER: 2,
  ADMIN: 3,
  MEMBER: 1,
};

export function isAtLeast(a: Role, b: Role) {
  return ROLE_RANK[a] >= ROLE_RANK[b];
}
