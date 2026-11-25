export type SharedParticipant = {
  id: string;
  name: string;
  userId: string | null;
  active: boolean;
};

export type SharedExpenseView = {
  id: string;
  payerId: string;
  description: string;
  amountCents: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
  canEdit: boolean;
  shares: Array<{ participantId: string; amountCents: number }>;
};

export type SharedRepaymentView = {
  id: string;
  fromId: string;
  toId: string;
  amountCents: number;
  createdByName: string;
  createdAt: string;
  cancelledAt: string | null;
  canCancel: boolean;
};

export type SharedTransfer = { fromId: string; toId: string; amountCents: number };

export type SharedBudgetView = {
  eventId: string;
  slug: string;
  myParticipantId: string;
  controlledParticipantIds: string[];
  participants: SharedParticipant[];
  expenses: SharedExpenseView[];
  repayments: SharedRepaymentView[];
  transfers: SharedTransfer[];
  optimal: boolean;
  mine: { paidCents: number; shareCents: number; balanceCents: number };
};

export type SharedBudgetResult =
  | { ok: true; data: SharedBudgetView }
  | { ok: false; error: string };
