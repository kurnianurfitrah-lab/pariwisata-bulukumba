import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { DataTable, Button, Modal } from '../../components';

export default function ManageRestorans() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/admin/restorans').then((res) => setData(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { 
    load(); 
  }, []);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  async function handleDelete(id) {
    await api.delete(`/admin/restorans/${id}`);
    load();
    setShowDeleteModal(false);
    setSelectedItem(null);
  }

  function handleEdit(item) {
    navigate(`/admin/restorans/${item.id_restoran}/edit`);
  }

  function handleManageGallery(item) {
    navigate(`/admin/restorans/${item.id_restoran}/galleries`);
  }

  const columns = [
    { key: 'id_restoran', title: 'ID' },
    { key: 'nama_restoran', title: 'Nama Restoran' },
    { key: 'nama_kategori', title: 'Kategori' },
    { key: 'harga_rata_rata', title: 'Harga Rata-rata' },
    { key: 'nomor_telepon', title: 'Telepon' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Kelola Restoran</h1>
        <Link to="/admin/restorans/new" className="w-full sm:w-auto">
          <Button variant="soft" className='w-full'>Tambah</Button>
        </Link>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada restoran. Tambahkan data restoran setelah kategori restoran tersedia."
        onEdit={handleEdit}
        onDelete={(item) => {
          setSelectedItem(item);
          setShowDeleteModal(true);
        }}
        actions={[
          {
            label: 'Kelola Gambar',
            variant: 'info',
            handler: handleManageGallery
          }
        ]}
      />

      <Modal.Confirm
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
        onConfirm={() => handleDelete(selectedItem?.id_restoran)}
        title="Hapus Restoran"
        message={`Apakah Anda yakin ingin menghapus "${selectedItem?.nama_restoran}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="error"
      />
    </div>
  );
}
