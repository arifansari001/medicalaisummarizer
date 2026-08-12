import { useState } from 'react';
import api from '../services/api';
import MockPaymentGateway from './MockPaymentGateway';

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  consultationFee: number;
  clinicName: string;
  opdSchedule?: { day: string; startTime: string; endTime: string; avgWaitMinutes: number }[];
}

interface BookAppointmentModalProps {
  doctor: Doctor;
  onClose: () => void;
}

export default function BookAppointmentModal({ doctor, onClose }: BookAppointmentModalProps) {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Payment states
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<{ amount: number, orderId: string, appointmentId: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !timeSlot || !reason) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Create Appointment (Status: Pending Payment logically, though defaults to confirmed)
      const aptRes = await api.post('/appointments', {
        doctorId: doctor._id,
        date,
        timeSlot,
        reason,
      });
      
      const appointmentId = aptRes.data.appointment._id;

      // 2. Create Mock Order
      const orderRes = await api.post('/payments/create-order', {
        amount: doctor.consultationFee
      });

      setPaymentData({
        amount: orderRes.data.amount,
        orderId: orderRes.data.orderId,
        appointmentId
      });
      
      setShowPayment(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate booking.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    if (!paymentData) return;
    try {
      await api.post('/payments/verify', {
        appointmentId: paymentData.appointmentId,
        paymentId,
        orderId: paymentData.orderId
      });
      setShowPayment(false);
      setSuccess(true);
    } catch (err: any) {
      setError('Payment verification failed: ' + (err.response?.data?.message || err.message));
      setShowPayment(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setError('Payment was cancelled. Your appointment is on hold.');
  };

  const today = new Date().toISOString().split('T')[0];
  
  // Try to find the wait time for the selected slot if it matches the doctor's schedule
  const selectedScheduleDay = doctor.opdSchedule?.find(s => {
    const selectedDate = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return s.day === days[selectedDate.getDay()] && `${s.startTime} - ${s.endTime}` === timeSlot;
  });

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', width: '90vw', padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a' }}>Book Appointment</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>with {doctor.name}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b'
            }}
          >×</button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#10b981', margin: '0 0 8px 0' }}>Appointment Confirmed!</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
              Your appointment has been booked. Your doctor has also been granted secure access to your medical records for the next 72 hours.
            </p>
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '12px', background: 'linear-gradient(135deg, #0891b2, #6366f1)',
                color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                Select Date
              </label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTimeSlot(''); // Reset timeslot when date changes
                }}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                  fontSize: '14px', background: '#f8fafc'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                Select Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                disabled={!date}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                  fontSize: '14px', background: !date ? '#f1f5f9' : '#f8fafc', cursor: !date ? 'not-allowed' : 'pointer'
                }}
                required
              >
                <option value="">Choose a slot...</option>
                {date && doctor.opdSchedule && doctor.opdSchedule.length > 0 ? (
                  doctor.opdSchedule
                    .filter((s) => {
                      const selectedDay = new Date(date).getDay();
                      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      return s.day === days[selectedDay];
                    })
                    .map((s, i) => (
                      <option key={i} value={`${s.startTime} - ${s.endTime}`}>
                        {s.startTime} - {s.endTime} (~{s.avgWaitMinutes}m wait)
                      </option>
                    ))
                ) : (
                  <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                )}
                {/* Fallback if no specific schedule matches */}
                {date && (!doctor.opdSchedule || doctor.opdSchedule.filter((s) => s.day === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(date).getDay()]).length === 0) && (
                  <>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                    <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                  </>
                )}
              </select>
            </div>

            {selectedScheduleDay && (
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#b45309' }}>
                <strong>Estimated Wait Time:</strong> ~{selectedScheduleDay.avgWaitMinutes} minutes based on current OPD load.
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                Reason for Visit / Symptoms
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for visit..."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                  fontSize: '14px', background: '#f8fafc', minHeight: '80px', resize: 'vertical'
                }}
                required
              />
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Consultation Fee</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{doctor.consultationFee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                <span>Payment Mode</span>
                <span>Online Payment</span>
              </div>
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '13px', background: '#fef2f2', padding: '10px', borderRadius: '6px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0891b2, #6366f1)',
                color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px'
              }}
            >
              {loading ? 'Processing...' : `Proceed to Pay ₹${doctor.consultationFee}`}
            </button>
          </form>
        )}
      </div>

      {showPayment && paymentData && (
        <MockPaymentGateway
          amount={paymentData.amount}
          orderId={paymentData.orderId}
          doctorName={doctor.name}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}
