// Même logique que la page Comptabilité (début de semaine), utilisable côté serveur.
export function weekStartOf(date: Date | string = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}
