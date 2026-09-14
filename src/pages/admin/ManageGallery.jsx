import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api.js';
import { Button, Modal } from '../../components';
import { getImageUrl } from '../../utils/imageUrl.js';

export default function ManageGallery() {
  const navigate = useNavigate();
  const { wisataId, hotelId, restoranId } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityInfo, setEntityInfo] = useState(null);
  const [entityType, setEntityType] = useState(null);

  function load() {
    setLoading(true);
    // Load galleries filtered by entity ID
    api.get('/admin/galleries').then((res) => {
      let filteredData = [];
      if (wisataId) {
        filteredData = res.data.filter(item => item.id_wisata == wisataId);
      } else if (hotelId) {
        filteredData = res.data.filter(item => item.id_hotel == hotelId);
      } else if (restoranId) {
        filteredData = res.data.filter(item => item.id_restoran == restoranId);
      }
      setData(filteredData);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { 
    // Load entity info
    if (wisataId) {
      setEntityType('wisata');
      api.get(`/admin/attractions/${wisataId}`).then((res) => {
        setEntityInfo(res.data);
      }).catch(() => {
        // If wisata not found, redirect back
        navigate('/admin/attractions');
      });
    } else if (hotelId) {
      setEntityType('hotel');
      api.get(`/admin/hotels/${hotelId}`).then((res) => {
        setEntityInfo(res.data);
      }).catch(() => {
        // If hotel not found, redirect back
        navigate('/admin/hotels');
      });
    } else if (restoranId) {
      setEntityType('restoran');
      api.get(`/admin/restorans/${restoranId}`).then((res) => {
        setEntityInfo(res.data);
      }).catch(() => {
        // If restoran not found, redirect back
        navigate('/admin/restorans');
      });
    }
    
    load(); 
  }, [wisataId, hotelId, restoranId, navigate]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  async function handleDelete(id) {
    await api.delete(`/admin/galleries/${id}`);
    load();
    setShowDeleteModal(false);
    setSelectedItem(null);
  }

  function handleEdit(item) {
    if (wisataId) {
      navigate(`/admin/attractions/${wisataId}/galleries/${item.id_galeri}/edit`);
    } else if (hotelId) {
      navigate(`/admin/hotels/${hotelId}/galleries/${item.id_galeri}/edit`);
    } else if (restoranId) {
      navigate(`/admin/restorans/${restoranId}/galleries/${item.id_galeri}/edit`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(entityType === 'hotel' ? '/admin/hotels' : entityType === 'restoran' ? '/admin/restorans' : '/admin/attractions')}
            >
              ← Kembali
            </Button>
            <h1 className="text-2xl font-semibold">
              Galeri {entityInfo ? `${entityInfo.nama_wisata || entityInfo.nama_hotel || entityInfo.nama_restoran}` : ''}
            </h1>
          </div>
        </div>
        <Link to={
          wisataId ? `/admin/attractions/${wisataId}/galleries/new` : 
          hotelId ? `/admin/hotels/${hotelId}/galleries/new` :
          `/admin/restorans/${restoranId}/galleries/new`
        }>
          <Button variant="soft">Tambah Gambar</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-base-content/60">
          Tidak ada gambar ditemukan
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.map((item) => (
            <div key={item.id_galeri} className="group relative">
              <div className="aspect-square overflow-hidden rounded-lg border border-base-content/10 bg-base-200">
                <img
                  src={getImageUrl(item.gambar)}
                  alt={item.keterangan || 'Gambar'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbWJhciB0aWRhayBkYXBhdCBkaW11YXQ8L3RleHQ+PC9zdmc+';
                  }}
                />
                
                {/* Overlay dengan keterangan */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="text-white">
                      {item.nama && (
                        <p className="text-sm font-bold mb-1">{item.nama}</p>
                      )}
                      {item.keterangan && (
                        <p className="text-xs mb-1">{item.keterangan}</p>
                      )}
                      <p className="text-xs opacity-80">{item.nama_wisata || item.nama_hotel || item.nama_restoran}</p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn btn-warning btn-xs"
                      title="Edit"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowDeleteModal(true);
                      }}
                      className="btn btn-error btn-xs"
                      title="Hapus"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>


              </div>
            </div>
          ))}
        </div>
      )}

      <Modal.Confirm
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
        onConfirm={() => handleDelete(selectedItem?.id_galeri)}
        title="Hapus Gambar"
        message={`Apakah Anda yakin ingin menghapus gambar ini?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="error"
      />
    </div>
  );
}
