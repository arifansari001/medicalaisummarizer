import { useEffect, useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import BookAppointmentModal from '../components/BookAppointmentModal';

// Safe Leaflet icon helper
function getLeafletIcon(iconUrl: string) {
  try {
    if (typeof window !== 'undefined' && L && L.Icon) {
      return new L.Icon({
        iconUrl,
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });
    }
  } catch (e) {
    console.warn('Leaflet icon creation failed', e);
  }
  return undefined;
}

const RED_ICON = getLeafletIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png');
const BLUE_ICON = getLeafletIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png');

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  rating: number;
  consultationFee: number;
  clinicName: string;
  distanceKm: number | null;
  location?: { lat: number; lng: number; address: string };
  opdSchedule?: { day: string; startTime: string; endTime: string; avgWaitMinutes: number }[];
}

const SPECIALTIES = [
  'all', 'Cardiology', 'Nephrology', 'General Medicine',
  'Orthopedics', 'Pediatrics', 'Gynecology', 'Dermatology', 'Neurology', 'Endocrinology'
];

// Pure Leaflet Map Component (100% immune to react-leaflet _leaflet_events bugs)
function PureDoctorMap({ doctors, selectedDoctor, onSelectDoctor, userCoords }: {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  onSelectDoctor: (doc: Doctor) => void;
  userCoords: { lat: number; lng: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapInstanceRef.current) {
      try {
        const map = L.map(containerRef.current).setView([26.85, 80.95], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        mapInstanceRef.current = map;
        markerGroupRef.current = L.layerGroup().addTo(map);
      } catch (e) {
        console.warn('Map initialization exception', e);
      }
    }

    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup) return;

    // Safely clear previous markers
    try {
      markerGroup.clearLayers();
    } catch (e) {
      // Ignore cleanup error
    }

    // Add user marker if available
    if (userCoords && BLUE_ICON) {
      try {
        L.marker([userCoords.lat, userCoords.lng], { icon: BLUE_ICON })
          .addTo(markerGroup)
          .bindPopup('<strong>You are here</strong>');
        map.setView([userCoords.lat, userCoords.lng], 13);
      } catch (e) {}
    }

    // Add doctor markers
    doctors.forEach((doc) => {
      if (doc.location && typeof doc.location.lat === 'number' && typeof doc.location.lng === 'number' && !isNaN(doc.location.lat) && !isNaN(doc.location.lng)) {
        try {
          const isSelected = selectedDoctor?._id === doc._id;
          const markerOptions: L.MarkerOptions = {};
          if (isSelected && RED_ICON) {
            markerOptions.icon = RED_ICON;
          }

          const marker = L.marker([doc.location.lat, doc.location.lng], markerOptions).addTo(markerGroup);

          const popupContent = `
            <div style="min-width: 150px; font-family: sans-serif;">
              <strong style="color: #0f172a;">${doc.name || 'Doctor'}</strong><br/>
              <span style="font-size: 12px; color: #64748b;">${doc.specialty || ''}</span><br/>
              <span style="font-size: 12px; color: #0891b2;">⭐ ${(doc.rating || 5).toFixed(1)} • ₹${doc.consultationFee || 500}</span><br/>
              <span style="font-size: 11px; color: #94a3b8;">${doc.location.address || ''}</span>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.on('click', () => onSelectDoctor(doc));
        } catch (e) {
          console.warn('Error placing marker', e);
        }
      }
    });

  }, [doctors, selectedDoctor, userCoords, onSelectDoctor]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
        markerGroupRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '480px' }} />;
}

export default function DoctorDirectoryPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState('all');
  const [sort, setSort] = useState<'rating' | 'distance'>('rating');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { specialty, sort };
      if (userCoords) {
        params.lat = String(userCoords.lat);
        params.lng = String(userCoords.lng);
      }
      const res = await api.get('/doctors', { params });
      setDoctors(res.data?.doctors || []);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  }, [specialty, sort, userCoords]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const requestLocation = () => {
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setSort('distance');
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied')
    );
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#f59e0b' : '#d1d5db', fontSize: '14px' }}>★</span>
    ));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          👨‍⚕️ Doctor Directory
        </h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
          Find qualified specialists near you. Data is seeded mock data for demonstration.
        </p>
      </div>

      {/* Controls Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        {/* Specialty Filter */}
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          style={{
            padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
            fontSize: '14px', background: '#f8fafc', cursor: 'pointer', minWidth: '180px'
          }}
        >
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Specialties' : s}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'rating' | 'distance')}
          style={{
            padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
            fontSize: '14px', background: '#f8fafc', cursor: 'pointer'
          }}
        >
          <option value="rating">Sort: Best Rated</option>
          <option value="distance" disabled={!userCoords}>Sort: Nearest First {!userCoords ? '(share location)' : ''}</option>
        </select>

        {/* Location button */}
        {locationStatus !== 'granted' && (
          <button
            onClick={requestLocation}
            disabled={locationStatus === 'loading'}
            style={{
              padding: '9px 16px',
              background: locationStatus === 'denied' ? '#fee2e2' : 'linear-gradient(135deg, #0891b2, #6366f1)',
              color: locationStatus === 'denied' ? '#b91c1c' : 'white',
              border: 'none', borderRadius: '8px', fontWeight: 600,
              fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            {locationStatus === 'loading' ? '📡 Getting location...' :
              locationStatus === 'denied' ? '❌ Location denied' : '📍 Use My Location'}
          </button>
        )}
        {locationStatus === 'granted' && (
          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
            ✅ Location active — showing distance
          </span>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b' }}>
          {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Split layout: Map + List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', minHeight: '520px' }}>
        {/* Map */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', background: '#f8fafc' }}>
          <PureDoctorMap
            doctors={doctors}
            selectedDoctor={selectedDoctor}
            onSelectDoctor={(doc) => setSelectedDoctor(doc)}
            userCoords={userCoords}
          />
        </div>

        {/* Doctor List */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '10px',
          overflowY: 'auto', maxHeight: '520px', paddingRight: '4px'
        }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card" style={{ height: '100px', background: '#f8fafc', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))
          ) : doctors.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px' }}>🔍</div>
              <p style={{ color: '#64748b', marginTop: '8px' }}>No doctors found for this specialty.</p>
            </div>
          ) : doctors.map((doc) => (
            <div
              key={doc._id}
              onClick={() => setSelectedDoctor(doc === selectedDoctor ? null : doc)}
              style={{
                background: selectedDoctor?._id === doc._id ? '#ecfeff' : '#fff',
                border: `1.5px solid ${selectedDoctor?._id === doc._id ? '#0891b2' : '#e2e8f0'}`,
                borderRadius: '10px',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #0891b2, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '15px'
                }}>
                  {(doc.name || 'Doctor').split(' ').filter((w: string) => w !== 'Dr.' && w !== 'Mock')[0]?.charAt(0) || 'D'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{doc.clinicName}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <div>{renderStars(doc.rating)}</div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{doc.rating?.toFixed(1)}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: '#0891b2', fontSize: '13px' }}>₹{doc.consultationFee}</div>
                  {doc.distanceKm !== null && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>📍 {doc.distanceKm} km</div>
                  )}
                </div>
              </div>

              {/* Expanded Detail */}
              {selectedDoctor?._id === doc._id && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0f2fe' }}>
                  <div style={{ fontSize: '12px', color: '#334155', marginBottom: '6px', fontWeight: 600 }}>
                    🗓 OPD Schedule
                  </div>
                  {doc.opdSchedule && doc.opdSchedule.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {doc.opdSchedule.map((slot: any, i: number) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: '12px', color: '#64748b',
                          background: '#f8fafc', borderRadius: '6px', padding: '6px 10px'
                        }}>
                          <span style={{ fontWeight: 600 }}>{slot.day}</span>
                          <span>{slot.startTime} – {slot.endTime}</span>
                          <span style={{ color: '#f59e0b' }}>~{slot.avgWaitMinutes} min wait</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>Schedule not available.</p>
                  )}
                  <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
                    📍 {doc.location?.address}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setBookingDoctor(doc); }}
                    style={{
                      width: '100%', padding: '10px', marginTop: '12px', background: 'linear-gradient(135deg, #0891b2, #6366f1)',
                      color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    Book Appointment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {bookingDoctor && (
        <BookAppointmentModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
        />
      )}
    </div>
  );
}
