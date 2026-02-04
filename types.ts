
export enum BookingStatus {
  PENDING_APPROVAL = 'Pending Approval',
  BOOKED = 'Booked',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  MAINTENANCE = 'Maintenance'
}

export enum PaymentStatus {
  UNPAID = 'Belum Lunas',
  PARTIAL = 'DP',
  PAID = 'Lunas'
}

export type UserRole = 'superadmin' | 'admin' | 'driver' | 'partner';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  linkedDriverId?: string;
  linkedPartnerId?: string;
  image?: string | null;
}

export interface AppSettings {
  companyName: string;
  displayName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  invoiceFooter: string;
  logoUrl?: string | null;
  stampUrl?: string | null;
  themeColor: string;
  darkMode: boolean;
  paymentTerms: string;
  termsAndConditions: string;
  whatsappTemplate: string;
  carCategories: string[];
  rentalPackages: string[];
  overtimeType: 'Percentage' | 'Nominal';
  overtimeValue: number;
  gpsProvider: 'Simulation' | 'Traccar' | 'Custom';
  gpsApiUrl?: string;
  gpsApiToken?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  nik?: string;
  idCardImage?: string;
  status?: 'Pending' | 'Approved';
  createdAt?: number;
}

export interface Partner {
  id: string;
  name: string;
  phone: string;
  splitPercentage: number;
  image?: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  address: string;
  image?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  dailyRate: number;
  status: 'Active' | 'Inactive';
  image: string;
}

export interface HighSeason {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  priceIncrease: number;
}

export interface Car {
  id: string;
  name: string;
  brand?: string;
  plate: string;
  type: string;
  pricing: { [packageName: string]: number };
  investorSetoran: number;
  driverSalary: number;
  price12h?: number; 
  price24h?: number;
  image: string;
  partnerId?: string | null;
  status: 'Available' | 'Unavailable';
  gpsDeviceId?: string;
}

export interface VehicleChecklist {
  odometer: number;
  fuelLevel: string;
  speedometerImage: string;
  physicalImages: {
    front?: string;
    back?: string;
    left?: string;
    right?: string;
  };
  notes?: string;
  checkedAt: number;
  checkedBy?: string;
}

export interface Booking {
  id: string;
  carId: string;
  isRentToRent?: boolean;
  vendorId?: string;
  externalCarName?: string;
  externalCarPlate?: string;
  vendorFee?: number;
  driverId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string; 
  packageType: string;
  destination: 'Dalam Kota' | 'Luar Kota';
  securityDepositType: 'Uang' | 'Barang';
  securityDepositValue: number;
  securityDepositDescription: string;
  securityDepositImage?: string;
  basePrice: number;
  driverFee: number;
  highSeasonFee: number;
  deliveryFee: number;
  overtimeFee?: number;
  extraCost?: number;
  extraCostDescription?: string;
  discount?: number;
  totalPrice: number;
  amountPaid: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes: string;
  customerNote?: string;
  driverNote?: string;
  // Added checklist property to fix type errors in BookingPage
  checklist?: VehicleChecklist;
  createdAt: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  description: string;
  bookingId?: string;
  receiptImage?: string;
  status?: 'Pending' | 'Paid'; 
  relatedId?: string;
}
