// Dates et heures pré-remplies à l'heure actuelle (fuseau de Paris, client et serveur)
const morceaux = (d: Date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(d).map(p => [p.type, p.value])
  );

// Date du jour "AAAA-MM-JJ" (ou d'un autre instant)
export const dateISO = (d: Date = new Date()) => { const p = morceaux(d); return `${p.year}-${p.month}-${p.day}`; };
// Heure "HH:MM"
export const heureISO = (d: Date = new Date()) => { const p = morceaux(d); return `${p.hour}:${p.minute}`; };
// Date + heure pour un champ datetime-local "AAAA-MM-JJTHH:MM"
export const dateHeureLocale = (d: Date = new Date()) => `${dateISO(d)}T${heureISO(d)}`;
// Date dans n jours (ex : échéance à 7 jours)
export const dansJours = (n: number) => dateISO(new Date(Date.now() + n * 86400000));
