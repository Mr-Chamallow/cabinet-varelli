import CarteEnqueteur from '@/components/carte-enqueteur/CarteEnqueteur';

export default function PageCarteEnqueteur() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#e2e8f0' }}>Carte enquêteur</h1>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <CarteEnqueteur />
      </div>
    </div>
  );
}
