import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { getImageUrl } from '../utils/imageUrl.js';

export default function GalleryPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fungsi untuk menangani klik item galeri
  const handleItemClick = (item) => {
    if (item.id_wisata) {
      navigate(`/attractions/${item.id_wisata}`);
    } else if (item.id_hotel) {
      navigate(`/hotels/${item.id_hotel}`);
    } else if (item.id_restoran) {
      navigate(`/restorans/${item.id_restoran}`);
    }
  };

  // Fungsi untuk mendapatkan nama item
  const getItemName = (item) => {
    if (item.id_wisata && item.nama_wisata) {
      return item.nama_wisata;
    } else if (item.id_hotel && item.nama_hotel) {
      return item.nama_hotel;
    } else if (item.id_restoran && item.nama_restoran) {
      return item.nama_restoran;
    }
    return item.nama || 'Tanpa Nama';
  };

  // Fungsi untuk mendapatkan tipe item
  const getItemType = (item) => {
    if (item.id_wisata) return 'Wisata';
    if (item.id_hotel) return 'Hotel';
    if (item.id_restoran) return 'Restoran';
    return '';
  };

  useEffect(() => {
    api.get('/gallery').then((res) => setData(Array.isArray(res.data) ? res.data : [])).catch(() => setData([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Galeri</h1>
      
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Galeri Masih Kosong</h3>
          <p className="text-gray-500 max-w-md">
            Saat ini belum ada foto atau gambar yang tersedia di galeri. Silakan cek kembali nanti untuk melihat koleksi foto terbaru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.map((g) => (
            <figure 
              key={g.id_galeri} 
              className="group overflow-hidden rounded shadow cursor-pointer hover:shadow-lg transition-all duration-300 bg-white relative"
              onClick={() => handleItemClick(g)}
            >
              <div className="relative h-48">
                <img 
                  src={getImageUrl(g.gambar)} 
                  alt={g.keterangan || getItemName(g)} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbWJhciB0aWRhayBkYXBhdCBkaW11YXQ8L3RleHQ+PC9zdmc+';
                  }}
                />
                {/* Badge untuk tipe item */}
                {getItemType(g) && (
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${
                      getItemType(g) === 'Wisata' ? 'bg-green-500' :
                      getItemType(g) === 'Hotel' ? 'bg-blue-500' :
                      'bg-orange-500'
                    }`}>
                      {getItemType(g)}
                    </span>
                  </div>
                )}
                
                {/* Overlay dengan caption yang muncul saat hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end">
                  {/* Caption dengan informasi lengkap */}
                  <div className="p-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {getItemName(g)}
                    </h3>
                    {g.keterangan && (
                      <p className="text-xs text-gray-200 line-clamp-2 mb-2">{g.keterangan}</p>
                    )}
                    <div className="flex items-center text-xs text-blue-300">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Klik untuk melihat detail
                    </div>
                  </div>
                </div>
              </div>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}


