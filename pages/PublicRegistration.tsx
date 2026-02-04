
import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, Customer, Car, Booking, BookingStatus, PaymentStatus } from '../types';
import { getStoredData, setStoredData, DEFAULT_SETTINGS, compressImage } from '../services/dataService';
import { Camera, CheckCircle, Send, User, CreditCard, MapPin, Phone, ShieldCheck, Car as CarIcon, Calendar, Clock, ChevronRight, Search, UserPlus, UserCheck, AlertTriangle, Filter, MessageSquare } from 'lucide-react';
import { Logo } from '../components/Logo';

const PublicRegistration = () => {
  const [step, setStep] = useState(1);
  const [regType, setRegType] = useState<'new' | 'existing'>('new');
  const settings = getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS);
  
  // App Data
  const cars = getStoredData<Car[]>('cars', []);
  const bookings = getStoredData<Booking[]>('bookings', []);
  const customers = getStoredData<Customer[]>('customers', []);

  // Form - Identity
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nik, setNik] = useState('');
  const [ktpImage, setKtpImage] = useState<string | null>(null);
  const [verifiedCustomer, setVerifiedCustomer] = useState<Customer | null>(null);
  const [identifier, setIdentifier] = useState(''); // Input for NIK or Phone
  
  // Form - Dates
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('08:00');
  
  // Form - Vehicle
  const [selectedCarId, setSelectedCarId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Gallery Filter States
  const [carSearch, setCarSearch] = useState('');
  const [carTypeFilter, setCarTypeFilter] = useState('All');
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Handle Verification for Existing Customers (NIK or Phone)
  const handleVerifyCustomer = () => {
      setError('');
      if (!identifier) return;
      
      const cleanInput = identifier.replace(/\D/g, '');
      const found = customers.find(c => {
          const matchNik = c.nik === identifier;
          const matchPhone = c.phone.replace(/\D/g, '') === cleanInput;
          return matchNik || (cleanInput.length >= 10 && matchPhone);
      });

      if (found) {
          setVerifiedCustomer(found);
          setName(found.name);
          setPhone(found.phone);
          setNik(found.nik || '');
      } else {
          setVerifiedCustomer(null);
          setError('Data tidak ditemukan. Pastikan NIK atau No. WA sudah benar atau gunakan tab Pelanggan Baru.');
      }
  };

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file);
            setKtpImage(compressed);
        } catch (err) {
            alert("Gagal memproses foto KTP.");
        }
    }
  };

  // Availability Logic for Gallery with Search & Filter
  const availableCars = useMemo(() => {
      if (step < 3) return [];
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      
      let filtered = cars.filter(car => {
          if (car.status !== 'Available') return false;
          
          // Availability check
          const isBusy = bookings.some(b => {
              if (b.status === BookingStatus.CANCELLED) return false;
              if (b.carId !== car.id) return false;
              const bStart = new Date(b.startDate);
              const bEnd = new Date(b.endDate);
              return (start < bEnd && end > bStart);
          });
          if (isBusy) return false;

          // Category Filter
          if (carTypeFilter !== 'All' && car.type !== carTypeFilter) return false;

          // Search Filter
          if (carSearch) {
              const lowerSearch = carSearch.toLowerCase();
              return car.name.toLowerCase().includes(lowerSearch) || car.brand?.toLowerCase().includes(lowerSearch);
          }

          return true;
      });

      return filtered;
  }, [cars, bookings, startDate, startTime, endDate, endTime, carSearch, carTypeFilter, step]);

  const nextStep = () => {
      if (step === 1) {
          if (regType === 'existing' && !verifiedCustomer) {
              handleVerifyCustomer();
              return;
          }
          if (regType === 'new' && (!name || !phone || !nik)) {
              alert("Mohon lengkapi data identitas Anda.");
              return;
          }
      }
      if (step === 2) {
          const start = new Date(`${startDate}T${startTime}`);
          const end = new Date(`${endDate}T${endTime}`);
          if (end <= start) {
              alert("Waktu selesai harus setelah waktu mulai.");
              return;
          }
      }
      setStep(step + 1);
      window.scrollTo(0, 0);
  };

  const prevStep = () => {
      setStep(step - 1);
      window.scrollTo(0, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarId) {
        alert("Mohon pilih kendaraan.");
        return;
    }

    let finalCustomerId = verifiedCustomer?.id;
    
    // Create new customer record if it's a new registration
    if (regType === 'new') {
        const newCustomer: Customer = {
            id: `p-${Date.now()}`,
            name, phone, address, nik,
            idCardImage: ktpImage || undefined,
            status: 'Pending',
            createdAt: Date.now()
        };
        finalCustomerId = newCustomer.id;
        const currentCustomers = getStoredData<Customer[]>('customers', []);
        setStoredData('customers', [newCustomer, ...currentCustomers]);
    }

    // Create the Booking Submission
    const car = cars.find(c => c.id === selectedCarId);
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    
    const basePrice = (car?.pricing?.['24 Jam (Dalam Kota)'] || car?.price24h || 0) * days;

    const newBooking: Booking = {
        id: `pub-${Date.now()}`,
        carId: selectedCarId,
        customerId: finalCustomerId,
        customerName: name,
        customerPhone: phone,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        packageType: '24 Jam (Dalam Kota)',
        destination: 'Dalam Kota',
        securityDepositType: 'Barang',
        securityDepositValue: 0,
        securityDepositDescription: 'Ditinjau oleh Admin',
        basePrice: basePrice,
        driverFee: 0,
        highSeasonFee: 0,
        deliveryFee: 0,
        totalPrice: basePrice,
        amountPaid: 0,
        status: BookingStatus.PENDING_APPROVAL,
        paymentStatus: PaymentStatus.UNPAID,
        notes: `Pengajuan mandiri (${regType === 'new' ? 'Baru' : 'Lama'}). Alamat Antar: ${deliveryAddress || '-'}`,
        customerNote: deliveryAddress,
        createdAt: Date.now()
    };

    const existingBookings = getStoredData<Booking[]>('bookings', []);
    setStoredData('bookings', [newBooking, ...existingBookings]);
    
    // Prepare WhatsApp Message
    const adminPhone = settings.phone.replace(/\D/g, '').replace(/^0/, '62');
    const waMessage = `*PENGAJUAN SEWA MANDIRI*\n\nHalo Admin ${settings.displayName},\nSaya ingin mengajukan sewa unit sebagai berikut:\n\n👤 *Penyewa:* ${name}\n📱 *WA:* ${phone}\n🚗 *Unit:* ${car?.name} (${car?.plate})\n📅 *Mulai:* ${start.toLocaleString('id-ID')}\n📅 *Selesai:* ${end.toLocaleString('id-ID')}\n📍 *Alamat Antar:* ${deliveryAddress || '-'}\n\nMohon konfirmasi ketersediaan unit dan instruksi pembayaran DP. Terima kasih!`;
    
    setIsSubmitted(true);

    // Redirect to WhatsApp after brief delay
    setTimeout(() => {
        window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(waMessage)}`, '_blank');
    }, 1500);
  };

  if (isSubmitted) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100">
                  <CheckCircle size={56} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Berhasil Terkirim</h2>
              <p className="text-slate-500 max-w-xs mx-auto mb-6">Halo Kak {name.split(' ')[0]}, pengajuan Anda telah tersimpan. Anda akan diarahkan ke WhatsApp Admin untuk konfirmasi akhir.</p>
              
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm w-full max-w-xs mb-8">
                  <div className="flex items-center justify-center gap-3 text-indigo-600 animate-pulse">
                      <MessageSquare size={24}/>
                      <span className="font-bold text-sm">Menghubungkan ke WhatsApp...</span>
                  </div>
              </div>

              <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all">Selesai</button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 pb-24">
        {/* Header & Stepper */}
        <div className="p-6 border-b dark:border-slate-800 flex flex-col gap-6 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-red-200"><Logo src={settings.logoUrl}/></div>
                    <div>
                        <h1 className="font-black text-slate-800 dark:text-white uppercase leading-none tracking-tight text-sm sm:text-base">{settings.displayName}</h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sewa Mobil Mandiri</p>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-red-600' : 'w-2 bg-slate-200 dark:bg-slate-800'}`}></div>
                    ))}
                </div>
            </div>
            
            <div className="flex items-center justify-between px-2">
                <div className={`text-[10px] font-black uppercase tracking-widest ${step === 1 ? 'text-red-600' : 'text-slate-300'}`}>1. Identitas</div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${step === 2 ? 'text-red-600' : 'text-slate-300'}`}>2. Jadwal</div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${step === 3 ? 'text-red-600' : 'text-slate-300'}`}>3. Armada</div>
            </div>
        </div>

        <div className="max-w-xl mx-auto px-6 py-8">
            <form onSubmit={handleSubmit}>
                {/* STEP 1: IDENTITY */}
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        {/* Tab Switcher */}
                        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 shadow-inner">
                            <button 
                                type="button" 
                                onClick={() => { setRegType('new'); setVerifiedCustomer(null); }}
                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${regType === 'new' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-md' : 'text-slate-500'}`}
                            >
                                <UserPlus size={16}/> Pelanggan Baru
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setRegType('existing')}
                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${regType === 'existing' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-md' : 'text-slate-500'}`}
                            >
                                <UserCheck size={16}/> Sudah Terdaftar
                            </button>
                        </div>

                        {regType === 'existing' ? (
                            <div className="space-y-6">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-3">
                                    <ShieldCheck size={20} className="text-indigo-600 mt-1 flex-shrink-0" />
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">Masukkan NIK KTP atau Nomor WhatsApp Anda yang sudah terdaftar di sistem kami.</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">NIK ATAU NOMOR WA</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <CreditCard size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                            <input 
                                                required 
                                                value={identifier} 
                                                onChange={e => setIdentifier(e.target.value)} 
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-black dark:text-white focus:ring-2 ring-red-500 font-mono tracking-widest" 
                                                placeholder="NIK / No. WhatsApp" 
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={handleVerifyCustomer}
                                            className="bg-slate-800 text-white px-4 rounded-2xl active:scale-95 transition-transform"
                                        >
                                            <Search size={20}/>
                                        </button>
                                    </div>
                                    {error && <p className="text-[10px] text-red-600 font-bold ml-1 mt-1 flex items-center gap-1"><AlertTriangle size={10}/> {error}</p>}
                                </div>

                                {verifiedCustomer && (
                                    <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-3xl border border-green-100 dark:border-green-800 animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                                                <User size={24}/>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Selamat Datang,</p>
                                                <h4 className="font-black text-slate-800 dark:text-white uppercase text-lg leading-tight">{verifiedCustomer.name}</h4>
                                                <p className="text-xs text-slate-500 font-medium">{verifiedCustomer.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Lengkap</label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                        <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white focus:ring-2 ring-red-500" placeholder="Sesuai KTP" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp Aktif</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                        <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white focus:ring-2 ring-red-500" placeholder="08xxxxxxxx" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">NIK (16 Digit)</label>
                                    <div className="relative">
                                        <CreditCard size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                        <input required value={nik} onChange={e => setNik(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white focus:ring-2 ring-red-500 font-mono tracking-widest" placeholder="317xxxxxxxx" maxLength={16} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Alamat Domisili</label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-4 top-4 text-slate-400" />
                                        <textarea required value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white focus:ring-2 ring-red-500 min-h-[100px]" placeholder="Alamat saat ini" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 ml-1">Upload Foto KTP</label>
                                    <div className="relative aspect-video bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center overflow-hidden group hover:border-red-500 transition-colors">
                                        {ktpImage ? <img src={ktpImage} className="w-full h-full object-cover" /> : <div className="text-center text-slate-400"><Camera size={32} className="mx-auto mb-2 opacity-50"/><p className="text-[9px] font-bold uppercase">Ambil Foto KTP</p></div>}
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleKtpUpload} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button type="button" onClick={nextStep} className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-red-100 dark:shadow-none flex items-center justify-center gap-3 transition-all active:scale-95">
                            Lanjutkan <ChevronRight size={20}/>
                        </button>
                    </div>
                )}

                {/* STEP 2: DATES */}
                {step === 2 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-3">
                            <Calendar size={20} className="text-indigo-600 mt-1 flex-shrink-0" />
                            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">Tentukan waktu sewa Anda. Kami akan menampilkan unit yang tersedia pada jadwal tersebut.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mulai Sewa</label>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                    </div>
                                    <div className="relative">
                                        <Clock size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                        <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Selesai Sewa</label>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                    </div>
                                    <div className="relative">
                                        <Clock size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                        <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Alamat Penjemputan / Antar (Opsional)</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-4 top-4 text-slate-400" />
                                <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white focus:ring-2 ring-red-500 min-h-[100px]" placeholder="Misal: Lobby Hotel Amaris" />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button type="button" onClick={prevStep} className="flex-1 py-5 rounded-3xl font-black uppercase tracking-widest text-xs bg-slate-100 text-slate-500">Kembali</button>
                            <button type="button" onClick={nextStep} className="flex-[2] bg-red-600 hover:bg-red-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95">
                                Lihat Armada <ChevronRight size={20}/>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: VEHICLE GALLERY */}
                {step === 3 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="flex flex-col gap-2">
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-xl">Pilih Kendaraan Ready</h3>
                            <p className="text-xs text-slate-500 font-medium">Daftar unit yang tersedia pada periode {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                        </div>

                        {/* Search & Category Filter */}
                        <div className="space-y-4">
                            <div className="relative">
                                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Cari model mobil (Avanza, Xpander...)" 
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white focus:ring-2 ring-red-500 transition-all"
                                    value={carSearch}
                                    onChange={e => setCarSearch(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                                <button 
                                    type="button"
                                    onClick={() => setCarTypeFilter('All')}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${carTypeFilter === 'All' ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    Semua
                                </button>
                                {settings.carCategories.map(cat => (
                                    <button 
                                        key={cat}
                                        type="button"
                                        onClick={() => setCarTypeFilter(cat)}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${carTypeFilter === cat ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {availableCars.length === 0 ? (
                                <div className="col-span-full py-16 text-center bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CarIcon size={32} className="text-slate-300 dark:text-slate-500"/>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold px-6">Maaf, unit tidak ditemukan atau sudah terbooking pada jadwal ini.</p>
                                    <button type="button" onClick={() => { setCarSearch(''); setCarTypeFilter('All'); }} className="text-red-600 font-black uppercase text-[10px] mt-4 tracking-widest underline">Reset Filter</button>
                                </div>
                            ) : (
                                availableCars.map(car => (
                                    <div 
                                        key={car.id} 
                                        onClick={() => setSelectedCarId(car.id)}
                                        className={`group relative rounded-[2rem] overflow-hidden border-4 transition-all duration-300 cursor-pointer ${selectedCarId === car.id ? 'border-red-600 scale-[1.02] shadow-2xl' : 'border-transparent bg-slate-50 dark:bg-slate-800'}`}
                                    >
                                        <div className="aspect-[4/3] overflow-hidden">
                                            <img src={car.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute inset-0 flex flex-col justify-end text-white">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <span className="text-[8px] font-black uppercase tracking-widest bg-red-600 px-2 py-0.5 rounded mb-1 inline-block">{car.type}</span>
                                                    <h4 className="font-black text-lg uppercase leading-tight">{car.name}</h4>
                                                    <p className="text-[10px] font-mono opacity-80">{car.plate}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-bold uppercase opacity-70">Harga / Hari</p>
                                                    <p className="font-black text-sm">Rp {(car.pricing?.['24 Jam (Dalam Kota)'] || car.price24h || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedCarId === car.id && (
                                            <div className="absolute top-4 right-4 bg-red-600 text-white p-1.5 rounded-full shadow-lg">
                                                <CheckCircle size={20}/>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {selectedCarId && (
                            <div className="p-6 bg-slate-900 rounded-[2rem] text-white animate-in zoom-in-95 duration-300 shadow-2xl">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                                    <CheckCircle size={14}/> Ringkasan Pengajuan
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="text-slate-400">Unit Terpilih</span>
                                        <span className="font-bold uppercase text-red-400">{cars.find(c => c.id === selectedCarId)?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Total Durasi</span>
                                        <span className="font-bold">{Math.max(1, Math.ceil((new Date(`${endDate}T${endTime}`).getTime() - new Date(`${startDate}T${startTime}`).getTime()) / (1000 * 60 * 60 * 24)))} Hari</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button type="button" onClick={prevStep} className="flex-1 py-5 rounded-3xl font-black uppercase tracking-widest text-xs bg-slate-100 text-slate-500">Ganti Jadwal</button>
                            <button 
                                type="submit" 
                                disabled={!selectedCarId}
                                className="flex-[2] bg-red-600 disabled:bg-slate-300 hover:bg-red-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                            >
                                <Send size={20}/> Ajukan Sekarang
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    </div>
  );
};

export default PublicRegistration;
