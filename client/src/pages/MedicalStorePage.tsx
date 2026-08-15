import { useState, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import polyline from '@mapbox/polyline';

function getLeafletIcon(iconUrl: string) {
  try {
    if (typeof window !== 'undefined' && L && L.Icon) {
      return new L.Icon({
        iconUrl,
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      });
    }
  } catch (e) {
    console.warn(e);
  }
  return undefined;
}

const PHARMACY_ICON = getLeafletIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png');
const BLOOD_ICON = getLeafletIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png');
const DIAGNOSTIC_ICON = getLeafletIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png');
const USER_ICON = getLeafletIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png');

interface Store {
  _id: string;
  name: string;
  type: 'pharmacy' | 'blood_bank' | 'diagnostic_center';
  location: { lat: number; lng: number; address: string };
  phone?: string;
  openHours?: string;
  medicineInventory?: string[];
  bloodGroups?: string[];
  diagnosticTests?: { name: string; price: number; turnaroundTime: string }[];
  distanceKm: number | null;
}

function PureStoreMap({ stores, selectedStore, onSelectStore, userCoords, routeCoords }: {
  stores: Store[];
  selectedStore: Store | null;
  onSelectStore: (s: Store) => void;
  userCoords: { lat: number; lng: number } | null;
  routeCoords: [number, number][] | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

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
        console.warn('Map store init error', e);
      }
    }

    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup) return;

    try {
      markerGroup.clearLayers();
    } catch (e) {}

    if (userCoords && USER_ICON) {
      try {
        L.marker([userCoords.lat, userCoords.lng], { icon: USER_ICON })
          .addTo(markerGroup)
          .bindPopup('<strong>You are here</strong>');
        map.setView([userCoords.lat, userCoords.lng], 13);
      } catch (e) {}
    }

    stores.forEach((s) => {
      if (s.location && typeof s.location.lat === 'number' && typeof s.location.lng === 'number' && !isNaN(s.location.lat) && !isNaN(s.location.lng)) {
        try {
          const icon = s.type === 'pharmacy' ? PHARMACY_ICON : s.type === 'blood_bank' ? BLOOD_ICON : DIAGNOSTIC_ICON;
          const marker = L.marker([s.location.lat, s.location.lng], {
            icon: icon || undefined
          }).addTo(markerGroup);

          marker.bindPopup(`
            <div style="min-width: 150px; font-family: sans-serif;">
              <strong style="color: #0f172a;">${s.name || ''}</strong><br/>
              <span style="font-size: 12px; color: #0891b2;">${s.type === 'pharmacy' ? '💊 Pharmacy' : s.type === 'blood_bank' ? '🩸 Blood Bank' : '🔬 Diagnostic Center'}</span><br/>
              <span style="font-size: 11px; color: #64748b;">${s.location.address || ''}</span><br/>
              ${s.phone ? `<span style="font-size: 11px; color: #475569;">📞 ${s.phone}</span>` : ''}
            </div>
          `);

          marker.on('click', () => onSelectStore(s));
        } catch (e) {}
      }
    });

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeCoords && routeCoords.length > 0) {
      try {
        const pline = L.polyline(routeCoords, { color: '#6366f1', weight: 5, opacity: 0.8 }).addTo(map);
        routeLayerRef.current = pline;
        map.fitBounds(pline.getBounds(), { padding: [40, 40] });
      } catch (e) {}
    }

  }, [stores, selectedStore, userCoords, onSelectStore, routeCoords]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
        markerGroupRef.current = null;
        routeLayerRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '480px' }} />;
}

export default function MedicalStorePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'all' | 'pharmacy' | 'blood_bank' | 'diagnostic_center'>('all');
  const [query, setQuery] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeStats, setRouteStats] = useState<{ distance: string; duration: string } | null>(null);
  const [routing, setRouting] = useState(false);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { type };
      if (query) params.query = query;
      if (userCoords) { params.lat = String(userCoords.lat); params.lng = String(userCoords.lng); }
      const res = await api.get('/stores', { params });
      setStores(res.data.stores);
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    } finally {
      setLoading(false);
    }
  }, [type, query, userCoords]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const requestLocation = () => {
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied')
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputVal);
  };

  const getDirections = async (store: Store) => {
    if (!userCoords) {
      alert('Please enable location (click "Near Me") to get directions.');
      return;
    }
    setRouting(true);
    setRouteCoords(null);
    setRouteStats(null);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userCoords.lng},${userCoords.lat};${store.location.lng},${store.location.lat}?overview=full`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coords = polyline.decode(route.geometry);
        setRouteCoords(coords as [number, number][]);
        
        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.ceil(route.duration / 60);
        setRouteStats({ distance: `${distKm} km`, duration: `${durMin} min` });
      } else {
        alert('Could not calculate a route.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to get directions.');
    } finally {
      setRouting(false);
    }
  };

  const mapCenter: [number, number] = userCoords ? [userCoords.lat, userCoords.lng] : [26.85, 80.95];

  const bloodGroupColors: Record<string, string> = {
    'A+': '#ef4444', 'A-': '#f87171', 'B+': '#3b82f6', 'B-': '#60a5fa',
    'AB+': '#8b5cf6', 'AB-': '#a78bfa', 'O+': '#10b981', 'O-': '#34d399'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          💊 Medical Stores & Blood Banks
        </h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
          Search for medicines, pharmacies, and blood banks near you.{' '}
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>All data is seeded mock data for demonstration.</span>
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        {/* Type filter */}
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
          {(['all', 'pharmacy', 'blood_bank', 'diagnostic_center'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              background: type === t ? '#0891b2' : '#f8fafc',
              color: type === t ? 'white' : '#64748b',
            }}>
              {t === 'all' ? '🏪 All' : t === 'pharmacy' ? '💊 Pharmacies' : t === 'blood_bank' ? '🩸 Blood Banks' : '🔬 Diagnostics'}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={type === 'blood_bank' ? 'Search blood group (e.g. O+)...' : type === 'diagnostic_center' ? 'Search test name (e.g. MRI)...' : 'Search medicine name...'}
            style={{
              flex: 1, padding: '9px 14px', borderRadius: '8px',
              border: '1.5px solid #e2e8f0', fontSize: '14px'
            }}
          />
          <button type="submit" style={{
            padding: '9px 16px', background: 'linear-gradient(135deg, #0891b2, #6366f1)',
            color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
          }}>Search</button>
          {query && <button type="button" onClick={() => { setQuery(''); setInputVal(''); }} style={{
            padding: '9px 12px', background: '#fee2e2', color: '#b91c1c',
            border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
          }}>✕</button>}
        </form>

        {/* Location */}
        {locationStatus !== 'granted' ? (
          <button onClick={requestLocation} disabled={locationStatus === 'loading'} style={{
            padding: '9px 16px',
            background: locationStatus === 'denied' ? '#fee2e2' : 'linear-gradient(135deg, #0891b2, #6366f1)',
            color: locationStatus === 'denied' ? '#b91c1c' : 'white',
            border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
          }}>
            {locationStatus === 'loading' ? '📡 Locating...' : locationStatus === 'denied' ? '❌ Location denied' : '📍 Near Me'}
          </button>
        ) : (
          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>✅ Sorted by distance</span>
        )}

        <span style={{ fontSize: '13px', color: '#64748b', marginLeft: 'auto' }}>
          {stores.length} result{stores.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }}>
        <span>🟢 Pharmacy</span>
        <span>🔴 Blood Bank</span>
        <span>🟣 Diagnostic Center</span>
        <span>🔵 Your Location</span>
      </div>

      {/* Split layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', minHeight: '520px' }}>
        {/* Map */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <PureStoreMap
            stores={stores}
            selectedStore={selectedStore}
            onSelectStore={(s) => setSelectedStore(s)}
            userCoords={userCoords}
            routeCoords={routeCoords}
          />
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '520px', paddingRight: '4px' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: '90px', borderRadius: '10px', background: '#f8fafc' }} />
            ))
          ) : stores.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px' }}>{type === 'blood_bank' ? '🩸' : '💊'}</div>
              <p style={{ color: '#64748b', marginTop: '8px' }}>No results found. Try a different search.</p>
            </div>
          ) : stores.map((store) => (
            <div key={store._id} 
              style={{
                background: selectedStore?._id === store._id ? (store.type === 'pharmacy' ? '#f0fdf4' : store.type === 'blood_bank' ? '#fff1f2' : '#faf5ff') : '#fff',
                border: `1.5px solid ${selectedStore?._id === store._id ? (store.type === 'pharmacy' ? '#10b981' : store.type === 'blood_bank' ? '#ef4444' : '#a855f7') : '#e2e8f0'}`,
                borderRadius: '10px', padding: '14px', transition: 'all 0.2s'
              }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                onClick={() => setSelectedStore(store === selectedStore ? null : store)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{store.type === 'pharmacy' ? '💊' : store.type === 'blood_bank' ? '🩸' : '🔬'}</span>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{store.name}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>📍 {store.location.address}</div>
                  {store.phone && <div style={{ fontSize: '11px', color: '#94a3b8' }}>📞 {store.phone}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {store.distanceKm !== null && (
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#0891b2' }}>{store.distanceKm} km</div>
                  )}
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{store.openHours}</div>
                </div>
              </div>

              {/* Expanded */}
              {selectedStore?._id === store._id && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  {store.type === 'pharmacy' && store.medicineInventory && store.medicineInventory.length > 0 && (
                    <>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>In Stock (Mock Inventory):</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {store.medicineInventory.map((med, i) => (
                          <span key={i} style={{
                            background: query && med.toLowerCase().includes(query.toLowerCase()) ? '#dcfce7' : '#f1f5f9',
                            border: query && med.toLowerCase().includes(query.toLowerCase()) ? '1px solid #10b981' : '1px solid #e2e8f0',
                            padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600
                          }}>{med}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {store.type === 'blood_bank' && store.bloodGroups && store.bloodGroups.length > 0 && (
                    <>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Available Blood Groups (Mock):</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {store.bloodGroups.map((bg, i) => (
                          <span key={i} style={{
                            background: bloodGroupColors[bg] || '#94a3b8', color: 'white',
                            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700
                          }}>{bg}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {store.type === 'diagnostic_center' && store.diagnosticTests && store.diagnosticTests.length > 0 && (
                    <>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Available Tests:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {store.diagnosticTests.map((t, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: query && t.name.toLowerCase().includes(query.toLowerCase()) ? '#faf5ff' : '#f8fafc',
                            border: query && t.name.toLowerCase().includes(query.toLowerCase()) ? '1px solid #d8b4fe' : '1px solid #e2e8f0',
                            padding: '8px 12px', borderRadius: '8px',
                          }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{t.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>⏱ TAT: {t.turnaroundTime}</div>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7' }}>
                              ₹{t.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); getDirections(store); }}
                      disabled={routing}
                      style={{
                        padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px',
                        fontSize: '13px', fontWeight: 600, cursor: routing ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {routing ? 'Calculating...' : '🗺️ Get Directions'}
                    </button>
                    {routeStats && routeCoords && selectedStore?._id === store._id && (
                      <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>
                        🚗 {routeStats.duration} ({routeStats.distance}) via driving
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
