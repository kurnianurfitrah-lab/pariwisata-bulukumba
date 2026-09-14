import React, { useState, useEffect } from 'react';
import api from '../services/api';
import RatingStars from './RatingStars';

const ReviewList = ({ entityType, entityId, wisataId, hotelId, restoranId, refreshTrigger }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const loadReviews = async (page = 1) => {
    try {
      setLoading(true);
      let endpoint = '';
      
      // Support new entityType/entityId pattern
      if (entityType && entityId) {
        if (entityType === 'wisata') {
          endpoint = `/reviews/wisata/${entityId}`;
        } else if (entityType === 'hotel') {
          endpoint = `/reviews/hotel/${entityId}`;
        } else if (entityType === 'restoran') {
          endpoint = `/reviews/restoran/${entityId}`;
        }
      } else {
        // Support legacy direct props
        if (wisataId) {
          endpoint = `/reviews/wisata/${wisataId}`;
        } else if (hotelId) {
          endpoint = `/reviews/hotel/${hotelId}`;
        } else if (restoranId) {
          endpoint = `/reviews/restoran/${restoranId}`;
        }
      }
      
      if (!endpoint) return;
      
      const response = await api.get(`${endpoint}?page=${page}&limit=10`);
      setReviews(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [entityType, entityId, wisataId, hotelId, restoranId, refreshTrigger]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadReviews(page);
  };



  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-200 pb-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">
        Ulasan Pengunjung ({pagination.total || 0})
      </h3>
      
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Belum ada ulasan untuk {hotelId ? 'hotel' : 'wisata'} ini.</p>
          <p className="text-sm">Jadilah yang pertama memberikan ulasan!</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id_review} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <RatingStars
                    rating={review.rating}
                    size="md"
                    showScore={true}
                  />
                  <span className="text-xs text-gray-500">
                    {formatDate(review.created_at)}
                  </span>
                </div>
                
                <h4 className="font-medium text-gray-900 mb-1">
                  {review.nama_reviewer}
                </h4>
                
                {review.komentar && (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {review.komentar}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm border rounded ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewList;
