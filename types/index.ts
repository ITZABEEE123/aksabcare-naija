// User and Authentication Types
export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'hospital_admin' | 'pharmacy_admin' | 'super_admin';
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
}

// Hospital Types
export interface Hospital {
  id: string;
  name: string;
  address: Address;
  contact: ContactInfo;
  services: string[];
  specializations: string[];
  operatingHours: OperatingHours;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ContactInfo {
  phone: string;
  email?: string;
  website?: string;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  isEmergencyOpen?: boolean;
}

// Doctor Types
export interface Doctor {
  id: string;
  userId: string;
  user: User;
  specialization: string;
  licenseNumber: string;
  country: string;
  experience: number;
  consultationFee: number;
  isAvailable: boolean;
  rating: number;
  totalConsultations: number;
  languages: string[];
  availability: DoctorAvailability[];
  education: Education[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
  country: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: User['role'];
}

// Search and Filter Types
export interface HospitalSearchFilters {
  query?: string;
  state?: string;
  city?: string;
  services?: string[];
  isEmergencyAvailable?: boolean;
  radius?: number;
  coordinates?: [number, number];
}

export interface DoctorSearchFilters {
  query?: string;
  specialization?: string;
  country?: string;
  maxFee?: number;
  isAvailable?: boolean;
  languages?: string[];
}
