export type UserRole = 'USER' | 'PHARMACY' | 'ADMIN';
export type AppMode = 'BASIC' | 'ADVANCED';
export type Language = 'en' | 'ta' | 'hi';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  mode?: AppMode;
  language?: Language;
  district: string;
  pharmacyId?: string;
  preferences?: {
    mode?: AppMode;
    language?: Language;
  };
  lat?: number;
  lng?: number;
}

export type BloodComponentType = BloodComponent;
export type OrganInventoryItem = OrganAvailabilityItem;

export type AvailabilityStatus = 'AVAILABLE' | 'LIMITED' | 'OUT_OF_STOCK' | 'UNKNOWN';

export interface Pharmacy {
  id: string;
  name: string;
  ownerName: string;
  licenseNumber: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  phone: string;
  is24x7: boolean;
  rating: number;
  updatedAt: string;
  distanceKm?: number;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosageForm: string; // Tablet, Syrup, Injection, Capsule, Drops, Ointment
  strength: string; // e.g. 500mg, 100ml
  manufacturer: string;
  prescriptionRequired: boolean;
  description: string;
  uses: string[];
}

export interface MedicineInventoryItem {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyDistrict: string;
  pharmacyPhone: string;
  pharmacyLat: number;
  pharmacyLng: number;
  is24x7: boolean;
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: string;
  dosageForm: string;
  strength: string;
  stockQuantity: number;
  status: AvailabilityStatus;
  price: number;
  rackLocation?: string;
  batchNumber?: string;
  expiryDate?: string;
  updatedAt: string;
  distanceKm?: number;
}

export type BedCategory = 'GENERAL' | 'ICU' | 'EMERGENCY' | 'PEDIATRIC' | 'MATERNITY' | 'ISOLATION' | 'OXYGEN_SUPPORTED';

export interface HospitalBed {
  id: string;
  category: BedCategory;
  categoryLabel: string;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  ventilatorCount: number;
  pricePerDay: number;
  updatedAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: 'GOVERNMENT' | 'PRIVATE' | 'COMMUNITY_HEALTH_CENTER' | 'PRIMARY_HEALTH_CENTER';
  address: string;
  district: string;
  lat: number;
  lng: number;
  phone: string;
  emergencyPhone: string;
  ambulanceAvailable: boolean;
  rating: number;
  updatedAt: string;
  beds: HospitalBed[];
  distanceKm?: number;
  totalAvailableBeds?: number;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type BloodComponent = 'WHOLE_BLOOD' | 'PRBC' | 'PLATELETS' | 'FFP';

export interface BloodInventoryItem {
  id: string;
  bloodBankId: string;
  bloodBankName: string;
  hospitalName?: string;
  address: string;
  district: string;
  phone: string;
  emergencyContact: string;
  lat: number;
  lng: number;
  is24x7: boolean;
  bloodGroup: BloodGroup;
  componentType: BloodComponent;
  unitsAvailable: number;
  status: AvailabilityStatus;
  updatedAt: string;
  distanceKm?: number;
}

export type OrganType = 'KIDNEY' | 'LIVER' | 'HEART' | 'LUNG' | 'CORNEA' | 'PANCREAS' | 'TISSUE';
export type OrganStatus = 'WAITLIST_OPEN' | 'DONOR_AVAILABLE' | 'EMERGENCY_MATCH' | 'INFORMATION_ONLY';

export interface OrganAvailabilityItem {
  id: string;
  centerId: string;
  centerName: string;
  hospitalId: string;
  address: string;
  district: string;
  phone: string;
  coordinatorName: string;
  coordinatorPhone: string;
  lat: number;
  lng: number;
  organType: OrganType;
  status: OrganStatus;
  waitlistCount: number;
  matchingCriteria: string;
  disclaimer: string;
  updatedAt: string;
  distanceKm?: number;
}

export type ReferralPriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';
export type ReferralStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REFERRED' | 'COMPLETED' | 'CANCELLED';

export interface ReferralTimelineStep {
  status: ReferralStatus;
  label: string;
  timestamp?: string;
  note?: string;
  actor?: string;
}

export interface Referral {
  id: string;
  userId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  patientPhone: string;
  reason: string;
  symptoms: string[];
  priority: ReferralPriority;
  currentFacility: string;
  preferredFacilityId?: string;
  referredFacilityName: string;
  status: ReferralStatus;
  notes?: string;
  timeline: ReferralTimelineStep[];
  createdAt: string;
  updatedAt: string;
}

export type IoTDeviceType = 'BED_OCCUPANCY' | 'COLD_STORAGE' | 'OXYGEN_PRESSURE' | 'VITAL_MONITOR' | 'AMBULANCE_TRACKER';
export type IoTDeviceStatus = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ALERT';

export interface IoTDevice {
  id: string;
  deviceCode: string; // e.g., REVIVE-BED-TN01
  deviceType: IoTDeviceType;
  deviceLabel: string;
  facilityType: 'HOSPITAL' | 'PHARMACY' | 'AMBULANCE' | 'RURAL_CLINIC';
  facilityId: string;
  facilityName: string;
  locationLabel: string;
  status: IoTDeviceStatus;
  batteryLevel: number;
  signalStrength: number;
  lastSeen: string;
  telemetry: {
    occupancy?: boolean;
    temperature?: number; // Â°C
    humidity?: number; // %
    pressure?: number; // PSI / Bar
    spO2?: number; // %
    heartRate?: number; // BPM
    flowRate?: number; // L/min
    gpsLat?: number;
    gpsLng?: number;
  };
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
  createdAt: string;
}

export interface GlobalSearchResult {
  id: string;
  type: 'MEDICINE' | 'HOSPITAL' | 'BED' | 'BLOOD' | 'ORGAN' | 'PHARMACY';
  title: string;
  subtitle: string;
  badge: string;
  district: string;
  distanceKm?: number;
  data: any;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  language: Language;
  timestamp: string;
  suggestedActions?: { label: string; action: string; payload?: any }[];
  referencedData?: {
    type: 'medicines' | 'beds' | 'blood' | 'organs' | 'emergency';
    items: any[];
  };
}
