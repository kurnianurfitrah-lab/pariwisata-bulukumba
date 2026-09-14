import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api.js';
import { Form, Button, Card, Alert } from '../../components';
import { getCategoryAddLink } from '../../utils/category.js';
import { normalizeWebsiteInput } from '../../utils/websiteUrl.js';

const emptyForm = {
  id_kategori: '',
  nama_restoran: '',
  deskripsi: '',
  harga_rata_rata: '',
  jam_operasional: '',
  alamat_restoran: '',
  nomor_telepon: '',
  website: '',
  menu_unggulan: '',
  peta_restoran: '',
  keterangan: '',
};

/**
 * ANCHOR: FormRestoran
 * Renders a dedicated page to create or edit a restoran (no modal usage).
 */
export default function FormRestoran() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingRestoran, setLoadingRestoran] = useState(isEditing);
  const [websiteError, setWebsiteError] = useState('');
  const hasCategories = categories.length > 0;

  // Fetch categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get('/admin/categories?entity_type=restoran');
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

  // Fetch restoran data if editing
  useEffect(() => {
    if (isEditing) {
      async function fetchRestoran() {
        try {
          const response = await api.get(`/admin/restorans/${id}`);
          const restoran = response.data;
          setForm({
            id_kategori: restoran.id_kategori?.toString() || '',
            nama_restoran: restoran.nama_restoran || '',
            deskripsi: restoran.deskripsi || '',
            harga_rata_rata: restoran.harga_rata_rata || '',
            jam_operasional: restoran.jam_operasional || '',
            alamat_restoran: restoran.alamat_restoran || '',
            nomor_telepon: restoran.nomor_telepon || '',
            website: restoran.website || '',
            menu_unggulan: restoran.menu_unggulan || '',
            peta_restoran: restoran.peta_restoran || '',
            keterangan: restoran.keterangan || '',
          });
        } catch (error) {
          console.error('Error fetching restoran:', error);
          toast.error('Gagal memuat data restoran');
        } finally {
          setLoadingRestoran(false);
        }
      }
      fetchRestoran();
    }
  }, [id, isEditing]);

  /**
   * ANCHOR: handleSubmit
   * Posts a new restoran or updates existing one and navigates back to listing.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    
    try {
      if (!hasCategories) {
        toast.error('Tambahkan kategori restoran terlebih dahulu');
        return;
      }

      const normalizedWebsite = normalizeWebsiteInput(form.website);
      const payload = {
        category_id: form.id_kategori ? Number(form.id_kategori) : null,
        name: form.nama_restoran.trim(),
        description: form.deskripsi,
        average_price: form.harga_rata_rata,
        operational_hours: form.jam_operasional,
        address: form.alamat_restoran,
        phone: form.nomor_telepon,
        website: normalizedWebsite,
        featured_menu: form.menu_unggulan,
        gmaps_iframe_url: form.peta_restoran,
        keterangan: form.keterangan,
      };

      setWebsiteError('');
      if (isEditing) {
        await api.put(`/admin/restorans/${id}`, payload);
        toast.success('Restoran berhasil diperbarui');
      } else {
        await api.post('/admin/restorans', payload);
        toast.success('Restoran berhasil ditambahkan');
      }

      navigate('/admin/restorans');
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const fallbackMessage = isEditing
        ? 'Gagal memperbarui restoran. Silakan coba lagi.'
        : 'Gagal menambahkan restoran. Silakan coba lagi.';

      if (serverMessage === 'Website restoran tidak valid') {
        setWebsiteError('Gunakan alamat website lengkap, misalnya restoran.com, atau kosongkan kolom ini.');
      }

      toast.error(serverMessage || fallbackMessage);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingRestoran) {
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
          {isEditing ? 'Edit Restoran' : 'Tambah Restoran'}
        </h1>
        <Link to="/admin/restorans" className="w-full sm:w-auto">
          <Button variant="ghost" className="w-full">Kembali</Button>
        </Link>
      </div>

      <Card className='p-4 sm:p-6'>
        {!loadingCategories && !hasCategories ? (
          <Alert.Warning title="Kategori restoran belum tersedia">
            <div className="space-y-3">
              <p>Tambahkan minimal satu kategori restoran sebelum membuat atau mengubah data restoran.</p>
              <Link to={getCategoryAddLink('restoran')}>
                <Button variant="warning" size="sm">Tambah Kategori Restoran</Button>
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
              label="Nama Restoran"
              placeholder="Masukkan nama restoran"
              value={form.nama_restoran}
              onChange={(e) => setForm({ ...form, nama_restoran: e.target.value })}
              required
            />
            
            <Form.Select
              label="Kategori"
              placeholder={loadingCategories ? "Memuat kategori..." : "Pilih kategori restoran"}
              value={form.id_kategori}
              onChange={(e) => setForm({ ...form, id_kategori: e.target.value })}
              options={categories.map((cat) => ({ value: cat.id_kategori, label: cat.nama_kategori }))}
              disabled={loadingCategories}
              helperText={!loadingCategories && !hasCategories ? 'Belum ada kategori restoran yang tersedia.' : undefined}
              required
            />

            <Form.Textarea
              label="Deskripsi"
              placeholder="Masukkan deskripsi restoran"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              rows={4}
            />
          </Form.Section>

          <Form.Section title="Informasi Harga & Operasional">
            <Form.Row>
              <Form.Input
                label="Harga Rata-rata"
                placeholder="Contoh: Rp 50.000 - 150.000"
                value={form.harga_rata_rata}
                onChange={(e) => setForm({ ...form, harga_rata_rata: e.target.value })}
              />
              <Form.Input
                label="Jam Operasional"
                placeholder="Contoh: 08:00 - 22:00"
                value={form.jam_operasional}
                onChange={(e) => setForm({ ...form, jam_operasional: e.target.value })}
              />
            </Form.Row>
            
            <Form.Input
              label="Nomor Telepon"
              placeholder="Contoh: +62 812-3456-7890"
              value={form.nomor_telepon}
              onChange={(e) => setForm({ ...form, nomor_telepon: e.target.value })}
            />
            
            <Form.Input
              label="Website"
              placeholder="Contoh: restoran.com"
              value={form.website}
              onChange={(e) => {
                setForm({ ...form, website: e.target.value });
                setWebsiteError('');
              }}
              onBlur={(e) => {
                const normalizedWebsite = normalizeWebsiteInput(e.target.value);
                setForm((currentForm) => ({
                  ...currentForm,
                  website: normalizedWebsite,
                }));
              }}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              error={websiteError}
              helperText="Opsional. Bisa ditulis tanpa https://; kosongkan jika restoran tidak punya website."
            />
          </Form.Section>

          <Form.Section title="Lokasi & Menu">
            <Form.Textarea
              label="Alamat Restoran"
              placeholder="Masukkan alamat lengkap restoran"
              value={form.alamat_restoran}
              onChange={(e) => setForm({ ...form, alamat_restoran: e.target.value })}
              rows={3}
            />
            
            <Form.Textarea
              label="Menu Unggulan"
              placeholder="Daftar menu andalan atau rekomendasi"
              value={form.menu_unggulan}
              onChange={(e) => setForm({ ...form, menu_unggulan: e.target.value })}
              rows={3}
              helperText="Contoh: Rendang Daging, Soto Makassar, Es Pisang Ijo"
            />
          </Form.Section>

          <Form.Section title="Media & Informasi Tambahan">
            <Form.Textarea
              label="Peta Restoran"
              placeholder="https://www.google.com/maps/embed?..."
              value={form.peta_restoran}
              onChange={(e) => setForm({ ...form, peta_restoran: e.target.value })}
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
