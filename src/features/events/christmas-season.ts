/** A seasonal entry point only; event modules still require an explicit choice. */
export function isChristmasSeason(date: Date) {
  return date.getUTCMonth() >= 10;
}
