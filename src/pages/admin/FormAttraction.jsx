import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api.js';
import { Form, Button, Card, Alert } from '../../components';
import { getCategoryAddLink } from '../../utils/category.js';

const emptyForm = {
  id_kategori: '',
  nama_wisata: '',
  deskripsi: '',
  harga_tiket: '',
  jam_operasional: '',
  fasilitas: '',
  peta_wisata: '',
  keterangan: '',
};

/**
 * ANCHOR: FormAttraction
 * Renders a dedicated page to create or edit an attraction (no modal usage).
 */
export default function FormAttraction() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingAttraction, setLoadingAttraction] = useState(isEditing);
  const hasCategories = categories.length > 0;

  // Fetch categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get('/admin/categories?entity_type=wisata');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Gagal memuat kategori');
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  // Fetch attraction data if editing
  useEffect(() => {
    if (isEditing) {
      async function fetchAttraction() {
        try {
          const response = await api.get(`/admin/attractions/${id}`);
          const attraction = response.data;
          setForm({
            id_kategori: attraction.id_kategori?.toString() || '',
            nama_wisata: attraction.nama_wisata || '',
            deskripsi: attraction.deskripsi || '',
            harga_tiket: attraction.harga_tiket || '',
            jam_operasional: attraction.jam_operasional || '',
            fasilitas: attraction.fasilitas || '',
            peta_wisata: attraction.peta_wisata || '',
            keterangan: attraction.keterangan || '',
          });
        } catch (error) {
          console.error('Error fetching attraction:', error);
          toast.error('Gagal memuat data objek wisata');
        } finally {
          setLoadingAttraction(false);
        }
      }
      fetchAttraction();
    }
  }, [id, isEditing]);

  /**
   * ANCHOR: handleSubmit
   * Posts a new attraction or updates existing one and navigates back to listing.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    
    try {
      if (!hasCategories) {
        toast.error('Tambahkan kategori objek wisata terlebih dahulu');
        return;
      }

      const payload = {
        category_id: form.id_kategori ? Number(form.id_kategori) : null,
        name: form.nama_wisata,
        description: form.deskripsi,
        ticket_price: form.harga_tiket,
        operational_hours: form.jam_operasional,
        facilities: form.fasilitas,
        gmaps_iframe_url: form.peta_wisata,
        keterangan: form.keterangan,
      };

      if (isEditing) {
        await api.put(`/admin/attractions/${id}`, payload);
        toast.success('Objek wisata berhasil diperbarui');
      } else {
        await api.post('/admin/attractions', payload);
        toast.success('Objek wisata berhasil ditambahkan');
      }

      navigate('/admin/attractions');
    } catch (error) {
      toast.error(isEditing ? 'Gagal memperbarui objek wisata. Silakan coba lagi.' : 'Gagal menambahkan objek wisata. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingAttraction) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">
          {isEditing ? 'Edit Objek Wisata' : 'Tambah Objek Wisata'}
        </h1>
        <Link to="/admin/attractions" className="w-full sm:w-auto">
          <Button variant="ghost" className="w-full">Kembali</Button>
        </Link>
      </div>

      <Card className='p-4 sm:p-6'>
        {!loadingCategories && !hasCategories ? (
          <Alert.Warning title="Kategori objek wisata belum tersedia">
            <div className="space-y-3">
              <p>Tambahkan minimal satu kategori objek wisata sebelum membuat atau mengubah data wisata.</p>
              <Link to={getCategoryAddLink('wisata')}>
                <Button variant="warning" size="sm">Tambah Kategori Objek Wisata</Button>
              </Link>
            </div>
          </Alert.Warning>
        ) : null}

        <Form
          onSubmit={handleSubmit}
          loading={submitting}
          submitDisabled={!hasCategories}
          submitText={isEditing ? "Update" : "Simpan"}
        >
          <Form.Section title="Informasi Dasar">
            <Form.Input
              label="Nama Objek Wisata"
              placeholder="Masukkan nama objek wisata"
              value={form.nama_wisata}
              onChange={(e) => setForm({ ...form, nama_wisata: e.target.value })}
              required
            />
            
            <Form.Select
              label="Kategori"
              placeholder={loadingCategories ? "Memuat kategori..." : "Pilih kategori objek wisata"}
              value={form.id_kategori}
              onChange={(e) => setForm({ ...form, id_kategori: e.target.value })}
              options={categories.map((cat) => ({ value: cat.id_kategori, label: cat.nama_kategori }))}
              disabled={loadingCategories}
              helperText={!loadingCategories && !hasCategories ? 'Belum ada kategori objek wisata yang tersedia.' : undefined}
              required
            />

            
            <Form.Textarea
              label="Deskripsi"
              placeholder="Masukkan deskripsi objek wisata"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              rows={4}
            />
          </Form.Section>

          <Form.Section title="Informasi Tiket & Operasional">
            <Form.Row>
              <Form.Input
                label="Harga Tiket"
                placeholder="Contoh: Rp 50.000"
                value={form.harga_tiket}
                onChange={(e) => setForm({ ...form, harga_tiket: e.target.value })}
              />
              <Form.Input
                label="Jam Operasional"
                placeholder="Contoh: 08:00 - 17:00"
                value={form.jam_operasional}
                onChange={(e) => setForm({ ...form, jam_operasional: e.target.value })}
              />
            </Form.Row>
          </Form.Section>

          <Form.Section title="Fasilitas & Media">
            <Form.Textarea
              label="Fasilitas"
              placeholder="Daftar fasilitas yang tersedia"
              value={form.fasilitas}
              onChange={(e) => setForm({ ...form, fasilitas: e.target.value })}
              rows={3}
            />
            
            <Form.Textarea
              label="Peta Wisata"
              placeholder="https://www.google.com/maps/embed?..."
              value={form.peta_wisata}
              onChange={(e) => setForm({ ...form, peta_wisata: e.target.value })}
              rows={4}
              helperText="Masukkan URL pada atribut src dari menu Embed a map di Google Maps."
            />
            
            <Form.Textarea
              label="Keterangan"
              placeholder="Informasi tambahan atau catatan khusus"
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              rows={3}
              helperText="Informasi tambahan yang ingin ditampilkan"
            />
          </Form.Section>
        </Form>
      </Card>
    </div>
  );
}

