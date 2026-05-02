export async function resolveWritableBudgetAccess<T>(loadAccess: () => Promise<T>) {
  try {
    const access = await loadAccess();
    return {
      ok: true as const,
      access,
    };
  } catch (error) {
    return {
      ok: false as const,
      formError:
        error instanceof Error ? error.message : "Vous n'avez pas l'autorisation de gerer ce budget.",
    };
  }
}
