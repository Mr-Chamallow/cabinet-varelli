// Début de semaine (LUNDI) en heure de Paris, au format YYYY-MM-DD. Utilisable côté serveur et navigateur.
// (L'ancienne version rangeait le dimanche dans la semaine suivante.)
export function weekStartOf(date: Date | string = new Date()): string {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
