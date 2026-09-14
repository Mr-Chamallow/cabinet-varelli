'use client';

import dynamic from 'next/dynamic';

// Leaflet a besoin de `window`/`document` : on dÃ©sactive le SSR pour ce composant.
const MapCanvas = dynamic(() => import('./MapCanvas'), { ssr: false });

interface Props {
  /** Chemin ou URL de l'image de carte (ta capture d'Ã©cran GTA V, par ex. /map/gta5.png) */
  mapImageUrl: string;
  /** Largeur rÃ©elle de l'image en pixels */
  imageWidth: number;
  /** Hauteur rÃ©elle de l'image en pixels */
  imageHeight: number;
}

export default function CarteEnqueteur(props: Props) {
  return <MapCanvas {...props} />;
}
