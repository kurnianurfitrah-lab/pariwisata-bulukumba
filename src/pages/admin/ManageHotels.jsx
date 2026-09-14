import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { DataTable, Button, Modal } from '../../components';

export default function ManageHotels() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/admin/hotels').then((res) => setData(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { 
    load(); 
  }, []);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  async function handleDelete(id) {
    await api.delete(`/admin/hotels/${id}`);
    load();
    setShowDeleteModal(false);
    setSelectedItem(null);
  }

  function handleEdit(item) {
    navigate(`/admin/hotels/${item.id_hotel}/edit`);
  }

  function handleManageGallery(item) {
    navigate(`/admin/hotels/${item.id_hotel}/galleries`);
  }

  const columns = [
    { key: 'id_hotel', title: 'ID' },
    { key: 'nama_hotel', title: 'Nama Hotel' },
    { key: 'nama_kategori', title: 'Kategori' },
    { key: 'harga_kamar', title: 'Harga Kamar' },
    { key: 'nomor_telepon', title: 'Telepon' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Kelola Hotel</h1>
        <Link to="/admin/hotels/new" className="w-full sm:w-auto">
          <Button variant="soft" className='w-full'>Tambah</Button>
        </Link>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada hotel. Tambahkan data hotel setelah kategori hotel tersedia."
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
        onConfirm={() => handleDelete(selectedItem?.id_hotel)}
        title="Hapus Hotel"
        message={`Apakah Anda yakin ingin menghapus "${selectedItem?.nama_hotel}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="error"
      />
    </div>
  );
}
