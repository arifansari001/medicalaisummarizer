import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  description: string;
  isPrescriptionRequired: boolean;
  inStock: boolean;
  image: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface TestBooking {
  centerId: string;
  testName: string;
  price: number;
}

const CATEGORIES = [
  { key: '', label: '🏷️ All Products', color: '#14B8A6' },
  { key: 'Skin Care', label: '✨ Skin Care', color: '#FF8B6B' },
  { key: 'Baby Care', label: '👶 Baby Care', color: '#A8E6CF' },
  { key: 'Sexual Wellness', label: '🌷 Wellness', color: '#C084FC' },
  { key: 'Ayurveda', label: '🌿 Ayurveda', color: '#86EFAC' },
  { key: 'Multivitamins', label: '💊 Vitamins', color: '#FCD34D' },
  { key: 'Prescription Medicines', label: '🩺 Rx Medicines', color: '#60A5FA' },
];

const DISCOUNT_PERCENT = (price: number, mrp: number) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

// ─────────────────────────────────────────────────────────────────────────────
// Cart Drawer
// ─────────────────────────────────────────────────────────────────────────────
function CartDrawer({
  open,
  onClose,
  cartItems,
  onRemove,
  onQtyChange,
  onCheckout,
  checkingOut,
}: {
  open: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemove: (id: string) => void;
  onQtyChange: (id: string, qty: number) => void;
  onCheckout: () => void;
  checkingOut: boolean;
}) {
  const total = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const hasPrescription = cartItems.some(i => i.product.isPrescriptionRequired);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,42,46,0.55)',
          zIndex: 1000, opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.3s ease',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px',
        background: '#fff',
        boxShadow: '-8px 0 40px rgba(20,184,166,0.12)',
        zIndex: 1001,
        transform: open ? 'translateX(0)' : 'translateX(110%)',
        transition: 'transform 0.38s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: '1px solid #f0fafa',
          background: 'linear-gradient(135deg, #0F2A2E 0%, #134e4a 100%)',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '20px', fontWeight: 700 }}>
                🛒 Your Cart
              </div>
              <div style={{ fontSize: '13px', color: '#A8E6CF', marginTop: '2px' }}>
                {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}>✕</button>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>🛒</div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '16px', fontWeight: 600, color: '#64748b' }}>
                Your cart is empty
              </div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>Browse our products and add items!</div>
            </div>
          ) : cartItems.map(item => {
            const disc = DISCOUNT_PERCENT(item.product.price, item.product.mrp);
            return (
              <div key={item.product._id} style={{
                display: 'flex', gap: '12px', padding: '14px',
                background: item.product.isPrescriptionRequired ? '#eff6ff' : '#f8fffe',
                borderRadius: '14px',
                border: `1px solid ${item.product.isPrescriptionRequired ? '#bfdbfe' : '#ccfbf1'}`,
                transition: 'transform 0.18s ease',
              }}>
                <img src={item.product.image} alt={item.product.name} style={{
                  width: '64px', height: '64px', objectFit: 'cover',
                  borderRadius: '10px', flexShrink: 0, background: '#f0f9ff',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.3, marginBottom: '4px' }}>
                    {item.product.name}
                  </div>
                  {item.product.isPrescriptionRequired && (
                    <span style={{ fontSize: '10px', fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', borderRadius: '8px', padding: '2px 7px' }}>
                      Rx Required
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#0F2A2E', fontSize: '15px' }}>₹{item.product.price}</span>
                    {disc > 0 && <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{item.product.mrp}</span>}
                    {disc > 0 && <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>{disc}% OFF</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccfbf1', borderRadius: '8px', overflow: 'hidden' }}>
                      <button onClick={() => onQtyChange(item.product._id, Math.max(1, item.quantity - 1))} style={{
                        width: '28px', height: '28px', border: 'none', background: 'transparent',
                        cursor: 'pointer', fontSize: '16px', color: '#14B8A6', fontWeight: 700,
                      }}>−</button>
                      <span style={{ padding: '0 10px', fontWeight: 700, fontSize: '14px', color: '#1E293B' }}>{item.quantity}</span>
                      <button onClick={() => onQtyChange(item.product._id, item.quantity + 1)} style={{
                        width: '28px', height: '28px', border: 'none', background: 'transparent',
                        cursor: 'pointer', fontSize: '16px', color: '#14B8A6', fontWeight: 700,
                      }}>+</button>
                    </div>
                    <button onClick={() => onRemove(item.product._id)} style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      color: '#ef4444', fontSize: '13px', fontWeight: 600,
                    }}>Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div style={{ padding: '20px', borderTop: '1px solid #f0fafa' }}>
            {hasPrescription && (
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px',
                padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#1d4ed8', fontWeight: 500,
              }}>
                ℹ️ Some items require a prescription. You'll link a report at checkout.
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: '#64748B', fontWeight: 500 }}>Order Total</span>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '22px', fontWeight: 700, color: '#0F2A2E' }}>₹{total.toFixed(2)}</span>
            </div>
            <button
              onClick={onCheckout}
              disabled={checkingOut}
              style={{
                width: '100%', padding: '14px',
                background: checkingOut ? '#94a3b8' : 'linear-gradient(135deg, #14B8A6, #0F2A2E)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px', fontWeight: 700,
                cursor: checkingOut ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease', letterSpacing: '0.3px',
                boxShadow: checkingOut ? 'none' : '0 4px 20px rgba(20,184,166,0.4)',
              }}
            >
              {checkingOut ? '⏳ Placing Order...' : '🛍️ Place Order (COD)'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Card
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, added }: { product: Product; onAdd: (p: Product) => void; added: boolean }) {
  const [hover, setHover] = useState(false);
  const disc = DISCOUNT_PERCENT(product.price, product.mrp);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff',
        borderRadius: '18px',
        boxShadow: hover
          ? '0 12px 40px rgba(20,184,166,0.18), 0 2px 8px rgba(15,42,46,0.08)'
          : '0 2px 12px rgba(15,42,46,0.06)',
        border: added ? '2px solid #14B8A6' : '1.5px solid #f0fafa',
        transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Discount Badge */}
      {disc > 0 && (
        <div style={{
          position: 'absolute', top: '12px', left: '12px', zIndex: 2,
          background: '#FF8B6B', color: '#fff', fontSize: '11px',
          fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
        }}>
          {disc}% OFF
        </div>
      )}

      {/* Rx Badge */}
      {product.isPrescriptionRequired && (
        <div style={{
          position: 'absolute', top: '12px', right: '12px', zIndex: 2,
          background: '#dbeafe', color: '#1d4ed8', fontSize: '10px',
          fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
        }}>
          Rx
        </div>
      )}

      {/* Out of Stock overlay */}
      {!product.inStock && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(2px)', zIndex: 3, display: 'flex',
          alignItems: 'center', justifyContent: 'center', borderRadius: '18px',
        }}>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: '#64748B', fontSize: '15px' }}>
            Out of Stock
          </span>
        </div>
      )}

      {/* Image */}
      <div style={{ height: '150px', background: '#f8fffe', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <img src={product.image} alt={product.name} style={{ height: '120px', objectFit: 'contain', transition: 'transform 0.25s', transform: hover ? 'scale(1.08)' : 'scale(1)' }} />
      </div>

      {/* Details */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '11px', color: '#14B8A6', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {product.category}
        </div>
        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1E293B', lineHeight: 1.35, marginBottom: '6px' }}>
          {product.name}
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, flex: 1, marginBottom: '12px' }}>
          {product.description.slice(0, 72)}{product.description.length > 72 ? '…' : ''}
        </div>

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '18px', color: '#0F2A2E' }}>
            ₹{product.price}
          </span>
          {disc > 0 && (
            <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{product.mrp}</span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={() => product.inStock && onAdd(product)}
          disabled={!product.inStock}
          style={{
            padding: '10px',
            background: added
              ? 'linear-gradient(135deg, #A8E6CF, #14B8A6)'
              : hover
                ? 'linear-gradient(135deg, #14B8A6, #0F2A2E)'
                : '#f0fafa',
            color: added || hover ? '#fff' : '#14B8A6',
            border: 'none', borderRadius: '10px',
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13px', fontWeight: 700,
            cursor: product.inStock ? 'pointer' : 'not-allowed',
            transition: 'all 0.22s ease',
            boxShadow: added || hover ? '0 4px 12px rgba(20,184,166,0.3)' : 'none',
          }}
        >
          {added ? '✓ Added to Cart' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Order Placed Success Screen
// ─────────────────────────────────────────────────────────────────────────────
function OrderSuccess({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 40px', textAlign: 'center',
      background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
      borderRadius: '20px', border: '1.5px solid #A8E6CF',
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'pulse 2s infinite' }}>✅</div>
      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '26px', color: '#0F2A2E', marginBottom: '10px' }}>
        Order Placed Successfully!
      </div>
      <div style={{ fontSize: '15px', color: '#64748B', maxWidth: '320px', lineHeight: 1.7, marginBottom: '30px' }}>
        Your medicines are packed with care. Expected delivery: <strong style={{ color: '#14B8A6' }}>Today, 3–5 hours</strong>. Stay well! 💚
      </div>
      <button
        onClick={onContinue}
        style={{
          padding: '12px 32px',
          background: 'linear-gradient(135deg, #14B8A6, #0F2A2E)',
          color: '#fff', border: 'none', borderRadius: '12px',
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px', fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(20,184,166,0.35)',
        }}
      >
        Continue Shopping
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function PharmacyShopPage() {
  const [tab, setTab] = useState<'shop' | 'orders' | 'tests'>('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [bookingForm, setBookingForm] = useState<{ centerId: string; testName: string; price: number; scheduledDate: string; sampleCollection: 'home' | 'lab_visit' } | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (category) params.category = category;
      if (searchVal) params.query = searchVal;
      const res = await api.get('/products', { params });
      setProducts(res.data.products || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [category, searchVal]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Fetch cart on mount
  useEffect(() => {
    api.get('/cart').then(res => {
      const items = res.data.cart?.items || [];
      setCartItems(items);
      setAddedIds(new Set(items.map((i: CartItem) => i.product._id)));
    }).catch(() => {});
  }, []);

  // ── Fetch orders & bookings when switching tabs
  useEffect(() => {
    if (tab === 'orders') {
      api.get('/orders').then(r => setOrders(r.data.orders || [])).catch(() => {});
    }
    if (tab === 'tests') {
      api.get('/test-bookings').then(r => setBookings(r.data.bookings || [])).catch(() => {});
      api.get('/stores', { params: { type: 'diagnostic_center' } }).then(r => setStores(r.data.stores || [])).catch(() => {});
    }
  }, [tab]);

  // ── Debounced search
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setSearchVal(val), 400);
  };

  // ── Add to cart (local + API)
  const addToCart = async (product: Product) => {
    const existing = cartItems.find(i => i.product._id === product._id);
    const newQty = existing ? existing.quantity + 1 : 1;
    try {
      const res = await api.post('/cart/add', { productId: product._id, quantity: newQty });
      const items = res.data.cart?.items || [];
      setCartItems(items);
      setAddedIds(new Set(items.map((i: CartItem) => i.product._id)));
    } catch { /* silent */ }
    setCartOpen(true);
  };

  const removeFromCart = async (productId: string) => {
    try {
      const res = await api.post('/cart/remove', { productId });
      const items = res.data.cart?.items || [];
      setCartItems(items);
      setAddedIds(new Set(items.map((i: CartItem) => i.product._id)));
    } catch { /* silent */ }
  };

  const changeQty = async (productId: string, qty: number) => {
    try {
      const res = await api.post('/cart/add', { productId, quantity: qty });
      const items = res.data.cart?.items || [];
      setCartItems(items);
    } catch { /* silent */ }
  };

  // ── Checkout
  const checkout = async () => {
    setCheckingOut(true);
    try {
      await api.post('/orders', {
        deliveryAddress: '123 Patient Home, City, India',
        deliveryMethod: 'standard',
        paymentStatus: 'cod',
      });
      setCartItems([]);
      setAddedIds(new Set());
      setOrderSuccess(true);
      setCartOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  // ── Book Test
  const submitBooking = async () => {
    if (!bookingForm) return;
    try {
      await api.post('/test-bookings', bookingForm);
      setBookingSuccess(true);
      setBookingForm(null);
      api.get('/test-bookings').then(r => setBookings(r.data.bookings || [])).catch(() => {});
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Booking failed. Please try again.');
    }
  };

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="page-shell" style={{ paddingBottom: '60px' }}>
      {/* ── Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F2A2E 0%, #134e4a 60%, #14B8A6 100%)',
        borderRadius: '24px', padding: '40px', marginBottom: '32px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(168,230,207,0.12)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '40%', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,139,107,0.10)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px' }}>💊</span>
                <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>
                  MedSupply Store
                </h1>
              </div>
              <p style={{ color: '#A8E6CF', fontSize: '15px', margin: 0, maxWidth: '480px', lineHeight: 1.7 }}>
                Medicines, wellness essentials, and lab tests — delivered with care, right at your doorstep.
              </p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
                {[{ icon: '🚀', text: 'Express 19-min delivery' }, { icon: '🔒', text: 'Safe & verified' }, { icon: '💬', text: '24/7 pharmacist chat' }].map(b => (
                  <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f0fafa', fontSize: '13px', fontWeight: 500 }}>
                    <span>{b.icon}</span> {b.text}
                  </div>
                ))}
              </div>
            </div>
            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              style={{
                position: 'relative', padding: '14px 24px',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                borderRadius: '14px', color: '#fff', cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '16px', fontWeight: 700,
                transition: 'all 0.22s ease',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}
            >
              🛒 Cart
              {cartCount > 0 && (
                <span style={{
                  background: '#FF8B6B', color: '#fff', borderRadius: '50%',
                  width: '22px', height: '22px', fontSize: '12px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Page Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', background: '#f0fafa', borderRadius: '14px', padding: '6px' }}>
        {([
          { key: 'shop', label: '🛍️ Shop', desc: 'Browse medicines & products' },
          { key: 'orders', label: '📦 My Orders', desc: 'Track your deliveries' },
          { key: 'tests', label: '🔬 Lab Tests', desc: 'Book diagnostics' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '12px 16px', border: 'none', cursor: 'pointer',
              borderRadius: '10px', transition: 'all 0.22s ease',
              background: tab === t.key ? '#fff' : 'transparent',
              boxShadow: tab === t.key ? '0 2px 12px rgba(20,184,166,0.12)' : 'none',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? '#0F2A2E' : '#64748B' }}>
              {t.label}
            </div>
            <div style={{ fontSize: '11px', color: tab === t.key ? '#14B8A6' : '#94a3b8', marginTop: '2px' }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* ── SHOP TAB ──────────────────────────────────────────────────────────── */}
      {tab === 'shop' && (
        <>
          {orderSuccess ? (
            <OrderSuccess onContinue={() => setOrderSuccess(false)} />
          ) : (
            <>
              {/* Search */}
              <div style={{
                display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap',
              }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#94a3b8' }}>🔍</span>
                  <input
                    value={searchInput}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="Search medicines, vitamins, skincare…"
                    style={{
                      width: '100%', padding: '12px 14px 12px 40px',
                      border: '1.5px solid #e2e8f0', borderRadius: '12px',
                      fontSize: '14px', outline: 'none', background: '#fff',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#14B8A6')}
                    onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                  />
                </div>
                {searchInput && (
                  <button onClick={() => { setSearchInput(''); setSearchVal(''); }} style={{
                    padding: '12px 16px', background: '#fee2e2', color: '#b91c1c',
                    border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '13px',
                  }}>Clear ✕</button>
                )}
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    style={{
                      padding: '8px 16px', border: 'none', cursor: 'pointer',
                      borderRadius: '24px', fontSize: '13px', fontWeight: 600,
                      transition: 'all 0.2s ease',
                      background: category === cat.key ? cat.color : '#f0fafa',
                      color: category === cat.key ? '#fff' : '#64748B',
                      boxShadow: category === cat.key ? `0 4px 12px ${cat.color}40` : 'none',
                      transform: category === cat.key ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Results Count */}
              <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', fontWeight: 500 }}>
                {loading ? 'Loading products…' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
              </div>

              {/* Product Grid */}
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{
                      height: '320px', borderRadius: '18px',
                      background: 'linear-gradient(90deg, #f0fafa 0%, #e0f2f1 50%, #f0fafa 100%)',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 40px', background: '#f8fffe', borderRadius: '20px', border: '1.5px solid #ccfbf1' }}>
                  <div style={{ fontSize: '52px', marginBottom: '16px' }}>💊</div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '18px', color: '#0F2A2E', marginBottom: '8px' }}>
                    No products found
                  </div>
                  <div style={{ color: '#64748B', fontSize: '14px' }}>Try a different search or category.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {products.map(p => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      onAdd={addToCart}
                      added={addedIds.has(p._id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── ORDERS TAB ────────────────────────────────────────────────────────── */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px', background: '#f8fffe', borderRadius: '20px', border: '1.5px solid #ccfbf1' }}>
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>📦</div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '18px', color: '#0F2A2E', marginBottom: '8px' }}>
                No orders yet
              </div>
              <div style={{ color: '#64748B', fontSize: '14px' }}>Your placed orders will appear here.</div>
              <button onClick={() => setTab('shop')} style={{
                marginTop: '24px', padding: '12px 28px',
                background: 'linear-gradient(135deg, #14B8A6, #0F2A2E)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              }}>Shop Now →</button>
            </div>
          ) : orders.map(order => {
            const statusColors: Record<string, string> = {
              placed: '#FCD34D', packing: '#60A5FA', out_for_delivery: '#FF8B6B', delivered: '#A8E6CF'
            };
            const statusLabels: Record<string, string> = {
              placed: '📋 Order Placed', packing: '📦 Packing', out_for_delivery: '🚀 Out for Delivery', delivered: '✅ Delivered'
            };
            return (
              <div key={order._id} style={{
                background: '#fff', borderRadius: '18px',
                border: '1.5px solid #f0fafa',
                boxShadow: '0 2px 12px rgba(15,42,46,0.06)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0fafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1E293B' }}>
                      Order #{order._id.slice(-6).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <span style={{
                    background: `${statusColors[order.orderStatus]}33`,
                    color: '#0F2A2E', fontSize: '12px', fontWeight: 700,
                    padding: '5px 12px', borderRadius: '20px',
                    border: `1px solid ${statusColors[order.orderStatus]}`,
                  }}>
                    {statusLabels[order.orderStatus] || order.orderStatus}
                  </span>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {order.items.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#1E293B' }}>
                        <img src={item.product?.image} alt={item.product?.name} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px', background: '#f8fffe' }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.product?.name || 'Item'}</div>
                          <div style={{ color: '#64748B', fontSize: '12px' }}>×{item.quantity} @ ₹{item.priceAtOrder}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>📍 {order.deliveryAddress}</span>
                    <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: '#0F2A2E', fontSize: '16px' }}>₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TESTS TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'tests' && (
        <div>
          {bookingSuccess && (
            <div style={{
              background: '#f0fdf4', border: '1.5px solid #A8E6CF', borderRadius: '14px',
              padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '24px' }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, color: '#166534', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Test Booked!</div>
                <div style={{ fontSize: '13px', color: '#16a34a' }}>Your test appointment is confirmed. Stay healthy! 💚</div>
              </div>
              <button onClick={() => setBookingSuccess(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>✕</button>
            </div>
          )}

          {/* Booking Form */}
          {bookingForm ? (
            <div style={{
              background: '#fff', borderRadius: '20px', padding: '28px',
              boxShadow: '0 4px 24px rgba(20,184,166,0.12)', border: '1.5px solid #ccfbf1',
              marginBottom: '28px',
            }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '18px', color: '#0F2A2E', marginBottom: '20px' }}>
                🔬 Confirm Test Booking
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '6px' }}>Test Name</label>
                  <input value={bookingForm.testName} readOnly style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fffe', boxSizing: 'border-box', fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '6px' }}>Price</label>
                  <input value={`₹${bookingForm.price}`} readOnly style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fffe', boxSizing: 'border-box', fontWeight: 600, color: '#14B8A6' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '6px' }}>Preferred Date</label>
                  <input
                    type="date"
                    value={bookingForm.scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setBookingForm(prev => prev ? { ...prev, scheduledDate: e.target.value } : prev)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '6px' }}>Sample Collection</label>
                  <select
                    value={bookingForm.sampleCollection}
                    onChange={e => setBookingForm(prev => prev ? { ...prev, sampleCollection: e.target.value as any } : prev)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="home">🏠 Home Collection</option>
                    <option value="lab_visit">🔬 Visit Lab</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={submitBooking} style={{
                  flex: 1, padding: '13px',
                  background: 'linear-gradient(135deg, #14B8A6, #0F2A2E)',
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px', fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
                }}>Confirm Booking</button>
                <button onClick={() => setBookingForm(null)} style={{
                  padding: '13px 20px', background: '#f1f5f9', color: '#64748B',
                  border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600,
                }}>Cancel</button>
              </div>
            </div>
          ) : null}

          {/* Diagnostic Centers */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '18px', color: '#0F2A2E', marginBottom: '16px' }}>
              🏥 Book a Lab Test at Diagnostic Centers
            </h3>
            {stores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: '#f8fffe', borderRadius: '16px', border: '1.5px solid #ccfbf1' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔬</div>
                <div style={{ color: '#64748B' }}>Loading diagnostic centers…</div>
              </div>
            ) : stores.map((store: any) => (
              <div key={store._id} style={{
                background: '#fff', borderRadius: '18px', padding: '20px',
                border: '1.5px solid #f0fafa', boxShadow: '0 2px 12px rgba(15,42,46,0.06)',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '28px' }}>🔬</div>
                  <div>
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: '#0F2A2E' }}>{store.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>📍 {store.location?.address}</div>
                    {store.phone && <div style={{ fontSize: '12px', color: '#94a3b8' }}>📞 {store.phone}</div>}
                  </div>
                </div>
                {store.diagnosticTests?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {store.diagnosticTests.map((test: any, i: number) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', background: '#f8fffe', borderRadius: '12px',
                        border: '1px solid #ccfbf1', transition: 'all 0.2s',
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>{test.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>⏱ {test.turnaroundTime} turnaround</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: '#0F2A2E', fontSize: '16px' }}>₹{test.price}</span>
                          <button
                            onClick={() => setBookingForm({
                              centerId: store._id,
                              testName: test.name,
                              price: test.price,
                              scheduledDate: new Date().toISOString().split('T')[0],
                              sampleCollection: 'home',
                            })}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #14B8A6, #0d9488)',
                              color: '#fff', border: 'none', borderRadius: '8px',
                              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(20,184,166,0.25)',
                              transition: 'all 0.2s',
                            }}
                          >Book Now</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* My Bookings */}
          {bookings.length > 0 && (
            <div>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '18px', color: '#0F2A2E', marginBottom: '16px' }}>
                📋 My Test Bookings
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {bookings.map((b: any) => {
                  const bColors: Record<string, string> = { pending: '#FCD34D', collected: '#60A5FA', completed: '#A8E6CF', cancelled: '#FCA5A5' };
                  return (
                    <div key={b._id} style={{
                      background: '#fff', borderRadius: '14px', padding: '16px 20px',
                      border: '1.5px solid #f0fafa',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>{b.testName}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                          📅 {new Date(b.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} &nbsp;·&nbsp;
                          {b.sampleCollection === 'home' ? '🏠 Home Collection' : '🔬 Lab Visit'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>🏥 {b.centerId?.name || 'Diagnostic Center'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#0F2A2E', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>₹{b.price}</div>
                        <span style={{
                          fontSize: '11px', fontWeight: 700,
                          background: `${bColors[b.status]}33`,
                          color: '#0F2A2E', padding: '3px 10px', borderRadius: '12px',
                          border: `1px solid ${bColors[b.status]}`,
                        }}>
                          {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onRemove={removeFromCart}
        onQtyChange={changeQty}
        onCheckout={checkout}
        checkingOut={checkingOut}
      />
    </div>
  );
}
