import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { DataTable, Button, Modal } from '../../components';
import { getCategoryEntityLabel } from '../../utils/category.js';

export default function ManageCategories() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/admin/categories').then((res) => setData(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { 
    load(); 
  }, []);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/categories/${id}`);
      load();
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      // You might want to show an error toast here
    }
  }

  function handleEdit(item) {
    navigate(`/admin/categories/${item.id_kategori}/edit`);
  }

  const columns = [
    { key: 'id_kategori', title: 'ID' },
    { key: 'nama_kategori', title: 'Nama Kategori' },
    {
      key: 'entity_type',
      title: 'Tipe',
      render: (_value, item) => getCategoryEntityLabel(item.entity_type),
    },
    { key: 'deskripsi', title: 'Deskripsi' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kelola Kategori</h1>
        <Link to="/admin/categories/new">
          <Button variant="soft">Tambah</Button>
        </Link>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada kategori. Tambahkan kategori untuk objek wisata, hotel, atau restoran."
        onEdit={handleEdit}
        onDelete={(item) => {
          setSelectedItem(item);
          setShowDeleteModal(true);
        }}
      />

      <Modal.Confirm
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
        onConfirm={() => handleDelete(selectedItem?.id_kategori)}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${selectedItem?.nama_kategori}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="error"
      />
    </div>
  );
}
