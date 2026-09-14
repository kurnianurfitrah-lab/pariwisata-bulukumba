import { useEffect, useState } from 'react';
import api from '../services/api.js';
import HotelCard from '../components/HotelCard.jsx';

export default function HotelsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hotels').then((res) => setData(Array.isArray(res.data) ? res.data : [])).catch(() => setData([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Hotel & Penginapan</h1>
      
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Hotel</h3>
          <p className="text-gray-500 max-w-md">
            Saat ini belum ada hotel yang tersedia. Silakan cek kembali nanti atau hubungi admin untuk informasi lebih lanjut.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.map((h) => <HotelCard key={h.id_hotel} hotel={h} />)}
        </div>
      )}
    </div>
  );
}
