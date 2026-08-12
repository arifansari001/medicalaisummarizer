import { type Response } from 'express';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import { User } from '../models/User.js';

// Helper: Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const getDoctors = async (req: AuthRequest, res: Response) => {
  try {
    const { specialty, lat, lng, sort = 'rating' } = req.query;

    const filter: Record<string, any> = { role: 'doctor' };
    if (specialty && specialty !== 'all') {
      filter.specialty = specialty;
    }

    const doctors = await User.find(filter)
      .select('name specialty rating consultationFee clinicName location opdSchedule')
      .lean();

    // Attach distance if coordinates provided
    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const doctorsWithDistance = doctors.map((d: any) => ({
      ...d,
      distanceKm:
        d.location?.lat && d.location?.lng && !isNaN(userLat)
          ? parseFloat(haversineKm(userLat, userLng, d.location.lat, d.location.lng).toFixed(1))
          : null,
    }));

    // Sort
    if (sort === 'distance' && !isNaN(userLat)) {
      doctorsWithDistance.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else {
      doctorsWithDistance.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

    res.json({ doctors: doctorsWithDistance });
  } catch (error) {
    console.error('getDoctors error:', error);
    res.status(500).json({ message: 'Failed to fetch doctors' });
  }
};
