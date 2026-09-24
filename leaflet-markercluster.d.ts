// @types/leaflet.markercluster ne déclare QUE des ajouts au module "leaflet"
// (L.MarkerCluster, L.markerClusterGroup...), jamais le module "leaflet.markercluster"
// lui-même. Or MapCanvas.tsx a besoin d'un import "à effet de bord" de ce module pour
// charger le plugin au runtime (`import 'leaflet.markercluster';`) — sans cette ligne,
// TypeScript (surtout en résolution "bundler", utilisée ici) ne trouve aucune
// déclaration pour cet import et râle avec l'erreur ts(2882), même si le code
// fonctionne parfaitement (VS Code le signale, tsc en CLI peut le laisser passer
// selon la version — dans le doute, ce fichier règle le problème dans tous les cas).
declare module "leaflet.markercluster";
