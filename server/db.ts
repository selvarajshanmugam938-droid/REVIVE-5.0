import { EventEmitter } from 'events';
import {
  seedMedicines,
  seedPharmacies,
  seedHospitals,
  seedBloodBanks,
  seedTransplantCenters,
  seedIoTDevices,
  seedUsers,
  sampleDistricts
} from './seedData.js';

export const eventBus = new EventEmitter();

// District coordinate lookup for fallback distance calculation
export const districtCoordinates: Record<string, { lat: number; lng: number }> = {
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Madurai': { lat: 9.9252, lng: 78.1198 },
  'Salem': { lat: 11.6643, lng: 78.1460 },
  'Tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
  'Erode': { lat: 11.3410, lng: 77.7172 },
  'Tiruppur': { lat: 11.1085, lng: 77.3411 },
  'Namakkal': { lat: 11.2189, lng: 78.1674 },
  'Karur': { lat: 10.9601, lng: 78.0766 },
  'Dindigul': { lat: 10.3673, lng: 77.9803 },
  'Nilgiris': { lat: 11.4102, lng: 76.6950 },
  'Thanjavur': { lat: 10.7870, lng: 79.1378 },
  'Vellore': { lat: 12.9165, lng: 79.1325 },
  'Tirunelveli': { lat: 8.7139, lng: 77.7567 },
  'Cuddalore': { lat: 11.7480, lng: 79.7714 }
};

// Haversine distance formula in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

class Database {
  users: any[] = [];
  pharmacies: any[] = [];
  medicines: any[] = [];
  medicineInventory: any[] = [];
  hospitals: any[] = [];
  bloodBanks: any[] = [];
  bloodInventory: any[] = [];
  transplantCenters: any[] = [];
  organAvailability: any[] = [];
  referrals: any[] = [];
  iotDevices: any[] = [];
  notifications: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    this.users = JSON.parse(JSON.stringify(seedUsers));
    this.pharmacies = JSON.parse(JSON.stringify(seedPharmacies));
    this.medicines = JSON.parse(JSON.stringify(seedMedicines));
    this.hospitals = JSON.parse(JSON.stringify(seedHospitals));
    this.bloodBanks = JSON.parse(JSON.stringify(seedBloodBanks));
    this.transplantCenters = JSON.parse(JSON.stringify(seedTransplantCenters));
    this.iotDevices = JSON.parse(JSON.stringify(seedIoTDevices));

    // Generate comprehensive Medicine Inventory across all pharmacies
    this.medicineInventory = [];
    let invCounter = 1;
    this.pharmacies.forEach((pharmacy, pIdx) => {
      this.medicines.forEach((med, mIdx) => {
        // Vary stock and status realistically
        const isCommon = ['med-01', 'med-02', 'med-05', 'med-12', 'med-13', 'med-22', 'med-24'].includes(med.id);
        const rand = (pIdx * 17 + mIdx * 31) % 100;
        
        let stockQuantity = 0;
        let status = 'OUT_OF_STOCK';
        
        if (isCommon || rand < 75) {
          if (rand > 20) {
            stockQuantity = 20 + ((pIdx * 11 + mIdx * 7) % 140);
            status = 'AVAILABLE';
          } else {
            stockQuantity = 2 + (mIdx % 5);
            status = 'LIMITED';
          }
        }

        const price = Math.round(15 + (mIdx * 12.5) + (pIdx % 3) * 5);
        const rackCode = `Rack ${String.fromCharCode(65 + (mIdx % 6))}-${(pIdx % 4) + 1}`;

        this.medicineInventory.push({
          id: `inv-${invCounter++}`,
          pharmacyId: pharmacy.id,
          pharmacyName: pharmacy.name,
          pharmacyAddress: pharmacy.address,
          pharmacyDistrict: pharmacy.district,
          pharmacyPhone: pharmacy.phone,
          pharmacyLat: pharmacy.lat,
          pharmacyLng: pharmacy.lng,
          is24x7: pharmacy.is24x7,
          medicineId: med.id,
          medicineName: med.name,
          genericName: med.genericName,
          category: med.category,
          dosageForm: med.dosageForm,
          strength: med.strength,
          stockQuantity,
          status,
          price,
          rackLocation: rackCode,
          batchNumber: `BAT-${2024 + (mIdx % 2)}-${1000 + invCounter}`,
          expiryDate: '2027-12-31',
          updatedAt: new Date(Date.now() - (mIdx % 45) * 60000).toISOString()
        });
      });
    });

    // Generate Blood Inventory for all Blood Banks
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const components = ['WHOLE_BLOOD', 'PRBC', 'PLATELETS', 'FFP'];
    this.bloodInventory = [];
    let bInvCounter = 1;

    this.bloodBanks.forEach((bb, bbIdx) => {
      bloodGroups.forEach((bg, bgIdx) => {
        components.forEach((comp, cIdx) => {
          const rand = (bbIdx * 13 + bgIdx * 19 + cIdx * 7) % 100;
          let units = 0;
          let status = 'OUT_OF_STOCK';

          if (rand > 15) {
            units = 4 + ((bbIdx * 5 + bgIdx * 3 + cIdx * 4) % 35);
            status = units > 8 ? 'AVAILABLE' : 'LIMITED';
          }

          this.bloodInventory.push({
            id: `blood-inv-${bInvCounter++}`,
            bloodBankId: bb.id,
            bloodBankName: bb.name,
            hospitalName: bb.hospitalName,
            address: bb.address,
            district: bb.district,
            phone: bb.phone,
            emergencyContact: bb.emergencyContact,
            lat: bb.lat,
            lng: bb.lng,
            is24x7: bb.is24x7,
            bloodGroup: bg,
            componentType: comp,
            unitsAvailable: units,
            status,
            updatedAt: new Date(Date.now() - (bgIdx * 8 + cIdx * 5) * 60000).toISOString()
          });
        });
      });
    });

    // Generate Organ Availability Information
    const organTypes = ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS'];
    this.organAvailability = [];
    let orgCounter = 1;

    this.transplantCenters.forEach((tc, tcIdx) => {
      organTypes.forEach((organ, oIdx) => {
        const statuses = ['WAITLIST_OPEN', 'DONOR_AVAILABLE', 'INFORMATION_ONLY'];
        const status = statuses[(tcIdx + oIdx) % statuses.length];
        const waitlistCount = 12 + ((tcIdx * 7 + oIdx * 11) % 65);

        this.organAvailability.push({
          id: `org-avail-${orgCounter++}`,
          centerId: tc.id,
          centerName: tc.name,
          hospitalId: tc.hospitalId,
          address: tc.address,
          district: tc.district,
          phone: tc.phone,
          coordinatorName: tc.coordinatorName,
          coordinatorPhone: tc.coordinatorPhone,
          lat: tc.lat,
          lng: tc.lng,
          organType: organ,
          status,
          waitlistCount,
          matchingCriteria: 'ABO Blood Match, HLA Tissue Typing, PRA < 20%, Body Size Match (TRANSTAN Rules)',
          disclaimer: 'Official TRANSTAN / NOTTO allocation only. Commercial trade is strictly prohibited by law.',
          updatedAt: new Date(Date.now() - (oIdx * 30) * 60000).toISOString()
        });
      });
    });

    // Seed Referrals
    this.referrals = [
      {
        id: 'REF-2026-8801',
        userId: 'usr-01',
        patientName: 'Kuppusamy (Age 64)',
        patientAge: 64,
        patientGender: 'MALE',
        patientPhone: '+91 98421 55678',
        reason: 'Acute shortness of breath with diabetic nephropathy needing tertiary ICU dialysis',
        symptoms: ['Breathlessness', 'Decreased urine output', 'Chest heaviness', 'High Creatinine'],
        priority: 'URGENT',
        currentFacility: 'PHC Modakkurichi, Erode',
        preferredFacilityId: 'hosp-02',
        referredFacilityName: 'Coimbatore Medical College Hospital (CMCH)',
        status: 'ACCEPTED',
        notes: 'Pre-admission bed reserved in Nephrology ICU. Ambulance transit assigned.',
        timeline: [
          { status: 'REQUESTED', label: 'Referral Requested by Rural Medical Officer', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), actor: 'Dr. S. Vimal (PHC Modakkurichi)' },
          { status: 'UNDER_REVIEW', label: 'Triage Review at CMCH Referral Cell', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), actor: 'Dr. R. Kavitha (CMCH Triage)' },
          { status: 'ACCEPTED', label: 'Bed Reserved: Nephrology ICU #04', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), actor: 'CMCH Admission Desk' }
        ],
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: 'REF-2026-8802',
        userId: 'usr-01',
        patientName: 'Meenakshi Sundaram (Age 28)',
        patientAge: 28,
        patientGender: 'FEMALE',
        patientPhone: '+91 94432 77890',
        reason: 'High-risk primigravida at 36 weeks with severe pre-eclampsia',
        symptoms: ['Elevated BP 170/110', 'Pedal edema', 'Headache', 'Visual blurring'],
        priority: 'EMERGENCY',
        currentFacility: 'CHC Sathyamangalam',
        preferredFacilityId: 'hosp-01',
        referredFacilityName: 'Government District Headquarters Hospital (GH Erode)',
        status: 'REFERRED',
        notes: 'Magnesium Sulfate loading dose administered. Emergency Obstetric Team alerted.',
        timeline: [
          { status: 'REQUESTED', label: 'Emergency Referral Requested', timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), actor: 'Dr. P. Gomathi' },
          { status: 'UNDER_REVIEW', label: 'Verified by On-Call Obstetrician', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), actor: 'GH Erode Triage' },
          { status: 'ACCEPTED', label: 'Maternity ICU & OT Prepped', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), actor: 'GH Erode Labor Ward' },
          { status: 'REFERRED', label: 'En-Route in 108 Ambulance (TN-33-G-1108)', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), actor: '108 Paramedic Team' }
        ],
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60000).toISOString()
      }
    ];

    // Seed Notifications
    this.notifications = [
      {
        id: 'notif-01',
        userId: 'usr-01',
        title: 'Referral Update (REF-2026-8801)',
        message: 'Your referral to Coimbatore Medical College Hospital has been ACCEPTED. ICU Bed #04 is reserved.',
        type: 'SUCCESS',
        read: false,
        createdAt: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: 'notif-02',
        userId: 'usr-01',
        title: 'New Stock Alert: Insulin Actrapid',
        message: 'Sri Lakshmi Medicals, Erode just updated stock: 40 units available.',
        type: 'INFO',
        read: false,
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
      }
    ];
  }

  // User Auth
  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string) {
    return this.users.find(u => u.id === id);
  }

  createUser(userData: any) {
    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      passwordHash: userData.password, // Plain or hashed simulation
      role: userData.role || 'USER',
      mode: userData.mode || 'BASIC',
      language: userData.language || 'en',
      district: userData.district || 'Coimbatore',
      pharmacyId: userData.pharmacyId,
      lat: userData.lat || districtCoordinates[userData.district || 'Coimbatore']?.lat || 11.0168,
      lng: userData.lng || districtCoordinates[userData.district || 'Coimbatore']?.lng || 76.9558
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUserPreferences(userId: string, prefs: { mode?: 'BASIC' | 'ADVANCED'; language?: 'en' | 'ta' | 'hi'; district?: string; lat?: number; lng?: number }) {
    const user = this.findUserById(userId);
    if (user) {
      if (prefs.mode) user.mode = prefs.mode;
      if (prefs.language) user.language = prefs.language;
      if (prefs.district) {
        user.district = prefs.district;
        if (districtCoordinates[prefs.district]) {
          user.lat = districtCoordinates[prefs.district].lat;
          user.lng = districtCoordinates[prefs.district].lng;
        }
      }
      if (prefs.lat) user.lat = prefs.lat;
      if (prefs.lng) user.lng = prefs.lng;
    }
    return user;
  }

  // Medicines & Inventory
  getMedicines(search?: string, category?: string) {
    let list = this.medicines;
    if (category && category !== 'ALL') {
      list = list.filter(m => m.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.uses.some((u: string) => u.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getMedicineAvailability(params: {
    medicineId?: string;
    search?: string;
    district?: string;
    userLat?: number;
    userLng?: number;
    statusFilter?: string;
    only24x7?: boolean;
  }) {
    let items = [...this.medicineInventory];

    if (params.medicineId) {
      items = items.filter(i => i.medicineId === params.medicineId);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(i =>
        i.medicineName.toLowerCase().includes(q) ||
        i.genericName.toLowerCase().includes(q) ||
        i.pharmacyName.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }

    if (params.district && params.district !== 'ALL') {
      items = items.filter(i => i.pharmacyDistrict.toLowerCase() === params.district!.toLowerCase());
    }

    if (params.statusFilter && params.statusFilter !== 'ALL') {
      items = items.filter(i => i.status === params.statusFilter);
    }

    if (params.only24x7) {
      items = items.filter(i => i.is24x7);
    }

    // Compute distance
    const refLat = params.userLat || 11.0168;
    const refLng = params.userLng || 76.9558;

    items = items.map(item => ({
      ...item,
      distanceKm: calculateDistanceKm(refLat, refLng, item.pharmacyLat, item.pharmacyLng)
    }));

    // Sort by available stock first, then distance
    items.sort((a, b) => {
      const statusWeight: Record<string, number> = { 'AVAILABLE': 3, 'LIMITED': 2, 'OUT_OF_STOCK': 1, 'UNKNOWN': 0 };
      const sDiff = (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0);
      if (sDiff !== 0) return sDiff;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

    return items;
  }

  // Pharmacy Inventory Management
  getPharmacyInventory(pharmacyId: string) {
    return this.medicineInventory.filter(i => i.pharmacyId === pharmacyId);
  }

  updateInventoryStock(itemId: string, updates: { stockQuantity?: number; status?: string; price?: number }) {
    const item = this.medicineInventory.find(i => i.id === itemId);
    if (!item) return null;

    if (updates.stockQuantity !== undefined) {
      item.stockQuantity = Math.max(0, updates.stockQuantity);
      if (item.stockQuantity === 0) {
        item.status = 'OUT_OF_STOCK';
      } else if (item.stockQuantity < 10) {
        item.status = 'LIMITED';
      } else {
        item.status = 'AVAILABLE';
      }
    }

    if (updates.status) {
      item.status = updates.status;
    }

    if (updates.price !== undefined) {
      item.price = updates.price;
    }

    item.updatedAt = new Date().toISOString();

    // Broadcast real-time stock update
    eventBus.emit('stock_updated', {
      itemId: item.id,
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      pharmacyId: item.pharmacyId,
      pharmacyName: item.pharmacyName,
      stockQuantity: item.stockQuantity,
      status: item.status,
      updatedAt: item.updatedAt
    });

    return item;
  }

  addPharmacyMedicine(pharmacyId: string, medicineData: {
    medicineId: string;
    stockQuantity: number;
    price: number;
    rackLocation?: string;
  }) {
    const pharmacy = this.pharmacies.find(p => p.id === pharmacyId);
    const medicine = this.medicines.find(m => m.id === medicineData.medicineId);

    if (!pharmacy || !medicine) return null;

    // Check if already exists in this pharmacy
    let existing = this.medicineInventory.find(i => i.pharmacyId === pharmacyId && i.medicineId === medicineData.medicineId);
    if (existing) {
      existing.stockQuantity += medicineData.stockQuantity;
      existing.price = medicineData.price || existing.price;
      existing.status = existing.stockQuantity > 0 ? (existing.stockQuantity < 10 ? 'LIMITED' : 'AVAILABLE') : 'OUT_OF_STOCK';
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const newItem = {
      id: `inv-${Date.now()}`,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      pharmacyAddress: pharmacy.address,
      pharmacyDistrict: pharmacy.district,
      pharmacyPhone: pharmacy.phone,
      pharmacyLat: pharmacy.lat,
      pharmacyLng: pharmacy.lng,
      is24x7: pharmacy.is24x7,
      medicineId: medicine.id,
      medicineName: medicine.name,
      genericName: medicine.genericName,
      category: medicine.category,
      dosageForm: medicine.dosageForm,
      strength: medicine.strength,
      stockQuantity: medicineData.stockQuantity,
      status: medicineData.stockQuantity > 10 ? 'AVAILABLE' : (medicineData.stockQuantity > 0 ? 'LIMITED' : 'OUT_OF_STOCK'),
      price: medicineData.price,
      rackLocation: medicineData.rackLocation || 'Rack A-1',
      batchNumber: `BAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: '2027-12-31',
      updatedAt: new Date().toISOString()
    };

    this.medicineInventory.unshift(newItem);

    eventBus.emit('stock_updated', newItem);
    return newItem;
  }

  // Hospitals & Beds
  getHospitals(params: {
    search?: string;
    district?: string;
    bedCategory?: string;
    type?: string;
    userLat?: number;
    userLng?: number;
  }) {
    let list = JSON.parse(JSON.stringify(this.hospitals));

    if (params.district && params.district !== 'ALL') {
      list = list.filter((h: any) => h.district.toLowerCase() === params.district!.toLowerCase());
    }

    if (params.type && params.type !== 'ALL') {
      list = list.filter((h: any) => h.type === params.type);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((h: any) =>
        h.name.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q)
      );
    }

    const refLat = params.userLat || 11.0168;
    const refLng = params.userLng || 76.9558;

    list = list.map((h: any) => {
      const totalAvailable = h.beds.reduce((acc: number, b: any) => acc + (b.availableBeds || 0), 0);
      return {
        ...h,
        totalAvailableBeds: totalAvailable,
        distanceKm: calculateDistanceKm(refLat, refLng, h.lat, h.lng)
      };
    });

    if (params.bedCategory && params.bedCategory !== 'ALL') {
      list = list.filter((h: any) =>
        h.beds.some((b: any) => b.category === params.bedCategory && b.availableBeds > 0)
      );
    }

    list.sort((a: any, b: any) => (a.distanceKm || 0) - (b.distanceKm || 0));
    return list;
  }

  updateHospitalBed(hospitalId: string, bedId: string, updates: { availableBeds?: number; occupiedBeds?: number }) {
    const hospital = this.hospitals.find(h => h.id === hospitalId);
    if (!hospital) return null;
    const bed = hospital.beds.find((b: any) => b.id === bedId);
    if (!bed) return null;

    if (updates.availableBeds !== undefined) {
      bed.availableBeds = updates.availableBeds;
      bed.occupiedBeds = bed.totalBeds - bed.availableBeds;
    }
    bed.updatedAt = new Date().toISOString();
    hospital.updatedAt = new Date().toISOString();

    eventBus.emit('bed_updated', {
      hospitalId,
      hospitalName: hospital.name,
      bed
    });

    return bed;
  }

  // Blood Availability
  getBloodAvailability(params: {
    bloodGroup?: string;
    componentType?: string;
    district?: string;
    userLat?: number;
    userLng?: number;
  }) {
    let items = [...this.bloodInventory];

    if (params.bloodGroup && params.bloodGroup !== 'ALL') {
      items = items.filter(i => i.bloodGroup === params.bloodGroup);
    }

    if (params.componentType && params.componentType !== 'ALL') {
      items = items.filter(i => i.componentType === params.componentType);
    }

    if (params.district && params.district !== 'ALL') {
      items = items.filter(i => i.district.toLowerCase() === params.district!.toLowerCase());
    }

    const refLat = params.userLat || 11.0168;
    const refLng = params.userLng || 76.9558;

    items = items.map(item => ({
      ...item,
      distanceKm: calculateDistanceKm(refLat, refLng, item.lat, item.lng)
    }));

    items.sort((a, b) => {
      if (b.unitsAvailable !== a.unitsAvailable) return b.unitsAvailable - a.unitsAvailable;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

    return items;
  }

  // Organ Availability
  getOrganAvailability(params: {
    organType?: string;
    district?: string;
    status?: string;
    userLat?: number;
    userLng?: number;
  }) {
    let items = [...this.organAvailability];

    if (params.organType && params.organType !== 'ALL') {
      items = items.filter(i => i.organType === params.organType);
    }

    if (params.status && params.status !== 'ALL') {
      items = items.filter(i => i.status === params.status);
    }

    if (params.district && params.district !== 'ALL') {
      items = items.filter(i => i.district.toLowerCase() === params.district!.toLowerCase());
    }

    const refLat = params.userLat || 11.0168;
    const refLng = params.userLng || 76.9558;

    items = items.map(item => ({
      ...item,
      distanceKm: calculateDistanceKm(refLat, refLng, item.lat, item.lng)
    }));

    items.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    return items;
  }

  // Referrals
  getReferrals(userId?: string) {
    if (userId) {
      return this.referrals.filter(r => r.userId === userId);
    }
    return this.referrals;
  }

  createReferral(referralData: any) {
    const newRef = {
      id: `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: referralData.userId || 'usr-01',
      patientName: referralData.patientName,
      patientAge: Number(referralData.patientAge),
      patientGender: referralData.patientGender,
      patientPhone: referralData.patientPhone,
      reason: referralData.reason,
      symptoms: referralData.symptoms || [],
      priority: referralData.priority || 'ROUTINE',
      currentFacility: referralData.currentFacility || 'Rural PHC Clinic',
      preferredFacilityId: referralData.preferredFacilityId,
      referredFacilityName: referralData.referredFacilityName || 'Government District Headquarters Hospital',
      status: 'REQUESTED',
      notes: referralData.notes || 'Pending triage verification',
      timeline: [
        {
          status: 'REQUESTED',
          label: 'Referral Request Submitted',
          timestamp: new Date().toISOString(),
          actor: referralData.patientName || 'Patient'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.referrals.unshift(newRef);

    // Auto-create notification
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: newRef.userId,
      title: `Referral Created (${newRef.id})`,
      message: `Your referral request for ${newRef.patientName} has been submitted to ${newRef.referredFacilityName}.`,
      type: 'INFO',
      read: false,
      createdAt: new Date().toISOString()
    });

    eventBus.emit('referral_created', newRef);
    return newRef;
  }

  updateReferralStatus(id: string, newStatus: string, actor: string = 'Hospital Triage Team', note?: string) {
    const ref = this.referrals.find(r => r.id === id);
    if (!ref) return null;

    ref.status = newStatus;
    ref.updatedAt = new Date().toISOString();
    ref.timeline.push({
      status: newStatus,
      label: `Status changed to ${newStatus}`,
      timestamp: new Date().toISOString(),
      actor,
      note
    });

    eventBus.emit('referral_updated', ref);
    return ref;
  }

  // IoT Devices
  getIoTDevices() {
    return this.iotDevices;
  }

  updateIoTReading(deviceCode: string, telemetry: any) {
    const device = this.iotDevices.find(d => d.deviceCode === deviceCode);
    if (!device) return null;

    device.telemetry = { ...device.telemetry, ...telemetry };
    device.lastSeen = new Date().toISOString();
    device.updatedAt = new Date().toISOString();

    eventBus.emit('iot_telemetry', device);
    return device;
  }

  // Global Unified Instant Search
  globalSearch(query: string, district?: string, userLat?: number, userLng?: number) {
    if (!query || query.trim() === '') return [];
    const q = query.toLowerCase().trim();
    const results: any[] = [];
    const refLat = userLat || 11.0168;
    const refLng = userLng || 76.9558;

    // 1. Search Medicines
    const matchedMeds = this.medicines.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.uses.some((u: string) => u.toLowerCase().includes(q))
    );

    matchedMeds.forEach(m => {
      // Find top available pharmacy for this medicine
      const avail = this.medicineInventory.filter(i => i.medicineId === m.id && i.status === 'AVAILABLE');
      results.push({
        id: `sr-med-${m.id}`,
        type: 'MEDICINE',
        title: m.name,
        subtitle: `${m.genericName} • ${m.dosageForm} (${m.strength})`,
        badge: avail.length > 0 ? `${avail.length} Pharmacies Available` : 'Check Availability',
        district: district || 'All Districts',
        data: m
      });
    });

    // 2. Search Hospitals & Beds
    const matchedHospitals = this.hospitals.filter(h =>
      h.name.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q) ||
      h.district.toLowerCase().includes(q) ||
      h.beds.some((b: any) => b.category.toLowerCase().includes(q) || b.categoryLabel.toLowerCase().includes(q))
    );

    matchedHospitals.forEach(h => {
      const availBeds = h.beds.reduce((acc: number, b: any) => acc + b.availableBeds, 0);
      const icuBed = h.beds.find((b: any) => b.category === 'ICU');
      const dist = calculateDistanceKm(refLat, refLng, h.lat, h.lng);

      results.push({
        id: `sr-hosp-${h.id}`,
        type: 'HOSPITAL',
        title: h.name,
        subtitle: `${h.type === 'GOVERNMENT' ? 'Govt Hospital' : 'Private'} • ${h.district} • ${icuBed ? `${icuBed.availableBeds} ICU Beds Free` : ''}`,
        badge: `${availBeds} Total Beds Available`,
        district: h.district,
        distanceKm: dist,
        data: h
      });
    });

    // 3. Search Blood Banks
    const isBloodSearch = ['blood', 'a+', 'a-', 'b+', 'b-', 'ab+', 'ab-', 'o+', 'o-', 'plasma', 'platelets'].some(term => q.includes(term));
    if (isBloodSearch) {
      this.bloodBanks.slice(0, 4).forEach(bb => {
        const dist = calculateDistanceKm(refLat, refLng, bb.lat, bb.lng);
        results.push({
          id: `sr-bb-${bb.id}`,
          type: 'BLOOD',
          title: bb.name,
          subtitle: `24x7 Blood Bank • Emergency: ${bb.emergencyContact}`,
          badge: 'Stock Ready',
          district: bb.district,
          distanceKm: dist,
          data: bb
        });
      });
    }

    // 4. Search Pharmacies
    const matchedPharmacies = this.pharmacies.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q)
    );

    matchedPharmacies.forEach(p => {
      const dist = calculateDistanceKm(refLat, refLng, p.lat, p.lng);
      results.push({
        id: `sr-ph-${p.id}`,
        type: 'PHARMACY',
        title: p.name,
        subtitle: `${p.address} • Phone: ${p.phone}`,
        badge: p.is24x7 ? '24x7 Open' : 'Open',
        district: p.district,
        distanceKm: dist,
        data: p
      });
    });

    return results.slice(0, 15);
  }
}

export const db = new Database();
