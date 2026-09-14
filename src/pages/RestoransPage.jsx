import { useEffect, useState } from 'react';
import api from '../services/api.js';
import RestoranCard from '../components/RestoranCard.jsx';

export default function RestoransPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/restorans').then((res) => setData(Array.isArray(res.data) ? res.data : [])).catch(() => setData([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Restoran & Kuliner</h1>
      
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Restoran</h3>
          <p className="text-gray-500 max-w-md">
            Saat ini belum ada restoran yang tersedia. Silakan cek kembali nanti atau hubungi admin untuk informasi lebih lanjut.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.map((r) => <RestoranCard key={r.id_restoran} restoran={r} />)}
        </div>
      )}
    </div>
  );
}
