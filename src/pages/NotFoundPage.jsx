import { Link } from 'react-router-dom';
import { Button } from '../components/atoms';

/**
 * ANCHOR: NotFoundPage
 * Displays a 404 error page when users navigate to undefined routes
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* 404 Number */}
        <h1 className="text-8xl font-bold text-blue-600 mb-4">404</h1>
        
        {/* Error Message */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Halaman Tidak Ditemukan
        </h2>
        
        <p className="text-gray-600 mb-8">
          Halaman yang Anda cari tidak dapat ditemukan.
        </p>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <Link to="/">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Kembali ke Beranda
            </Button>
          </Link>
          
          <div>
            <button 
              onClick={() => window.history.back()}
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Kembali ke Halaman Sebelumnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
