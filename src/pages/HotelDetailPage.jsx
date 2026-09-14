import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { getImageUrl } from '../utils/imageUrl.js';
import ReviewForm from '../components/ReviewForm.jsx';
import ReviewList from '../components/ReviewList.jsx';
import RatingStars from '../components/RatingStars.jsx';
import MapEmbed from '../components/MapEmbed.jsx';

export default function HotelDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshReviews, setRefreshReviews] = useState(0);

  useEffect(() => {
    // Fetch hotel data
    api.get(`/hotels/${id}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching hotel:', err);
        setError('Gagal memuat data hotel');
        setLoading(false);
      });
    
    // Fetch gallery data
    api.get('/gallery').then((res) => {
      // Filter gallery by hotel id
      const data = Array.isArray(res.data) ? res.data : [];
      const hotelGallery = data.filter(item => item.id_hotel == id);
      setGallery(hotelGallery);
    }).catch(() => setGallery([])).finally(() => setGalleryLoading(false));
  }, [id]);

  // Handle keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset'; // Restore scroll
    };
  }, [selectedImage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto">
        <div className="text-center">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hotel Tidak Ditemukan</h3>
            <p className="text-gray-500 mb-4">
              {error || 'Hotel yang Anda cari tidak ditemukan atau telah dihapus.'}
            </p>
            <Link to="/hotels" className="btn btn-primary">
              Kembali ke Daftar Hotel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Breadcrumb */}
      <div className="text-sm breadcrumbs mb-6">
        <ul>
          <li><Link to="/" className="link link-hover">Beranda</Link></li>
          <li><Link to="/hotels" className="link link-hover">Hotel</Link></li>
          <li className="text-gray-600">{data.nama_hotel}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hotel Image */}
          <div className="relative">
            {data.cover_image_url ? (
              <img 
                src={getImageUrl(data.cover_image_url)} 
                alt={data.nama_hotel}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbWJhciB0aWRhayBkYXBhdCBkaW11YXQ8L3RleHQ+PC9zdmc+';
                }}
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">Tidak ada gambar</p>
                </div>
              </div>
            )}
            <div className="absolute top-4 left-4">
              <div className="badge badge-primary badge-lg">Hotel</div>
            </div>
          </div>

          {/* Hotel Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{data.nama_hotel}</h1>
            <div className="flex items-center space-x-4 mb-4">
              {data.nama_kategori && (
                <div className="badge badge-outline badge-lg">{data.nama_kategori}</div>
              )}
              {(data.average_rating > 0) && (
                <div className="flex items-center space-x-2">
                  <RatingStars
                    rating={data.average_rating}
                    size="md"
                    showScore={true}
                  />
                  <span className="text-sm text-gray-600">
                    ({data.total_reviews} ulasan)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hotel Description */}
          {data.deskripsi && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-3">Deskripsi Hotel</h3>
              <div className="bg-gray-50 p-4 shadow rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {data.deskripsi}
                </p>
              </div>
            </div>
          )}

          {/* Map */}
          {data.peta_hotel && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-3">Peta Lokasi</h3>
              <div className="bg-gray-50 rounded-lg">
                <MapEmbed value={data.peta_hotel} title={`Peta ${data.nama_hotel}`} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Hotel Details Card */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <h3 className="card-title text-lg mb-4">Informasi Hotel</h3>
              
              {/* Room Price */}
              {data.harga_kamar && (
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Harga Kamar</p>
                    <p className="text-gray-600">{data.harga_kamar}</p>
                  </div>
                </div>
              )}

              {/* Phone */}
              {data.nomor_telepon && (
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Nomor Telepon</p>
                    <p className="text-gray-600">{data.nomor_telepon}</p>
                  </div>
                </div>
              )}

              {/* Website */}
              {data.website && (
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Website</p>
                    <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {data.website}
                    </a>
                  </div>
                </div>
              )}

              {/* Address */}
              {data.alamat_hotel && (
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Alamat</p>
                    <p className="text-gray-600 whitespace-pre-line">{data.alamat_hotel}</p>
                  </div>
                </div>
              )}

              {/* Facilities */}
              {data.fasilitas && (
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Fasilitas</p>
                    <p className="text-gray-600 whitespace-pre-line">{data.fasilitas}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link to="/hotels" className="btn btn-outline btn-block">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Daftar Hotel
            </Link>
            <Link to="/" className="btn btn-primary btn-block">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="space-y-6 mt-4">
        <h2 className="text-2xl font-bold text-gray-900">Galeri Foto</h2>
        {galleryLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : gallery.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Galeri</h3>
              <p className="text-gray-500">Saat ini belum ada foto galeri untuk hotel ini.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div 
                key={item.id_galeri} 
                className="group relative cursor-pointer"
                onClick={() => setSelectedImage(item)}
              >
                <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={getImageUrl(item.gambar)}
                    alt={item.keterangan || 'Galeri'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbWJhciB0aWRhayBkYXBhdCBkaW11YXQ8L3RleHQ+PC9zdmc+';
                    }}
                  />
                  
                  {/* Overlay dengan keterangan */}
                  {item.keterangan && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-sm font-medium line-clamp-2">
                          {item.keterangan}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="space-y-6 mt-8">
        <h2 className="text-2xl font-bold text-gray-900">Ulasan Pengunjung</h2>
        
        {/* Review Form */}
        <ReviewForm 
          hotelId={id} 
          onReviewSubmitted={() => setRefreshReviews(prev => prev + 1)}
        />
        
        {/* Review List */}
        <ReviewList 
          key={refreshReviews}
          hotelId={id} 
        />
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl font-bold"
            >
              ✕ Tutup
            </button>
            
            {/* Image */}
            <img
              src={getImageUrl(selectedImage.gambar)}
              alt={selectedImage.keterangan || 'Galeri'}
              className="max-w-full max-h-full object-contain rounded"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbWJhciB0aWRhayBkYXBhdCBkaW11YXQ8L3RleHQ+PC9zdmc+';
              }}
            />
            
            {/* Caption */}
            {selectedImage.keterangan && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b">
                <p className="text-center">{selectedImage.keterangan}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
