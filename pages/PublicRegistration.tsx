
import React, { useState } from 'react';
import { AppSettings, Customer } from '../types';
import { getStoredData, setStoredData, DEFAULT_SETTINGS, compressImage } from '../services/dataService';
import { Camera, CheckCircle, Send, User, CreditCard, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';

const PublicRegistration = () => {
  const settings = getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nik, setNik] = useState('');
  const [ktpImage, setKtpImage] = useState<string | null>(null);
  
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file);
            setKtpImage(compressed);
        } catch (err) {
            console.error(err);
            alert("Gagal memproses foto KTP.");
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ktpImage) {
        alert("Mohon upload foto KTP Anda.");
        return;
    }
    const customers = getStoredData<Customer[]>('customers', []);
    
    const newCustomer: Customer = {
        id: `p-${Date.now()}`,
        name, phone, address, nik,
        idCardImage: ktpImage,
        status: 'Pending',
        createdAt: Date.now()
    };

    setStoredData('customers', [newCustomer, ...customers]);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={56} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Pendaftaran Berhasil</h2>
              <p className="text-slate-500 max-w-xs mx-auto">Terima kasih Kak {name}. Data Anda telah terkirim dan sedang menunggu persetujuan Admin RENTO.</p>
              <p className="text-[10px] text-slate-400 mt-8">Anda dapat menutup halaman ini sekarang.</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 pb-12">
        <div className="p-6 border-b dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center p-1.5 shadow-lg shadow-red-200"><Logo src={settings.logoUrl}/></div>
            <div>
                <h1 className="font-black text-slate-800 dark:text-white uppercase leading-none tracking-tight">{settings.companyName}</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registrasi Pelanggan Baru</p>
            </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-8">
            <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-3">
                <ShieldCheck size={20} className="text-indigo-600 mt-1 flex-shrink-0" />
                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">Silakan lengkapi data diri Anda dan upload foto KTP asli sebagai syarat verifikasi keamanan penyewaan.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><CreditCard size={14}/> Foto KTP (Wajib)</label>
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center overflow-hidden hover:bg-slate-50 transition-colors group">
                        {ktpImage ? (
                            <img src={ktpImage} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center text-slate-400">
                                <Camera size={40} className="mx-auto mb-2 opacity-50" />
                                <p className="text-[10px] font-bold uppercase">Ambil Foto / Upload KTP</p>
                            </div>
                        )}
                        <input required type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleKtpUpload} />
                    </div>
                </div>

                <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap (Sesuai KTP)</label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-3.5 text-slate-400" />
                            <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white focus:ring-2 ring-red-500" placeholder="Contoh: Budi Sudarsono" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIK (Sesuai KTP)</label>
                        <div className="relative">
                            <CreditCard size={18} className="absolute left-4 top-3.5 text-slate-400" />
                            <input required value={nik} onChange={e => setNik(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white focus:ring-2 ring-red-500 font-mono" placeholder="16 Digit Nomor Induk Kependudukan" maxLength={16} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp Aktif</label>
                        <div className="relative">
                            <Phone size={18} className="absolute left-4 top-3.5 text-slate-400" />
                            <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white focus:ring-2 ring-red-500" placeholder="Contoh: 0812xxxx" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Domisili</label>
                        <div className="relative">
                            <MapPin size={18} className="absolute left-4 top-4 text-slate-400" />
                            <textarea required value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold dark:text-white focus:ring-2 ring-red-500 min-h-[100px]" placeholder="Isi alamat lengkap Anda saat ini..." />
                        </div>
                    </div>
                </div>

                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-red-200 dark:shadow-none flex items-center justify-center gap-3 transition-all active:scale-95">
                    <Send size={24}/> Kirim Pendaftaran
                </button>
                
                <p className="text-[9px] text-center text-slate-400 leading-relaxed uppercase font-bold tracking-widest px-4">Dengan mengirim data ini, saya setuju dengan seluruh syarat dan ketentuan sewa yang berlaku di RENTO.</p>
            </form>
        </div>
    </div>
  );
};

export default PublicRegistration;
