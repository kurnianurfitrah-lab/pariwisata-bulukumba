import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { DataTable, Button, Modal } from '../../components';

export default function ManageAttractions() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/admin/attractions').then((res) => setData(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { 
    load(); 
  }, []);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  async function handleDelete(id) {
    await api.delete(`/admin/attractions/${id}`);
    load();
    setShowDeleteModal(false);
    setSelectedItem(null);
  }

  function handleEdit(item) {
    navigate(`/admin/attractions/${item.id_wisata}/edit`);
  }

  function handleManageGallery(item) {
    navigate(`/admin/attractions/${item.id_wisata}/galleries`);
  }

  const columns = [
    { key: 'id_wisata', title: 'ID' },
    { key: 'nama_wisata', title: 'Nama Wisata' },
    { key: 'nama_kategori', title: 'Kategori' },
    { key: 'harga_tiket', title: 'Harga Tiket' },
    { key: 'jam_operasional', title: 'Jam Operasional' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Kelola Objek Wisata</h1>
        <Link to="/admin/attractions/new" className="w-full sm:w-auto">
          <Button variant="soft" className='w-full'>Tambah</Button>
        </Link>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada objek wisata. Tambahkan data wisata setelah kategori objek wisata tersedia."
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
        onConfirm={() => handleDelete(selectedItem?.id_wisata)}
        title="Hapus Objek Wisata"
        message={`Apakah Anda yakin ingin menghapus "${selectedItem?.nama_wisata}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="error"
      />
    </div>
  );
}

