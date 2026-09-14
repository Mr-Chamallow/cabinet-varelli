import CarteEnqueteur from '@/components/carte-enqueteur/CarteEnqueteur';

export default function PageCarteEnqueteur() {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold text-slate-100">Carte enquêteur</h1>
      <CarteEnqueteur
        mapImageUrl="/map/satellite.jpg"
        imageWidth={8000}
        imageHeight={8000}
      />
    </div>
  );
}
