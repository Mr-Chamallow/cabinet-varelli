'use client';

import dynamic from 'next/dynamic';

const MapCanvas = dynamic(() => import('./MapCanvas'), { ssr: false });

interface Props {
  satelliteTilesUrl?: string;
  gridTilesUrl?: string;
  atlasTilesUrl?: string;
}

export default function CarteEnqueteur(props: Props) {
  return <MapCanvas {...props} />;
}
