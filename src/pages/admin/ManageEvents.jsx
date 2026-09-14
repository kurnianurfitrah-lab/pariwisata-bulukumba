import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { DataTable, Button, Modal } from '../../components';

export default function ManageEvents() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/admin/events').then((res) => setData(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { 
    load(); 
  }, []);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/events/${id}`);
      load();
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      // You might want to show an error toast here
    }
  }

  function handleEdit(item) {
    navigate(`/admin/events/${item.id_event}/edit`);
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format date range for display
  function formatDateRange(startDate, endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    
    if (start === '-' && end === '-') return '-';
    if (start === '-') return `Sampai ${end}`;
    if (end === '-') return start;
    if (start === end) return start;
    
    return `${start} - ${end}`;
  }

  const columns = [
    { key: 'id_event', title: 'ID' },
    { key: 'nama_event', title: 'Nama Event' },
    { 
      key: 'tanggal_mulai', 
      title: 'Tanggal Event', 
      render: (value, row) => formatDateRange(value, row.tanggal_selesai)
    },
    { key: 'tempat', title: 'Tempat' },
    { 
      key: 'deskripsi_event', 
      title: 'Deskripsi',
      render: (value) => value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '-'
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kelola Event</h1>
        <Link to="/admin/events/new">
          <Button variant="soft">Tambah</Button>
        </Link>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
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
        onConfirm={() => handleDelete(selectedItem?.id_event)}
        title="Hapus Event"
        message={`Apakah Anda yakin ingin menghapus event "${selectedItem?.nama_event}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="error"
      />
    </div>
  );
}
