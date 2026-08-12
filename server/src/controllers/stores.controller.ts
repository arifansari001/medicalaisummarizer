import { type Response } from 'express';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import { MedicalStore } from '../models/MedicalStore.js';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/stores?type=pharmacy|blood_bank&query=medicine_name&lat=&lng=
export const getStores = async (req: AuthRequest, res: Response) => {
  try {
    const { type, query, lat, lng } = req.query;

    const filter: Record<string, any> = {};
    if (type && type !== 'all') filter.type = type;

    // Search by medicine name or blood group (case-insensitive)
    if (query) {
      const rx = new RegExp(query as string, 'i');
      filter.$or = [
        { medicineInventory: rx },
        { bloodGroups: rx },
        { name: rx },
      ];
    }

    const stores = await MedicalStore.find(filter).lean();

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);

    const storesWithDist = stores.map((s: any) => ({
      ...s,
      distanceKm: s.location?.lat && !isNaN(userLat)
        ? parseFloat(haversineKm(userLat, userLng, s.location.lat, s.location.lng).toFixed(1))
        : null,
    }));

    storesWithDist.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    res.json({ stores: storesWithDist });
  } catch (error) {
    console.error('getStores error:', error);
    res.status(500).json({ message: 'Failed to fetch stores' });
  }
};
