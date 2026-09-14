import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

import HomePage from './pages/HomePage.jsx';
import AttractionsPage from './pages/AttractionsPage.jsx';
import AttractionDetailPage from './pages/AttractionDetailPage.jsx';
import HotelsPage from './pages/HotelsPage.jsx';
import HotelDetailPage from './pages/HotelDetailPage.jsx';
import RestoransPage from './pages/RestoransPage.jsx';
import RestoranDetailPage from './pages/RestoranDetailPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import EventDetailPage from './pages/EventDetailPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageAttractions from './pages/admin/ManageAttractions.jsx';
import FormAttraction from './pages/admin/FormAttraction.jsx';
import ManageHotels from './pages/admin/ManageHotels.jsx';
import FormHotel from './pages/admin/FormHotel.jsx';
import ManageRestorans from './pages/admin/ManageRestorans.jsx';
import FormRestoran from './pages/admin/FormRestoran.jsx';
import ManageGallery from './pages/admin/ManageGallery.jsx';
import FormGallery from './pages/admin/FormGallery.jsx';
import ManageCategories from './pages/admin/ManageCategories.jsx';
import FormCategory from './pages/admin/FormCategory.jsx';
import ManageEvents from './pages/admin/ManageEvents.jsx';
import FormEvent from './pages/admin/FormEvent.jsx';
import ManageReviews from './pages/admin/ManageReviews.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

/**
 * ANCHOR: App
 * Defines application routes and separates public/admin areas using layout components.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/attractions" element={<AttractionsPage />} />
        <Route path="/attractions/:id" element={<AttractionDetailPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/hotels/:id" element={<HotelDetailPage />} />
        <Route path="/restorans" element={<RestoransPage />} />
        <Route path="/restorans/:id" element={<RestoranDetailPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/attractions" element={<ManageAttractions />} />
        <Route path="/admin/attractions/new" element={<FormAttraction />} />
        <Route path="/admin/attractions/:id/edit" element={<FormAttraction />} />
        <Route path="/admin/attractions/:wisataId/galleries" element={<ManageGallery />} />
        <Route path="/admin/attractions/:wisataId/galleries/new" element={<FormGallery />} />
        <Route path="/admin/attractions/:wisataId/galleries/:id/edit" element={<FormGallery />} />
        <Route path="/admin/hotels" element={<ManageHotels />} />
        <Route path="/admin/hotels/new" element={<FormHotel />} />
        <Route path="/admin/hotels/:id/edit" element={<FormHotel />} />
        <Route path="/admin/hotels/:hotelId/galleries" element={<ManageGallery />} />
        <Route path="/admin/hotels/:hotelId/galleries/new" element={<FormGallery />} />
        <Route path="/admin/hotels/:hotelId/galleries/:id/edit" element={<FormGallery />} />
        <Route path="/admin/restorans" element={<ManageRestorans />} />
        <Route path="/admin/restorans/new" element={<FormRestoran />} />
        <Route path="/admin/restorans/:id/edit" element={<FormRestoran />} />
        <Route path="/admin/restorans/:restoranId/galleries" element={<ManageGallery />} />
        <Route path="/admin/restorans/:restoranId/galleries/new" element={<FormGallery />} />
        <Route path="/admin/restorans/:restoranId/galleries/:id/edit" element={<FormGallery />} />
        <Route path="/admin/categories" element={<ManageCategories />} />
        <Route path="/admin/categories/new" element={<FormCategory />} />
        <Route path="/admin/categories/:id/edit" element={<FormCategory />} />
        <Route path="/admin/events" element={<ManageEvents />} />
        <Route path="/admin/events/new" element={<FormEvent />} />
        <Route path="/admin/events/:id/edit" element={<FormEvent />} />
        <Route path="/admin/reviews" element={<ManageReviews />} />
      </Route>
      
      {/* Catch-all route for 404 errors */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}


