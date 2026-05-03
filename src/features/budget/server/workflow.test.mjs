import assert from "node:assert/strict";

import { calculatePaidAmount, derivePaymentStatus } from "../lib/calculations.ts";
import {
  buildMarkBookedUpdate,
  buildPaymentEntryCreateData,
  buildReopenSelectedLineTransaction,
  buildRejectQuoteUpdate,
  buildSelectQuoteTransaction,
  checkPaymentAmountVsCommitted,
  ensureBudgetLineAllowsPayments,
  ensureBudgetLineCanBeBooked,
  ensureBudgetLineCanBeReopened,
  ensureQuoteCanBeRejected,
  ensureQuoteCanBeSelected,
  getReopenedLineFallbackStatus,
  resolvePaidAtOverride,
} from "./workflow.ts";
import { resolveWritableBudgetAccess } from "./write-access.ts";

function makePayment(overrides = {}) {
  return {
    id: "payment-1",
    budgetLineId: "line-1",
    quoteId: "quote-1",
    label: "Deposit",
    entryType: "DEPOSIT",
    amount: "1000.00",
    dueDate: "2026-04-15T10:00:00.000Z",
    paidAt: null,
    note: null,
    ...overrides,
  };
}

async function run(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await run("cannot select a quote in AWAITING_RESPONSE", () => {
  assert.throws(
    () => ensureQuoteCanBeSelected({ status: "AWAITING_RESPONSE", amount: { toString: () => "100.00" } }),
    /Seuls les devis recus peuvent etre retenus/,
  );
});

await run("cannot select a quote with null amount", () => {
  assert.throws(
    () => ensureQuoteCanBeSelected({ status: "RECEIVED", amount: null }),
    /Un montant de devis est requis avant la selection/,
  );
});

await run("selecting a RECEIVED quote sets selected quote and selected line updates", () => {
  const transition = buildSelectQuoteTransaction({
    budgetLineId: "line-1",
    quoteId: "quote-2",
    decisionNote: "Best fit",
  });

  assert.deepEqual(transition.selectQuoteData, {
    status: "SELECTED",
    decisionNote: "Best fit",
  });
  assert.deepEqual(transition.updateLineData, {
    selectedQuoteId: "quote-2",
    sourcingStatus: "SELECTED",
  });
});

await run("selecting a different quote demotes the previous selected quote back to RECEIVED", () => {
  const transition = buildSelectQuoteTransaction({
    budgetLineId: "line-1",
    quoteId: "quote-new",
    decisionNote: "",
  });

  assert.deepEqual(transition.demoteSelectedWhere, {
    budgetLineId: "line-1",
    status: "SELECTED",
    NOT: { id: "quote-new" },
  });
  assert.deepEqual(transition.demoteSelectedData, { status: "RECEIVED" });
});

await run("cannot reject the currently selected quote", () => {
  assert.throws(
    () => ensureQuoteCanBeRejected({ id: "quote-1", budgetLine: { selectedQuoteId: "quote-1" } }),
    /Changez le devis retenu avant de le refuser/,
  );
});

await run("rejecting a RECEIVED quote sets status to REJECTED", () => {
  assert.deepEqual(buildRejectQuoteUpdate("Too expensive"), {
    status: "REJECTED",
    decisionNote: "Too expensive",
  });
});

await run("cannot mark a line BOOKED without selectedQuoteId", () => {
  assert.throws(
    () =>
      ensureBudgetLineCanBeBooked({
        sourcingStatus: "SELECTED",
        selectedQuoteId: null,
        selectedQuote: null,
      }),
    /Un devis retenu est requis avant la reservation/,
  );
});

await run("cannot mark a line BOOKED if selected quote has no amount", () => {
  assert.throws(
    () =>
      ensureBudgetLineCanBeBooked({
        sourcingStatus: "SELECTED",
        selectedQuoteId: "quote-1",
        selectedQuote: { id: "quote-1", amount: null },
      }),
    /Le devis retenu doit avoir un montant avant la reservation/,
  );
});

await run("can mark a line BOOKED only from SELECTED state", () => {
  assert.throws(
    () =>
      ensureBudgetLineCanBeBooked({
        sourcingStatus: "QUOTES_RECEIVED",
        selectedQuoteId: "quote-1",
        selectedQuote: { id: "quote-1", amount: { toString: () => "500.00" } },
      }),
    /Seules les lignes retenues peuvent etre marquees comme reservees/,
  );

  assert.doesNotThrow(() =>
    ensureBudgetLineCanBeBooked({
      sourcingStatus: "SELECTED",
      selectedQuoteId: "quote-1",
      selectedQuote: { id: "quote-1", amount: { toString: () => "500.00" } },
    }),
  );
  assert.deepEqual(buildMarkBookedUpdate(), { sourcingStatus: "BOOKED" });
});

await run("cannot create payment entry on a non-BOOKED line", () => {
  assert.throws(
    () => ensureBudgetLineAllowsPayments({ sourcingStatus: "SELECTED", selectedQuoteId: "quote-1" }),
    /Les echeances de paiement ne peuvent etre ajoutees/,
  );
});

await run("cannot reopen a BOOKED line", () => {
  assert.throws(
    () => ensureBudgetLineCanBeReopened({ sourcingStatus: "BOOKED", selectedQuoteId: "quote-1" }),
    /Les lignes reservees ne peuvent pas etre rouvertes/,
  );
});

await run("cannot reopen without selected quote", () => {
  assert.throws(
    () => ensureBudgetLineCanBeReopened({ sourcingStatus: "SELECTED", selectedQuoteId: null }),
    /Un devis retenu est requis avant la reouverture/,
  );
});

await run("reopening from SELECTED clears selectedQuoteId and demotes selected quote", () => {
  const transition = buildReopenSelectedLineTransaction({
    budgetLineId: "line-1",
    selectedQuoteId: "quote-selected",
    decisionNote: "Need to compare again",
    receivedQuotesCount: 1,
    awaitingResponseQuotesCount: 0,
  });

  assert.deepEqual(transition.reopenQuoteWhere, { id: "quote-selected" });
  assert.deepEqual(transition.reopenQuoteData, {
    status: "RECEIVED",
    decisionNote: "Need to compare again",
  });
  assert.deepEqual(transition.updateLineData, {
    selectedQuoteId: null,
    sourcingStatus: "QUOTES_RECEIVED",
  });
});

await run("reopening returns QUOTES_RECEIVED when received quotes remain", () => {
  assert.equal(
    getReopenedLineFallbackStatus({
      receivedQuotesCount: 2,
      awaitingResponseQuotesCount: 1,
    }),
    "QUOTES_RECEIVED",
  );
});

await run("reopening returns SOURCING when only awaiting-response entries remain", () => {
  assert.equal(
    getReopenedLineFallbackStatus({
      receivedQuotesCount: 0,
      awaitingResponseQuotesCount: 2,
    }),
    "SOURCING",
  );
});

await run("reopening falls back to DRAFT when no received or awaiting quotes remain", () => {
  assert.equal(
    getReopenedLineFallbackStatus({
      receivedQuotesCount: 0,
      awaitingResponseQuotesCount: 0,
    }),
    "DRAFT",
  );
});

await run("can create payment entry on a BOOKED line", () => {
  assert.doesNotThrow(() =>
    ensureBudgetLineAllowsPayments({ sourcingStatus: "BOOKED", selectedQuoteId: "quote-1" }),
  );

  assert.deepEqual(
    buildPaymentEntryCreateData({
      budgetLineId: "line-1",
      quoteId: "quote-1",
      label: "Final balance",
      entryType: "BALANCE",
      amount: "2500.00",
      dueDate: new Date("2026-05-01T09:00:00.000Z"),
      note: "Due after rehearsal",
    }),
    {
      budgetLineId: "line-1",
      quoteId: "quote-1",
      label: "Final balance",
      entryType: "BALANCE",
      amount: "2500.00",
      dueDate: new Date("2026-05-01T09:00:00.000Z"),
      note: "Due after rehearsal",
    },
  );
});

await run("marking payment paid sets paidAt", () => {
  const now = new Date("2026-04-12T10:00:00.000Z");
  assert.equal(resolvePaidAtOverride(null, now).toISOString(), now.toISOString());
  assert.equal(
    resolvePaidAtOverride("2026-04-14T15:00:00.000Z", now).toISOString(),
    "2026-04-14T15:00:00.000Z",
  );
});

await run("derived payment status logic stays consistent across paid and unpaid cases", () => {
  const unpaidEntries = [makePayment({ paidAt: null, amount: "500.00" })];
  assert.equal(calculatePaidAmount(unpaidEntries), "0.00");
  assert.equal(
    derivePaymentStatus({
      committedAmount: "1000.00",
      paidAmount: "0.00",
      paymentEntries: unpaidEntries,
    }),
    "UNPAID",
  );

  const depositPaidEntries = [makePayment({ paidAt: "2026-04-12T10:00:00.000Z", amount: "400.00" })];
  assert.equal(calculatePaidAmount(depositPaidEntries), "400.00");
  assert.equal(
    derivePaymentStatus({
      committedAmount: "1000.00",
      paidAmount: "400.00",
      paymentEntries: depositPaidEntries,
    }),
    "DEPOSIT_PAID",
  );

  const partialPaidEntries = [
    makePayment({ entryType: "OTHER", paidAt: "2026-04-12T10:00:00.000Z", amount: "400.00" }),
  ];
  assert.equal(
    derivePaymentStatus({
      committedAmount: "1000.00",
      paidAmount: "400.00",
      paymentEntries: partialPaidEntries,
    }),
    "PARTIALLY_PAID",
  );

  const fullyPaidEntries = [makePayment({ paidAt: "2026-04-12T10:00:00.000Z", amount: "1000.00" })];
  assert.equal(calculatePaidAmount(fullyPaidEntries), "1000.00");
  assert.equal(
    derivePaymentStatus({
      committedAmount: "1000.00",
      paidAmount: "1000.00",
      paymentEntries: fullyPaidEntries,
    }),
    "PAID",
  );
});

await run("over-payment direct is blocked", () => {
  const result = checkPaymentAmountVsCommitted({
    committedDecimal: "8000.00",
    existingDecimal: "0.00",
    newDecimal: "9000.00",
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "OVER_PAYMENT");
  assert.equal(result.committed, "8000.00");
  assert.equal(result.projected, "9000.00");
});

await run("cumulative over-payment is blocked", () => {
  const result = checkPaymentAmountVsCommitted({
    committedDecimal: "8000.00",
    existingDecimal: "5000.00",
    newDecimal: "4000.00",
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "OVER_PAYMENT");
  assert.equal(result.committed, "8000.00");
  assert.equal(result.projected, "9000.00");
});

await run("non-organizer access failures return controlled permission errors", async () => {
  const result = await resolveWritableBudgetAccess(async () => {
    throw new Error("You do not have permission to manage this budget.");
  });

  assert.deepEqual(result, {
    ok: false,
    formError: "You do not have permission to manage this budget.",
  });
});

await run("successful access resolution returns the access object", async () => {
  const result = await resolveWritableBudgetAccess(async () => ({
    event: { id: "event-1" },
  }));

  assert.deepEqual(result, {
    ok: true,
    access: {
      event: { id: "event-1" },
    },
  });
});
