# Carte EnquÃªteur

Carte interactive (Leaflet, faÃ§on gta-5-map.com) pour Cabinet BullHead, avec
annotations en coordonnÃ©es rÃ©elles du jeu, icÃ´nes personnalisÃ©es et dossiers
par point.

## Installation

```bash
npm install leaflet
npm install -D @types/leaflet
```

Copie les fichiers dans ton projet Next.js :

```
components/carte-enqueteur/
  â”œâ”€ CarteEnqueteur.tsx   (wrapper, dÃ©sactive le SSR)
  â”œâ”€ MapCanvas.tsx        (la carte Leaflet + logique)
  â”œâ”€ supabase-carte.ts
  â””â”€ types.ts
supabase/
  â””â”€ carte_enqueteur.sql
```

Adapte l'import `@/lib/supabase` dans `supabase-carte.ts` vers ton client
Supabase existant, puis exÃ©cute `schema.sql` dans l'Ã©diteur SQL de ton
projet Supabase. Ajuste les policies RLS selon ton auth Discord OAuth.

## Mets tes images de carte en place

DÃ©pose `map.png` (grille) et/ou `satellite.jpg` dans `public/map/` de ton
projet. Utilise `satellite.jpg` comme fond par dÃ©faut :

```tsx
import CarteEnqueteur from '@/components/carte-enqueteur/CarteEnqueteur';

export default function PageCarte() {
  return (
    <CarteEnqueteur
      mapImageUrl="/map/satellite.jpg"
      imageWidth={8000}
      imageHeight={8000}
    />
  );
}
```

## CoordonnÃ©es rÃ©elles du jeu (important)

Contrairement Ã  la premiÃ¨re version (position en % arbitraire), les points
stockent maintenant **les vraies coordonnÃ©es GTA** (X, Y â€” celles que ton
serveur affiche en F8 ou via `/coords`). La conversion pixel â†” jeu est
calibrÃ©e sur le pack d'images 8000Ã—8000 fourni :

- Le point (X=0, Y=0) du jeu correspond au pixel (3667, 5395) de l'image.
- L'Ã©chelle est de 0.645 pixel par unitÃ© de coordonnÃ©e, identique sur les
  deux axes.

Ces valeurs sont les valeurs par dÃ©faut de `MapCanvas.tsx` (`DEFAULT_SCALE`,
`DEFAULT_ORIGIN`). Si un jour tu changes de pack d'image (autre rÃ©solution
ou recadrage), il faudra recalibrer :
1. RepÃ¨re deux gridlines connues (ex. X=0 et X=1000) sur ta nouvelle image
   et note leur position en pixels.
2. `scale = (pixel_X1000 - pixel_X0) / 1000`
3. `origin.px = pixel_X0`, mÃªme logique pour `origin.py` avec l'axe Y
   (attention, l'axe Y est inversÃ© : Y augmente vers le haut de l'image).
4. Passe ces valeurs via les props `scale` et `origin` du composant.

## FonctionnalitÃ©s

- Carte Leaflet avec `CRS.Simple` : pan/zoom fluide au doigt/molette,
  exactement le mÃªme principe que gta-5-map.com.
- Bouton "+ Nouveau point" : clique sur la carte pour poser une annotation
  aux coordonnÃ©es exactes du clic (converties en X/Y jeu).
- Chaque point ouvre un dossier : titre, catÃ©gorie (suspect / preuve /
  planque / tÃ©moin / autre), coordonnÃ©es X/Y Ã©ditables Ã  la main (utile
  pour coller une coordonnÃ©e exacte rÃ©cupÃ©rÃ©e en jeu), icÃ´ne personnalisÃ©e
  (URL d'image, sinon pastille de couleur par catÃ©gorie), notes, tags,
  piÃ¨ces jointes (liens).
- Affichage des coordonnÃ©es X/Y en direct sous le curseur (comme sur
  gta-5-map.com).
- Recherche plein texte + filtres par catÃ©gorie.
- Sidebar listant tous les dossiers, clic = la carte recentre dessus
  (`flyTo`).
- Sauvegarde vers Supabase Ã  chaque crÃ©ation/Ã©dition ; repli en mÃ©moire
  locale si Supabase est injoignable (bandeau d'avertissement affichÃ©).

## IcÃ´nes personnalisÃ©es

DÃ©pose tes PNG dans `public/icons/` (ex. `public/icons/suspect.png`) et
colle le chemin dans le champ "IcÃ´ne personnalisÃ©e" du dossier â€” pas besoin
de convention de nommage particuliÃ¨re, c'est une simple URL par point.

## Pistes d'Ã©volution possibles

- Bascule Satellite / Grille (tu as dÃ©jÃ  les deux images) via un petit
  sÃ©lecteur de calque.
- Fils reliant des points liÃ©s entre eux (faÃ§on "murder board").
- Export/import JSON d'un dossier d'enquÃªte complet.
- Restriction des policies RLS par rÃ´le RP via NextAuth.
