import { useEffect, useState } from 'react';
import api from '../services/api.js';
import AttractionCard from '../components/AttractionCard.jsx';

export default function AttractionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attractions').then((res) => setData(Array.isArray(res.data) ? res.data : [])).catch(() => setData([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Objek Wisata</h1>
      
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Objek Wisata</h3>
          <p className="text-gray-500 max-w-md">
            Saat ini belum ada objek wisata yang tersedia. Silakan cek kembali nanti atau hubungi admin untuk informasi lebih lanjut.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.map((a) => <AttractionCard key={a.id_wisata} attraction={a} />)}
        </div>
      )}
    </div>
  );
}


