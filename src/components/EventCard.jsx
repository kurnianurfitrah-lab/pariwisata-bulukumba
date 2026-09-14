import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUrl.js';

export default function EventCard({ event }) {
  const description = event.deskripsi_event || '';
  const shortDesc = description.length > 120 ? description.slice(0, 120) + '…' : description;
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
      <Link to={`/events/${event.id_event}`} className="block">
        {event.gambar_event ? (
          <figure>
            <img 
              src={getImageUrl(event.gambar_event)} 
              alt={event.nama_event} 
              className="h-48 w-full object-cover"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbWJhciB0aWRhayBkYXBhdCBkaW11YXQ8L3RleHQ+PC9zdmc+';
              }}
            />
          </figure>
        ) : (
          <figure>
            <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Tidak ada gambar</span>
            </div>
          </figure>
        )}
        <div className="card-body">
          <h2 className="card-title">{event.nama_event}</h2>
          <div className="text-sm opacity-80 mb-2">
            <p>📍 {event.tempat || 'Bulukumba'}</p>
            {(event.tanggal_mulai || event.tanggal_selesai) && (
              <p className='text-sm'>📅 {formatDate(event.tanggal_mulai)} { event.tanggal_selesai ? `- ${formatDate(event.tanggal_selesai)}` : ''}</p>
            )}
          </div>
          <p className="text-sm opacity-80">{shortDesc}</p>
          <div className="card-actions justify-end mt-4">
            <div className="badge badge-primary">Event</div>
          </div>
        </div>
      </Link>
    </div>
  );
}
