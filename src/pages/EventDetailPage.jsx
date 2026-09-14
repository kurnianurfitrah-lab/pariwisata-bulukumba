import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUrl.js';
import api from '../services/api.js';

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((res) => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching event:', err);
        setError('Gagal memuat data event');
        setLoading(false);
      });
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto">
        <div className="text-center">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Event Tidak Ditemukan</h3>
            <p className="text-gray-500 mb-4">
              {error || 'Event yang Anda cari tidak ditemukan atau telah dihapus.'}
            </p>
            <Link to="/events" className="btn btn-primary">
              Kembali ke Daftar Event
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
          <li><Link to="/events" className="link link-hover">Event</Link></li>
          <li className="text-gray-600">{event.nama_event}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Image */}
          <div className="relative">
            {event.gambar_event ? (
              <img 
                src={getImageUrl(event.gambar_event)} 
                alt={event.nama_event}
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
              <div className="badge badge-primary badge-lg">Event</div>
            </div>
          </div>

          {/* Event Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.nama_event}</h1>
          </div>

          {/* Event Description */}
          {event.deskripsi_event && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-3">Deskripsi Event</h3>
              <div className="bg-gray-50 p-4 p-4 shadow rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.deskripsi_event}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details Card */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <h3 className="card-title text-lg mb-4">Informasi Event</h3>
              
              {/* Venue */}
              {event.tempat && (
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Tempat</p>
                    <p className="text-gray-600">{event.tempat}</p>
                  </div>
                </div>
              )}

              {/* Start Date */}
              {event.tanggal_mulai && (
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Tanggal Mulai</p>
                    <p className="text-gray-600">{formatDate(event.tanggal_mulai)}</p>
                    <p className="text-sm text-gray-500">{formatTime(event.tanggal_mulai)}</p>
                  </div>
                </div>
              )}

              {/* End Date */}
              {event.tanggal_selesai && event.tanggal_selesai !== event.tanggal_mulai && (
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Tanggal Selesai</p>
                    <p className="text-gray-600">{formatDate(event.tanggal_selesai)}</p>
                    <p className="text-sm text-gray-500">{formatTime(event.tanggal_selesai)}</p>
                  </div>
                </div>
              )}

              {/* Event Status */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Status Event:</span>
                  {(() => {
                    const now = new Date();
                    const startDate = event.tanggal_mulai ? new Date(event.tanggal_mulai) : null;
                    const endDate = event.tanggal_selesai ? new Date(event.tanggal_selesai) : null;
                    
                    if (!startDate) {
                      return <span className="badge badge-warning">Tanggal belum ditentukan</span>;
                    }
                    
                    if (now < startDate) {
                      return <span className="badge badge-info">Akan Datang</span>;
                    } else if (endDate && now > endDate) {
                      return <span className="badge badge-error">Selesai</span>;
                    } else {
                      return <span className="badge badge-success">Sedang Berlangsung</span>;
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link to="/events" className="btn btn-outline btn-block">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Daftar Event
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
    </div>
  );
}
