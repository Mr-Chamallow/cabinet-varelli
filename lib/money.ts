// Format monetaire unique du projet : 1.000$ , 10,50$ , -2.500$
export function money(n: number | string | null | undefined, dec?: number): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0$";
  const a = Math.abs(v);
  const d = dec !== undefined ? dec : Math.abs(a - Math.round(a)) > 0.004 ? 2 : 0;
  const fixed = a.toFixed(d);
  const [ent, frac] = fixed.split(".");
  const milliers = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const neg = v < 0 && Number(fixed) !== 0;
  return (neg ? "-" : "") + milliers + (frac ? "," + frac : "") + "$";
}
