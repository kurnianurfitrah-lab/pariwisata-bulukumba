import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { EventCard } from '../components';

export default function EventsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events').then((res) => setData(Array.isArray(res.data) ? res.data : [])).catch(() => setData([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Event</h1>
      
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Event</h3>
          <p className="text-gray-500 max-w-md">
            Saat ini belum ada event yang tersedia. Silakan cek kembali nanti atau hubungi admin untuk informasi event terbaru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((event) => (
            <EventCard key={event.id_event} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}


