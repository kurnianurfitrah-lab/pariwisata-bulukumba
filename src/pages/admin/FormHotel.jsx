import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api.js';
import { Form, Button, Card, Alert } from '../../components';
import { getCategoryAddLink } from '../../utils/category.js';

const emptyForm = {
  id_kategori: '',
  nama_hotel: '',
  deskripsi: '',
  harga_kamar: '',
  alamat_hotel: '',
  nomor_telepon: '',
  website: '',
  fasilitas: '',
  peta_hotel: '',
  keterangan: '',
};

/**
 * ANCHOR: FormHotel
 * Renders a dedicated page to create or edit a hotel (no modal usage).
 */
export default function FormHotel() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingHotel, setLoadingHotel] = useState(isEditing);
  const hasCategories = categories.length > 0;

  // Fetch categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get('/admin/categories?entity_type=hotel');
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

  // Fetch hotel data if editing
  useEffect(() => {
    if (isEditing) {
      async function fetchHotel() {
        try {
          const response = await api.get(`/admin/hotels/${id}`);
          const hotel = response.data;
          setForm({
            id_kategori: hotel.id_kategori?.toString() || '',
            nama_hotel: hotel.nama_hotel || '',
            deskripsi: hotel.deskripsi || '',
            harga_kamar: hotel.harga_kamar || '',
            alamat_hotel: hotel.alamat_hotel || '',
            nomor_telepon: hotel.nomor_telepon || '',
            website: hotel.website || '',
            fasilitas: hotel.fasilitas || '',
            peta_hotel: hotel.peta_hotel || '',
            keterangan: hotel.keterangan || '',
          });
        } catch (error) {
          console.error('Error fetching hotel:', error);
          toast.error('Gagal memuat data hotel');
        } finally {
          setLoadingHotel(false);
        }
      }
      fetchHotel();
    }
  }, [id, isEditing]);

  /**
   * ANCHOR: handleSubmit
   * Posts a new hotel or updates existing one and navigates back to listing.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    
    try {
      if (!hasCategories) {
        toast.error('Tambahkan kategori hotel terlebih dahulu');
        return;
      }

      const payload = {
        category_id: form.id_kategori ? Number(form.id_kategori) : null,
        name: form.nama_hotel,
        description: form.deskripsi,
        room_price: form.harga_kamar,
        address: form.alamat_hotel,
        phone: form.nomor_telepon,
        website: form.website,
        facilities: form.fasilitas,
        gmaps_iframe_url: form.peta_hotel,
        keterangan: form.keterangan,
      };

      if (isEditing) {
        await api.put(`/admin/hotels/${id}`, payload);
        toast.success('Hotel berhasil diperbarui');
      } else {
        await api.post('/admin/hotels', payload);
        toast.success('Hotel berhasil ditambahkan');
      }

      navigate('/admin/hotels');
    } catch (error) {
      toast.error(isEditing ? 'Gagal memperbarui hotel. Silakan coba lagi.' : 'Gagal menambahkan hotel. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingHotel) {
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
          {isEditing ? 'Edit Hotel' : 'Tambah Hotel'}
        </h1>
        <Link to="/admin/hotels" className="w-full sm:w-auto">
          <Button variant="ghost" className="w-full">Kembali</Button>
        </Link>
      </div>

      <Card className='p-4 sm:p-6'>
        {!loadingCategories && !hasCategories ? (
          <Alert.Warning title="Kategori hotel belum tersedia">
            <div className="space-y-3">
              <p>Tambahkan minimal satu kategori hotel sebelum membuat atau mengubah data hotel.</p>
              <Link to={getCategoryAddLink('hotel')}>
                <Button variant="warning" size="sm">Tambah Kategori Hotel</Button>
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
              label="Nama Hotel"
              placeholder="Masukkan nama hotel"
              value={form.nama_hotel}
              onChange={(e) => setForm({ ...form, nama_hotel: e.target.value })}
              required
            />
            
            <Form.Select
              label="Kategori"
              placeholder={loadingCategories ? "Memuat kategori..." : "Pilih kategori hotel"}
              value={form.id_kategori}
              onChange={(e) => setForm({ ...form, id_kategori: e.target.value })}
              options={categories.map((cat) => ({ value: cat.id_kategori, label: cat.nama_kategori }))}
              disabled={loadingCategories}
              helperText={!loadingCategories && !hasCategories ? 'Belum ada kategori hotel yang tersedia.' : undefined}
              required
            />

            <Form.Textarea
              label="Deskripsi"
              placeholder="Masukkan deskripsi hotel"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              rows={4}
            />
          </Form.Section>

          <Form.Section title="Informasi Harga & Kontak">
            <Form.Row>
              <Form.Input
                label="Harga Kamar"
                placeholder="Contoh: Rp 500.000/malam"
                value={form.harga_kamar}
                onChange={(e) => setForm({ ...form, harga_kamar: e.target.value })}
              />
              <Form.Input
                label="Nomor Telepon"
                placeholder="Contoh: +62 812-3456-7890"
                value={form.nomor_telepon}
                onChange={(e) => setForm({ ...form, nomor_telepon: e.target.value })}
              />
            </Form.Row>
            
            <Form.Input
              label="Website"
              placeholder="Contoh: https://www.hotel.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </Form.Section>

          <Form.Section title="Lokasi & Fasilitas">
            <Form.Textarea
              label="Alamat Hotel"
              placeholder="Masukkan alamat lengkap hotel"
              value={form.alamat_hotel}
              onChange={(e) => setForm({ ...form, alamat_hotel: e.target.value })}
              rows={3}
            />
            
            <Form.Textarea
              label="Fasilitas"
              placeholder="Daftar fasilitas yang tersedia"
              value={form.fasilitas}
              onChange={(e) => setForm({ ...form, fasilitas: e.target.value })}
              rows={3}
            />
          </Form.Section>

          <Form.Section title="Media & Informasi Tambahan">
            <Form.Textarea
              label="Peta Hotel"
              placeholder="https://www.google.com/maps/embed?..."
              value={form.peta_hotel}
              onChange={(e) => setForm({ ...form, peta_hotel: e.target.value })}
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
