import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { Alert } from '../../components';
import { CATEGORY_ENTITY_TYPES, getCategoryAddLink, getCategoryEntityLabel } from '../../utils/category.js';

export default function AdminDashboard() {
  const [categoryStatus, setCategoryStatus] = useState({});
  const [loadingCategoryStatus, setLoadingCategoryStatus] = useState(true);

  useEffect(() => {
    Promise.all(
      CATEGORY_ENTITY_TYPES.map((entityType) =>
        api.get(`/admin/categories?entity_type=${entityType}`).then((response) => ({
          entityType,
          count: Array.isArray(response.data) ? response.data.length : 0,
        })).catch(() => ({
          entityType,
          count: 0,
        }))
      )
    ).then((results) => {
      setCategoryStatus(
        results.reduce((accumulator, item) => ({
          ...accumulator,
          [item.entityType]: item.count,
        }), {})
      );
      setLoadingCategoryStatus(false);
    });
  }, []);

  const missingCategoryTypes = CATEGORY_ENTITY_TYPES.filter(
    (entityType) => categoryStatus[entityType] === 0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dasbor Admin</h1>

      {loadingCategoryStatus ? (
        <Alert.Info title="Memeriksa master kategori">
          Sedang memuat status kategori untuk objek wisata, hotel, dan restoran.
        </Alert.Info>
      ) : missingCategoryTypes.length > 0 ? (
        <Alert.Warning title="Master kategori belum lengkap">
          <div className="space-y-3">
            <p>
              Kategori masih kosong untuk: {missingCategoryTypes.map((entityType) => getCategoryEntityLabel(entityType)).join(', ')}.
            </p>
            <div className="flex flex-wrap gap-2">
              {missingCategoryTypes.map((entityType) => (
                <Link key={entityType} className="btn btn-warning btn-sm" to={getCategoryAddLink(entityType)}>
                  Tambah Kategori {getCategoryEntityLabel(entityType)}
                </Link>
              ))}
            </div>
          </div>
        </Alert.Warning>
      ) : (
        <Alert.Success title="Master kategori siap dipakai">
          Semua tipe konten sudah punya kategori awal, jadi form admin siap digunakan.
        </Alert.Success>
      )}
      
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700">Kelola Konten</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link className="btn btn-outline" to="/admin/attractions">Kelola Objek Wisata</Link>
          <Link className="btn btn-outline" to="/admin/hotels">Kelola Hotel</Link>
          <Link className="btn btn-outline" to="/admin/restorans">Kelola Restoran</Link>
          <Link className="btn btn-outline" to="/admin/categories">Kelola Kategori</Link>
          <Link className="btn btn-outline" to="/admin/events">Kelola Event</Link>
          <Link className="btn btn-outline" to="/admin/reviews">Kelola Review</Link>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700">Pratinjau Publik</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link className="btn btn-outline" to="/events">Lihat Event Publik</Link>
          <Link className="btn btn-outline" to="/gallery">Lihat Galeri Publik</Link>
          <Link className="btn btn-outline" to="/">Kembali ke Website</Link>
        </div>
      </div>
    </div>
  );
}
