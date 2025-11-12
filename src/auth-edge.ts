export async function auth() {
  throw new Error(
    "auth-edge is disabled: database sessions require Node runtime. Import { auth } from '@/auth' and add `export const runtime = 'nodejs'` in that segment."
  );
}