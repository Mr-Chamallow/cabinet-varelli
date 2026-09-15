'use client';

import dynamic from 'next/dynamic';

const MapCanvas = dynamic(() => import('./MapCanvas'), { ssr: false });

interface Props {
  satelliteTilesUrl?: string;
  gridTilesUrl?: string;
}

export default function CarteEnqueteur(props: Props) {
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      <MapCanvas {...props} />
    </div>
  );
}