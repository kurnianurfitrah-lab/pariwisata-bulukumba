import React, { useState } from 'react';
import api from '../services/api';
import RatingStars from './RatingStars';

const ReviewForm = ({ entityType, entityId, wisataId, hotelId, restoranId, onReviewSubmitted }) => {
  const [formData, setFormData] = useState({
    nama_reviewer: '',
    email_reviewer: '',
    rating: 5.0,
    komentar: ''
  });
  
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (newRating) => {
    setFormData(prev => ({
      ...prev,
      rating: newRating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    setSuccess(false);
    
    try {
      const payload = {
        ...formData
      };
      
      // Support new entityType/entityId pattern
      if (entityType && entityId) {
        if (entityType === 'wisata') {
          payload.id_wisata = entityId;
        } else if (entityType === 'hotel') {
          payload.id_hotel = entityId;
        } else if (entityType === 'restoran') {
          payload.id_restoran = entityId;
        }
      } else {
        // Support legacy direct props
        if (wisataId) {
          payload.id_wisata = wisataId;
        } else if (hotelId) {
          payload.id_hotel = hotelId;
        } else if (restoranId) {
          payload.id_restoran = restoranId;
        }
      }
      
      const response = await api.post('/reviews', payload);
      
      setSuccess(true);
      setFormData({
        nama_reviewer: '',
        email_reviewer: '',
        rating: 5.0,
        komentar: ''
      });
      
      // Callback untuk refresh review list
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors([error.response?.data?.message || 'Terjadi kesalahan']);
      }
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Tulis Ulasan</h3>
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Review berhasil ditambahkan!
        </div>
      )}
      
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <ul className="list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama *
          </label>
          <input
            type="text"
            name="nama_reviewer"
            value={formData.nama_reviewer}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan nama Anda"
            maxLength={150}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (Opsional)
          </label>
          <input
            type="email"
            name="email_reviewer"
            value={formData.email_reviewer}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan email Anda"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <RatingStars
            rating={formData.rating}
            size="xl"
            showScore={true}
            interactive={true}
            onRatingChange={handleRatingChange}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Komentar (Opsional)
          </label>
          <textarea
            name="komentar"
            value={formData.komentar}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Bagikan pengalaman Anda..."
            maxLength={1000}
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.komentar.length}/1000 karakter
          </div>
        </div>
        
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
