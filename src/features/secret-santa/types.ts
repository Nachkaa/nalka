export type SecretSantaTargetItem = {
  id: string;
  title: string;
  url: string | null;
  note: string | null;
};

export type SecretSantaMeView = {
  receiver: { id: string; name: string | null; email: string | null };
  listId: string | null;
  receiverItems: SecretSantaTargetItem[];
};

export type SecretSantaModuleProps = {
  eventId: string;
  slug: string;
  isAdmin: boolean;
  membersCount: number;
  budgetCapCents: number | null;
  isSecondHandOk: boolean;
  isHandmadeOk: boolean;
};
