import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import AttractionCard from '../components/AttractionCard.jsx';
import HotelCard from '../components/HotelCard.jsx';
import EventCard from '../components/EventCard.jsx';
import heroImage from '../assets/bg.jpg';

export default function HomePage() {
  const [attractions, setAttractions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/attractions').catch(() => null),
      api.get('/hotels').catch(() => null),
      api.get('/events').catch(() => null),
    ]).then(([aRes, hRes, eRes]) => {
      if (aRes) setAttractions(Array.isArray(aRes.data) ? aRes.data.slice(0, 6) : []);
      if (hRes) setHotels(Array.isArray(hRes.data) ? hRes.data.slice(0, 6) : []);
      if (eRes) setEvents(Array.isArray(eRes.data) ? eRes.data.slice(0, 3) : []);
    });
  }, []);

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Hero Section with Background Image */}
      <section 
        className="relative min-h-[80vh] md:min-h-screen flex items-center justify-center text-center rounded-2xl md:rounded-3xl overflow-hidden "
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4 md:px-6 z-10 relative">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight px-2">
              Selamat Datang di Pariwisata Bulukumba
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl opacity-90 leading-relaxed px-4 max-w-3xl mx-auto">
              Jelajahi keindahan alam, budaya, dan destinasi menarik di Bulukumba
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mt-6 md:mt-8 px-4">
              <Link 
                to="/attractions" 
                className="btn btn-primary btn-lg text-white px-6 md:px-8 py-3 rounded-full hover:scale-105 transition-transform text-sm md:text-base"
              >
                Jelajahi Destinasi
              </Link>
              <Link 
                to="/hotels" 
                className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-black px-6 md:px-8 py-3 rounded-full hover:scale-105 transition-transform text-sm md:text-base"
              >
                Cari Hotel
              </Link>
              <Link 
                to="/events" 
                className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-black px-6 md:px-8 py-3 rounded-full hover:scale-105 transition-transform text-sm md:text-base"
              >
                Lihat Event
              </Link>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Destinasi Unggulan Section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold">Destinasi Unggulan</h2>
          <Link to="/attractions" className="link link-primary text-sm md:text-base">Lihat semua</Link>
        </div>
        {attractions?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {attractions?.map((a) => (
              <AttractionCard key={a.id_wisata} attraction={a} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12">
            <div className="max-w-md mx-auto px-4">
              <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Belum Ada Destinasi</h3>
              <p className="text-sm md:text-base text-gray-500 mb-4">Saat ini belum ada destinasi wisata yang tersedia. Silakan cek kembali nanti.</p>
              <Link to="/attractions" className="btn btn-primary text-sm md:text-base">
                Lihat Semua Destinasi
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Hotel & Penginapan Section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold">Hotel & Penginapan</h2>
          <Link to="/hotels" className="link link-primary text-sm md:text-base">Lihat semua</Link>
        </div>
        {hotels?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {hotels?.map((h) => (
              <HotelCard key={h.id_hotel} hotel={h} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12">
            <div className="max-w-md mx-auto px-4">
              <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Belum Ada Hotel</h3>
              <p className="text-sm md:text-base text-gray-500 mb-4">Saat ini belum ada hotel yang tersedia. Silakan cek kembali nanti.</p>
              <Link to="/hotels" className="btn btn-primary text-sm md:text-base">
                Lihat Semua Hotel
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Event Terbaru Section */}
      <section className="px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold">Event Terbaru</h2>
          <Link to="/events" className="link link-primary text-sm md:text-base">Lihat semua</Link>
        </div>
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {events.map((e) => (
              <EventCard key={e.id_event} event={e} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12">
            <div className="max-w-md mx-auto px-4">
              <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Belum Ada Event</h3>
              <p className="text-sm md:text-base text-gray-500 mb-4">Saat ini belum ada event yang tersedia. Silakan cek kembali nanti.</p>
              <Link to="/events" className="btn btn-primary text-sm md:text-base">
                Lihat Semua Event
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}


