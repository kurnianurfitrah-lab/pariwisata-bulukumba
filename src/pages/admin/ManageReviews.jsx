import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RatingStars from '../../components/RatingStars';
import toast from 'react-hot-toast';

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const loadReviews = async (page = 1, status = '', type = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        limit: 10
      });
      
      if (status) {
        params.append('status', status);
      }
      
      if (type) {
        params.append('type', type);
      }
      
      const response = await api.get(`/admin/reviews?${params}`);
      setReviews(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(currentPage, statusFilter, typeFilter);
  }, [currentPage, statusFilter, typeFilter]);

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      setUpdatingStatus(reviewId);
      await api.put(`/admin/reviews/${reviewId}/status`, { status: newStatus });
      
      // Refresh the list
      await loadReviews(currentPage, statusFilter, typeFilter);
      
      // Show success message using toast
      toast.success(`Review berhasil ${newStatus === 'approved' ? 'disetujui' : 'ditolak'}`);
    } catch (error) {
      console.error('Error updating review status:', error);
      toast.error('Gagal mengupdate status review');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'badge-warning', text: 'Menunggu' },
      approved: { color: 'badge-success', text: 'Disetujui' },
      rejected: { color: 'badge-error', text: 'Ditolak' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`badge ${config.color}`}>{config.text}</span>;
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      wisata: { color: 'badge-info', text: 'Wisata' },
      hotel: { color: 'badge-primary', text: 'Hotel' },
      restoran: { color: 'badge-accent', text: 'Restoran' }
    };
    
    const config = typeConfig[type] || typeConfig.wisata;
    return <span className={`badge ${config.color}`}>{config.text}</span>;
  };

  const getEntityName = (review) => {
    if (review.review_type === 'hotel') {
      return review.nama_hotel || 'Hotel tidak ditemukan';
    } else if (review.review_type === 'restoran') {
      return review.nama_restoran || 'Restoran tidak ditemukan';
    } else {
      return review.nama_wisata || 'Wisata tidak ditemukan';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kelola Ulasan</h1>
        
        {/* Filters */}
        <div className="flex space-x-4">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select select-bordered"
          >
            <option value="">Semua Jenis</option>
            <option value="wisata">Wisata</option>
            <option value="hotel">Hotel</option>
            <option value="restoran">Restoran</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select select-bordered"
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Jenis</th>
                <th>Nama Tempat</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Komentar</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    Tidak ada ulasan yang ditemukan
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id_review}>
                    <td>
                      {getTypeBadge(review.review_type)}
                    </td>
                    <td>
                      <div className="font-medium">{getEntityName(review)}</div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">{review.nama_reviewer}</div>
                        {review.email_reviewer && (
                          <div className="text-sm text-gray-500">{review.email_reviewer}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <RatingStars
                        rating={review.rating}
                        size="sm"
                        showScore={true}
                      />
                    </td>
                    <td>
                      <div className="max-w-xs">
                        {review.komentar ? (
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {review.komentar}
                          </p>
                        ) : (
                          <span className="text-sm text-gray-500">Tidak ada komentar</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(review.status)}
                    </td>
                    <td>
                      <div className="text-sm text-gray-500">
                        {formatDate(review.created_at)}
                      </div>
                    </td>
                    <td>
                      {review.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusChange(review.id_review, 'approved')}
                            disabled={updatingStatus === review.id_review}
                            className="btn btn-success btn-sm"
                          >
                            {updatingStatus === review.id_review ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              '✓'
                            )}
                          </button>
                          <button
                            onClick={() => handleStatusChange(review.id_review, 'rejected')}
                            disabled={updatingStatus === review.id_review}
                            className="btn btn-error btn-sm"
                          >
                            {updatingStatus === review.id_review ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              '✕'
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="join">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="join-item btn"
            >
              «
            </button>
            
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`join-item btn ${currentPage === page ? 'btn-active' : ''}`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="join-item btn"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 text-sm text-gray-600">
        Menampilkan {reviews.length} dari {pagination.total} ulasan
      </div>
    </div>
  );
};

export default ManageReviews;
