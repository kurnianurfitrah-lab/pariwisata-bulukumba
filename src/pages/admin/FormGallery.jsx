import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api.js';
import { Button, Input, Textarea } from '../../components';
import { getImageUrl } from '../../utils/imageUrl.js';

export default function FormGallery() {
  const navigate = useNavigate();
  const { id, wisataId, hotelId, restoranId } = useParams();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(false);
  const [entityInfo, setEntityInfo] = useState(null);
  const [entityType, setEntityType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    gambar: '',
    keterangan: '',
    nama: '',
    id_wisata: wisataId || null,
    id_hotel: hotelId || null,
    id_restoran: restoranId || null
  });

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

    // Load gallery data if editing
    if (isEdit) {
      api.get(`/admin/galleries/${id}`).then((res) => {
        setFormData(res.data);
        // Set preview URL for existing image
        if (res.data.gambar) {
          setPreviewUrl(getImageUrl(res.data.gambar));
        }
      });
    }
  }, [id, isEdit, wisataId, hotelId, restoranId, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Mohon pilih file gambar yang valid (JPG, PNG, GIF, WEBP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.gambar;

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

      const submitData = {
        ...formData,
        gambar: imageUrl
      };

      if (isEdit) {
        await api.put(`/admin/galleries/${id}`, submitData);
      } else {
        await api.post('/admin/galleries', submitData);
      }
      
      // Navigate back to gallery list
      if (wisataId) {
        navigate(`/admin/attractions/${wisataId}/galleries`);
      } else if (hotelId) {
        navigate(`/admin/hotels/${hotelId}/galleries`);
      } else if (restoranId) {
        navigate(`/admin/restorans/${restoranId}/galleries`);
      }
    } catch (error) {
      console.error('Error saving gallery:', error);
      alert('Terjadi kesalahan saat menyimpan gambar');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(
              wisataId ? `/admin/attractions/${wisataId}/galleries` :
              hotelId ? `/admin/hotels/${hotelId}/galleries` :
              `/admin/restorans/${restoranId}/galleries`
            )}
          >
            ← Kembali
          </Button>
          <h1 className="text-2xl font-semibold">
            {isEdit ? 'Edit Gambar' : 'Tambah Gambar'}
          </h1>
        </div>
        {entityInfo && (
          <p className="text-sm text-base-content/60">
            {entityInfo.nama_wisata || entityInfo.nama_hotel || entityInfo.nama_restoran}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text">Nama Gambar</span>
          </label>
          <Input
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            placeholder="Masukkan nama gambar"
          />
        </div>

        <div>
          <label className="label">
            <span className="label-text">File Gambar</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input file-input-bordered w-full"
            required={!isEdit}
          />
          <div className="label">
            <span className="label-text-alt">
              Format: JPG, PNG, GIF, WEBP (Maksimal 5MB)
              {isEdit && ' • Kosongkan jika tidak ingin mengubah gambar'}
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

        <div>
          <label className="label">
            <span className="label-text">Keterangan</span>
          </label>
          <Textarea
            name="keterangan"
            value={formData.keterangan}
            onChange={handleChange}
            placeholder="Masukkan keterangan gambar"
            rows={3}
          />
        </div>

        {/* Hidden fields for entity ID since it's determined by the route */}
        <input type="hidden" name="id_wisata" value={formData.id_wisata} />
        <input type="hidden" name="id_hotel" value={formData.id_hotel} />

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (wisataId) {
                navigate(`/admin/attractions/${wisataId}/galleries`);
              } else if (hotelId) {
                navigate(`/admin/hotels/${hotelId}/galleries`);
              }
            }}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {isEdit ? 'Update' : 'Simpan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
