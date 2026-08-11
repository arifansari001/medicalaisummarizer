import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { EventType, EventStatus } from '../types';

export default function AddEventPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<EventType>('illness');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [symptomsInput, setSymptomsInput] = useState('');
  const [treatment, setTreatment] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [status, setStatus] = useState<EventStatus>('active');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const symptoms = symptomsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await api.post('/medical-events', {
        type,
        title,
        date: new Date(date).toISOString(),
        description,
        symptoms,
        treatment,
        doctorName,
        hospitalName,
        status,
        notes,
      });

      navigate(`/history/${res.data.event._id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save health event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-event-page animate-fade-in max-w-2xl mx-auto">
      <div className="detail-header">
        <button className="detail-back" onClick={() => navigate('/history')}>←</button>
        <h1>Record Health Event</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Event Category</label>
              <select value={type} onChange={e => setType(e.target.value as EventType)} required>
                <option value="illness">Illness / Condition</option>
                <option value="injury">Injury</option>
                <option value="surgery">Surgery</option>
                <option value="allergy">Allergy</option>
                <option value="hospitalization">Hospitalization</option>
                <option value="doctor_visit">Doctor Visit</option>
                <option value="vaccination">Vaccination</option>
                <option value="medical_test">Medical Test</option>
                <option value="medication">Medication</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Event Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Title / Condition Name</label>
            <input
              type="text"
              placeholder="e.g. Dengue Fever, Annual Checkup, Knee Surgery"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as EventStatus)}>
              <option value="active">Active</option>
              <option value="ongoing">Ongoing</option>
              <option value="recovered">Recovered</option>
              <option value="resolved">Resolved</option>
              <option value="chronic">Chronic</option>
            </select>
          </div>

          <div className="form-group">
            <label>Symptoms (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Fever, Joint pain, Rash"
              value={symptomsInput}
              onChange={e => setSymptomsInput(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Describe the medical event..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Doctor Name (Optional)</label>
              <input
                type="text"
                placeholder="Dr. John Smith"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Hospital / Clinic (Optional)</label>
              <input
                type="text"
                placeholder="City Hospital"
                value={hospitalName}
                onChange={e => setHospitalName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Treatment / Prescriptions (Optional)</label>
            <textarea
              placeholder="Medications, procedures, or instructions given..."
              value={treatment}
              onChange={e => setTreatment(e.target.value)}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              placeholder="Personal observations or follow-up dates..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-4 justify-end mt-6">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/history')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Health Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
