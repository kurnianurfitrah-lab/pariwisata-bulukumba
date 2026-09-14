import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUrl.js';
import RatingStars from './RatingStars.jsx';

export default function HotelCard({ hotel }) {
  const description = hotel.deskripsi || '';
  const shortDesc = description.length > 120 ? description.slice(0, 120) + '…' : description;
  
  return (
    <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
      <Link to={`/hotels/${hotel.id_hotel}`} className="block">
        {hotel.cover_image_url ? (
          <figure>
            <img 
              src={getImageUrl(hotel.cover_image_url)} 
              alt={hotel.nama_hotel} 
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
          <h2 className="card-title">{hotel.nama_hotel}</h2>
          <div className="text-sm opacity-80 mb-2">
            {hotel.nama_kategori && (
              <p>🏷️ {hotel.nama_kategori}</p>
            )}
            {hotel.harga_kamar && (
              <p>💰 {hotel.harga_kamar}</p>
            )}
            {hotel.nomor_telepon && (
              <p>📞 {hotel.nomor_telepon}</p>
            )}
            {(hotel.average_rating > 0) && (
              <div className="flex items-center space-x-2 mt-2">
                <RatingStars
                  rating={hotel.average_rating}
                  size="sm"
                  showScore={true}
                />
                <span className="text-xs text-gray-600">
                  ({hotel.total_reviews})
                </span>
              </div>
            )}
          </div>
          <p className="text-sm opacity-80">{shortDesc}</p>
          <div className="card-actions justify-end mt-4">
            <div className="badge badge-primary">Hotel</div>
          </div>
        </div>
      </Link>
    </div>
  );
}
