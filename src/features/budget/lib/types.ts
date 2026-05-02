export type BudgetLocalTabKey = "summary" | "lines" | "quotes";

export type BudgetMoneyValue = string;
export type BudgetSetupStatus = "NOT_STARTED" | "STARTED";

export type BudgetLineCategory =
  | "VENUE"
  | "FOOD_BEVERAGE"
  | "DESIGN_DECORATION"
  | "ENTERTAINMENT"
  | "LOGISTICS"
  | "GUEST_EXPERIENCE"
  | "COMMUNICATION"
  | "MISCELLANEOUS";

export type BudgetLineSourcingStatus = "DRAFT" | "SOURCING" | "QUOTES_RECEIVED" | "SELECTED" | "BOOKED";

export type QuoteStatus = "AWAITING_RESPONSE" | "RECEIVED" | "SELECTED" | "REJECTED";

export type PaymentEntryType = "DEPOSIT" | "BALANCE" | "OTHER";

export type BudgetPaymentStatus =
  | "NOT_APPLICABLE"
  | "UNPAID"
  | "DEPOSIT_PAID"
  | "PARTIALLY_PAID"
  | "PAID";

export type BudgetSnapshot = {
  id: string;
  eventId: string;
  totalBudget: BudgetMoneyValue;
  currency: string;
};

export type BudgetLineSnapshot = {
  id: string;
  budgetId: string;
  category: BudgetLineCategory;
  label: string;
  targetAmount: BudgetMoneyValue;
  estimatedAmount: BudgetMoneyValue | null;
  sourcingStatus: BudgetLineSourcingStatus;
  selectedQuoteId: string | null;
  internalNote: string | null;
};

export type QuoteAttachmentSnapshot = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
};

export type QuoteAttachmentDraft = {
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
};

export type VendorOption = {
  id: string;
  name: string;
  vendorType: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
};

export type QuoteSnapshot = {
  id: string;
  budgetLineId: string;
  vendorId: string;
  vendorName: string;
  status: QuoteStatus;
  amount: BudgetMoneyValue | null;
  scope: string | null;
  requestedAt: string | null;
  receivedAt: string | null;
  validUntil: string | null;
  internalNote: string | null;
  decisionNote: string | null;
  attachments: QuoteAttachmentSnapshot[];
};

export type PaymentEntrySnapshot = {
  id: string;
  budgetLineId: string;
  quoteId: string | null;
  label: string;
  entryType: PaymentEntryType;
  amount: BudgetMoneyValue;
  dueDate: string;
  paidAt: string | null;
  note: string | null;
};

export type BudgetMetricCard = {
  label: string;
  value: BudgetMoneyValue;
  tone?: "default" | "muted" | "warning";
  helper?: string;
  displayValue?: string;
};

export type BudgetSummaryCounts = {
  linesInSourcing: number;
  quotesAwaitingResponse: number;
  overTargetLines: number;
  unpaidBookings: number;
  paymentsDueThisWeek: number;
};

export type NeedsAttentionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

export type UpcomingPaymentItem = {
  id: string;
  lineId: string;
  lineLabel: string;
  paymentLabel: string;
  dueDate: string;
  amount: BudgetMoneyValue;
  vendorName: string | null;
};

export type BudgetSummaryData = {
  event: {
    id: string;
    slug: string;
    title: string;
  };
  hasDefinedTotal: boolean;
  budget: BudgetSnapshot;
  totals: {
    totalBudget: BudgetMoneyValue;
    estimated: BudgetMoneyValue;
    committed: BudgetMoneyValue;
    paid: BudgetMoneyValue;
    remaining: BudgetMoneyValue;
  };
  counts: BudgetSummaryCounts;
  needsAttention: NeedsAttentionItem[];
  upcomingPayments: UpcomingPaymentItem[];
};

export type BudgetEntryStateData = {
  event: {
    id: string;
    slug: string;
    title: string;
  };
  budget: BudgetSnapshot & {
    setupStatus: BudgetSetupStatus;
  };
  linesCount: number;
  estimatedLinesCount: number;
  quotesCount: number;
  paymentsCount: number;
  hasDefinedTotal: boolean;
  previewLines: Array<{
    id: string;
    category: BudgetLineCategory;
    label: string;
    targetAmount: BudgetMoneyValue;
    estimatedAmount: BudgetMoneyValue | null;
  }>;
};

export type BudgetLineRow = {
  id: string;
  budgetId: string;
  label: string;
  category: BudgetLineCategory;
  targetAmount: BudgetMoneyValue;
  estimatedAmount: BudgetMoneyValue | null;
  varianceAmount: BudgetMoneyValue | null;
  committedAmount: BudgetMoneyValue;
  paidAmount: BudgetMoneyValue;
  sourcingStatus: BudgetLineSourcingStatus;
  paymentStatus: BudgetPaymentStatus;
  selectedVendorName: string | null;
  selectedQuoteId: string | null;
  quotesReceivedCount: number;
  attachmentsCount: number;
  nextPaymentDue: string | null;
  paymentEntries: PaymentEntrySnapshot[];
  internalNote: string | null;
};

export type BudgetLinesData = {
  event: {
    id: string;
    slug: string;
    title: string;
  };
  budget: BudgetSnapshot;
  lines: BudgetLineRow[];
};

export type BudgetQuotesOverviewRow = {
  id: string;
  label: string;
  category: BudgetLineCategory;
  targetAmount: BudgetMoneyValue;
  estimatedAmount: BudgetMoneyValue | null;
  sourcingStatus: BudgetLineSourcingStatus;
  selectedVendorName: string | null;
  quoteCounts: Record<QuoteStatus, number>;
};

export type BudgetQuotesOverviewData = {
  event: {
    id: string;
    slug: string;
    title: string;
  };
  budget: BudgetSnapshot;
  vendors: VendorOption[];
  lines: BudgetQuotesOverviewRow[];
  totalQuotesCount: number;
};

export type BudgetLineQuotesData = {
  event: {
    id: string;
    slug: string;
    title: string;
  };
  budget: BudgetSnapshot;
  vendors: VendorOption[];
  line: BudgetLineRow & {
    selectedQuote: QuoteSnapshot | null;
    receivedQuotes: QuoteSnapshot[];
    awaitingResponseQuotes: QuoteSnapshot[];
    rejectedQuotes: QuoteSnapshot[];
    allAttachments: QuoteAttachmentSnapshot[];
  };
};
