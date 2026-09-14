'use client';

import dynamic from 'next/dynamic';

// Leaflet a besoin de `window`/`document` : on désactive le SSR pour ce composant.
const MapCanvas = dynamic(() => import('./MapCanvas'), { ssr: false });

interface Props {
  /** URL du template de tuiles satellite, ex : /map/tiles/satellite/{z}/{x}/{y}.png */
  satelliteTilesUrl?: string;
  /** URL du template de tuiles grille, ex : /map/tiles/grid/{z}/{x}/{y}.png */
  gridTilesUrl?: string;
}

export default function CarteEnqueteur(props: Props) {
  return <MapCanvas {...props} />;
}
