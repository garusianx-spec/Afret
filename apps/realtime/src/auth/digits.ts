const FA = '۰۱۲۳۴۵۶۷۸۹';
const AR = '٠١٢٣٤٥٦٧٨٩';

/**
 * Persian/Arabic-Indic digits → ASCII.
 *
 * Mirrors `toEnDigits` in the web app. It lives here too because the server
 * must never trust the client to have normalised: a mobile number typed on a
 * Persian keyboard arrives as `۰۹۱۲…` and would otherwise fail validation.
 */
export function toEnDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const fa = FA.indexOf(d);
    if (fa >= 0) return String(fa);
    return String(AR.indexOf(d));
  });
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/**
 * ASCII → Persian digits, for numbers embedded in user-facing Persian copy.
 * A message reading «تا 15 دقیقه» in an otherwise Persian sentence looks
 * broken to a native reader.
 */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]!);
}
