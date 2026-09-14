import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { getImageUrl } from '../utils/imageUrl.js';
import ReviewForm from '../components/ReviewForm.jsx';
import ReviewList from '../components/ReviewList.jsx';
import RatingStars from '../components/RatingStars.jsx';
import MapEmbed from '../components/MapEmbed.jsx';

export default function RestoranDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshReviews, setRefreshReviews] = useState(0);

  useEffect(() => {
    // Fetch restoran data
    api.get(`/restorans/${id}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching restoran:', err);
        setError('Gagal memuat data restoran');
        setLoading(false);
      });
    
    // Fetch gallery data
    api.get('/gallery').then((res) => {
      // Filter gallery by restoran id
      const data = Array.isArray(res.data) ? res.data : [];
      const restoranGallery = data.filter(item => item.id_restoran == id);
      setGallery(restoranGallery);
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
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  const handleReviewSubmitted = () => {
    setRefreshReviews(prev => prev + 1);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const nextImage = () => {
    const currentIndex = gallery.findIndex(img => img.id_galeri === selectedImage.id_galeri);
    const nextIndex = (currentIndex + 1) % gallery.length;
    setSelectedImage(gallery[nextIndex]);
  };

  const prevImage = () => {
    const currentIndex = gallery.findIndex(img => img.id_galeri === selectedImage.id_galeri);
    const prevIndex = (currentIndex - 1 + gallery.length) % gallery.length;
    setSelectedImage(gallery[prevIndex]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-gray-600">Memuat data restoran...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restoran Tidak Ditemukan</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link to="/restorans" className="btn btn-primary">
          ← Kembali ke Daftar Restoran
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restoran Tidak Ditemukan</h1>
        <p className="text-gray-600 mb-6">Restoran yang Anda cari tidak tersedia.</p>
        <Link to="/restorans" className="btn btn-primary">
          ← Kembali ke Daftar Restoran
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Breadcrumb */}
      <div className="text-sm breadcrumbs mb-6">
        <ul>
          <li><Link to="/" className="link link-hover">Beranda</Link></li>
          <li><Link to="/restorans" className="link link-hover">Restoran</Link></li>
          <li className="text-gray-600">{data.nama_restoran}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restoran Image */}
          <div className="relative">
            {data.cover_image_url ? (
              <img 
                src={getImageUrl(data.cover_image_url)} 
                alt={data.nama_restoran}
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
              <div className="badge badge-accent badge-lg">Restoran</div>
            </div>
          </div>

          {/* Restoran Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{data.nama_restoran}</h1>
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

          {/* Restoran Description */}
          {data.deskripsi && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-3">Deskripsi Restoran</h3>
              <div className="bg-gray-50 p-4 shadow rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {data.deskripsi}
                </p>
              </div>
            </div>
          )}

          {/* Featured Menu */}
          {data.menu_unggulan && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-3">Menu Unggulan</h3>
              <div className="bg-gray-50 p-4 shadow rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {data.menu_unggulan}
                </p>
              </div>
            </div>
          )}

          {/* Map */}
          {data.peta_restoran && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-3">Peta Lokasi</h3>
              <div className="bg-gray-50 rounded-lg">
                <MapEmbed value={data.peta_restoran} title={`Peta ${data.nama_restoran}`} />
              </div>
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title text-lg">Informasi Restoran</h3>
              <div className="space-y-4">
                {data.harga_rata_rata && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Harga Rata-rata</p>
                      <p className="text-gray-600">{data.harga_rata_rata}</p>
                    </div>
                  </div>
                )}
                
                {data.jam_operasional && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Jam Operasional</p>
                      <p className="text-gray-600 whitespace-pre-line">{data.jam_operasional}</p>
                    </div>
                  </div>
                )}

                {data.nomor_telepon && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Telepon</p>
                      <p className="text-gray-600">
                        <a href={`tel:${data.nomor_telepon}`} className="link">
                          {data.nomor_telepon}
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {data.alamat_restoran && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Alamat</p>
                      <p className="text-gray-600">{data.alamat_restoran}</p>
                    </div>
                  </div>
                )}

                {data.website && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Website</p>
                      <p className="text-gray-600">
                        <a 
                          href={data.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="link"
                        >
                          Kunjungi Website
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                {data.keterangan && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Informasi Tambahan</p>
                      <p className="text-gray-600 whitespace-pre-line">{data.keterangan}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link to="/restorans" className="btn btn-outline btn-block">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Daftar Restoran
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Galeri</h3>
              <p className="text-gray-500">Saat ini belum ada foto galeri untuk restoran ini.</p>
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
                <div className="aspect-square overflow-hidden rounded-lg">
                  <img
                    src={getImageUrl(item.gambar)}
                    alt={item.nama || 'Foto restoran'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbWJhciB0aWRhayBkYXBhdCBkaW11YXQ8L3RleHQ+PC9zdmc+';
                    }}
                  />
                  {item.keterangan && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-end">
                      <div className="p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
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
          entityType="restoran" 
          entityId={id} 
          onReviewSubmitted={handleReviewSubmitted}
        />
        
        {/* Review List */}
        <ReviewList 
          entityType="restoran" 
          entityId={id} 
          refreshTrigger={refreshReviews}
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
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {gallery.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            <img
              src={getImageUrl(selectedImage.gambar)}
              alt={selectedImage.nama || 'Foto restoran'}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbWJhciB0aWRhayBkYXBhdCBkaW11YXQ8L3RleHQ+PC9zdmc+';
              }}
            />
            
            {selectedImage.nama && (
              <div className="absolute bottom-4 left-4 right-4 text-white bg-black bg-opacity-50 rounded p-2">
                <p className="text-sm font-medium">{selectedImage.nama}</p>
                {selectedImage.keterangan && (
                  <p className="text-xs opacity-80">{selectedImage.keterangan}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
