import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api.js';
import { Form, Button, Card } from '../../components';
import { getImageUrl } from '../../utils/imageUrl.js';

const emptyForm = {
  nama_event: '',
  deskripsi_event: '',
  tempat: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
  gambar_event: '',
};

/**
 * ANCHOR: FormEvent
 * Renders a dedicated page to create or edit an event (no modal usage).
 */
export default function FormEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(isEditing);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Fetch event data if editing
  useEffect(() => {
    if (isEditing) {
      async function fetchEvent() {
        try {
          const response = await api.get(`/admin/events/${id}`);
          const event = response.data;
          setForm({
            nama_event: event.nama_event || '',
            deskripsi_event: event.deskripsi_event || '',
            tempat: event.tempat || '',
            tanggal_mulai: event.tanggal_mulai ? event.tanggal_mulai.split('T')[0] : '',
            tanggal_selesai: event.tanggal_selesai ? event.tanggal_selesai.split('T')[0] : '',
            gambar_event: event.gambar_event || '',
          });
          
          // Set preview URL for existing image
          if (event.gambar_event) {
            setPreviewUrl(getImageUrl(event.gambar_event));
          }
        } catch (error) {
          console.error('Error fetching event:', error);
          toast.error('Gagal memuat data event');
        } finally {
          setLoadingEvent(false);
        }
      }
      fetchEvent();
    }
  }, [id, isEditing]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Mohon pilih file gambar yang valid (JPG, PNG, GIF, WEBP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  /**
   * ANCHOR: handleSubmit
   * Posts a new event or updates existing one and navigates back to listing.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    
    try {
      let imageUrl = form.gambar_event;

      // If new file is selected, upload it first
      if (selectedFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', selectedFile);
        
        const uploadResponse = await api.post('/admin/upload-image', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        imageUrl = uploadResponse.data.url;
      }

      const payload = {
        name: form.nama_event,
        description: form.deskripsi_event,
        location: form.tempat,
        event_date: form.tanggal_mulai,
        end_date: form.tanggal_selesai,
        image_url: imageUrl,
      };

      if (isEditing) {
        await api.put(`/admin/events/${id}`, payload);
        toast.success('Event berhasil diperbarui');
      } else {
        await api.post('/admin/events', payload);
        toast.success('Event berhasil ditambahkan');
      }

      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(isEditing ? 'Gagal memperbarui event. Silakan coba lagi.' : 'Gagal menambahkan event. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingEvent) {
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isEditing ? 'Edit Event' : 'Tambah Event'}
        </h1>
        <Link to="/admin/events">
          <Button variant="ghost">Kembali</Button>
        </Link>
      </div>

      <Card>
        <Form onSubmit={handleSubmit} loading={submitting} submitText={isEditing ? "Update" : "Simpan"}>
          <Form.Section title="Informasi Event">
            <Form.Input
              label="Nama Event"
              placeholder="Masukkan nama event"
              value={form.nama_event}
              onChange={(e) => setForm({ ...form, nama_event: e.target.value })}
              required
            />
            
            <Form.Textarea
              label="Deskripsi Event"
              placeholder="Masukkan deskripsi event"
              value={form.deskripsi_event}
              onChange={(e) => setForm({ ...form, deskripsi_event: e.target.value })}
              rows={4}
              helperText="Deskripsi lengkap tentang event ini"
            />

            <Form.Input
              label="Tempat"
              placeholder="Masukkan lokasi event"
              value={form.tempat}
              onChange={(e) => setForm({ ...form, tempat: e.target.value })}
              helperText="Lokasi atau tempat dilaksanakannya event"
            />

            <Form.Input
              label="Tanggal Mulai Event"
              type="date"
              value={form.tanggal_mulai}
              onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
              helperText="Tanggal mulai pelaksanaan event"
            />

            <Form.Input
              label="Tanggal Selesai Event"
              type="date"
              value={form.tanggal_selesai}
              onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
              helperText="Tanggal selesai pelaksanaan event (opsional untuk event 1 hari)"
            />

            <div>
              <label className="label">
                <span className="label-text">Gambar Event</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input file-input-bordered w-full"
                required={!isEditing}
              />
              <div className="label">
                <span className="label-text-alt">
                  Format: JPG, PNG, GIF, WEBP (Maksimal 5MB)
                  {isEditing && ' • Kosongkan jika tidak ingin mengubah gambar'}
                </span>
              </div>
              
              {previewUrl && (
                <div className="mt-3">
                  <p className="text-sm text-base-content/60 mb-2">Preview:</p>
                  <div className="relative w-full max-w-xs">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-base-content/10"
                    />
                    {selectedFile && (
                      <div className="mt-2 text-xs text-base-content/60">
                        <p>File: {selectedFile.name}</p>
                        <p>Ukuran: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Form.Section>
        </Form>
      </Card>
    </div>
  );
}
