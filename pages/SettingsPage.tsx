import React, { useState, useEffect } from 'react';
// @ts-ignore
import { useLocation } from 'react-router-dom';
import { AppSettings, User, Driver, Partner } from '../types';
import { getStoredData, setStoredData, DEFAULT_SETTINGS, compressImage } from '../services/dataService';
import { getUsers, saveUser, deleteUser } from '../services/authService';
// Added Trash2 to the imports from lucide-react
import { FileText, List, X, MessageCircle, Palette, Moon, Sun, Camera, Link as LinkIcon, Clock, Save, Trash2 } from 'lucide-react';
import { Logo } from '../components/Logo';

interface Props {
    currentUser: User;
}

const SettingsPage: React.FC<Props> = ({ currentUser }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isSuperAdmin = currentUser.role === 'superadmin';
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<User[]>([]);
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [partnersList, setPartnersList] = useState<Partner[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('admin');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [linkedDriverId, setLinkedDriverId] = useState('');
  const [linkedPartnerId, setLinkedPartnerId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPackage, setNewPackage] = useState('');

  useEffect(() => {
    const loadedSettings = getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS);
    setSettings(loadedSettings);
    setUsers(getUsers());
    setDriversList(getStoredData<Driver[]>('drivers', []));
    setPartnersList(getStoredData<Partner[]>('partners', []));
  }, []);

  useEffect(() => {
      const tabParam = searchParams.get('tab');
      if (tabParam) setActiveTab(tabParam);
  }, [location.search]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: name === 'overtimeValue' ? Number(value) : value }));
    setIsSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        await setStoredData('appSettings', settings);
        setIsSaved(true);
        alert("Pengaturan berhasil disimpan!");
        // Refresh to apply changes globally
        window.location.reload();
    } catch (error) {
        console.error("Save failed:", error);
        alert("Gagal menyimpan pengaturan. Silakan coba lagi.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleThemeColorChange = (color: string) => {
      setSettings(prev => ({ ...prev, themeColor: color }));
      setIsSaved(false);
  };

  const toggleDarkMode = () => {
      setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
      setIsSaved(false);
  };

  const handleUserImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressed = await compressImage(file);
        setUserImage(compressed);
      } catch (e) { alert("Gagal memproses gambar."); }
      finally { setIsUploading(false); }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploading(true);
          try {
             const compressed = await compressImage(file);
             setSettings(prev => ({ ...prev, logoUrl: compressed }));
          } catch(e) { alert("Gagal upload logo."); }
          finally { setIsUploading(false); }
      }
  };

  const handleEditUser = (u: User) => {
      setEditingUserId(u.id);
      setUsername(u.username);
      setPassword(u.password || ''); 
      setFullName(u.name);
      setEmail(u.email || '');
      setPhone(u.phone || '');
      setRole(u.role);
      setUserImage(u.image || null);
      setLinkedDriverId(u.linkedDriverId || '');
      setLinkedPartnerId(u.linkedPartnerId || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetUserForm = () => {
      setEditingUserId(null);
      setUsername(''); setPassword(''); setFullName(''); setEmail(''); setPhone(''); setUserImage(null); setRole('admin');
      setLinkedDriverId(''); setLinkedPartnerId('');
  };

  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!username || !password || !fullName) return;
      const userPayload: User = {
          id: editingUserId || `u-${Date.now()}`,
          username, password, name: fullName, email, phone, role: role as any, image: userImage,
          linkedDriverId: role === 'driver' ? linkedDriverId : undefined,
          linkedPartnerId: role === 'partner' ? linkedPartnerId : undefined
      };
      saveUser(userPayload);
      setUsers(getUsers());
      resetUserForm();
      alert("User berhasil disimpan!");
  };

  const handleDeleteUser = (id: string) => {
      if (id === currentUser.id) return alert("Tidak bisa menghapus akun sendiri!");
      if (confirm("Apakah Anda yakin ingin menghapus user ini?")) {
          deleteUser(id);
          setUsers(getUsers());
          if (editingUserId === id) resetUserForm();
      }
  };

  const addCategory = () => {
      if(newCategory && !settings.carCategories.includes(newCategory)) {
          setSettings(prev => ({...prev, carCategories: [...prev.carCategories, newCategory]}));
          setNewCategory('');
          setIsSaved(false);
      }
  };
  const removeCategory = (cat: string) => {
      setSettings(prev => ({...prev, carCategories: prev.carCategories.filter(c => c !== cat)}));
      setIsSaved(false);
  };

  const addPackage = () => {
      if(newPackage && !settings.rentalPackages.includes(newPackage)) {
          setSettings(prev => ({...prev, rentalPackages: [...prev.rentalPackages, newPackage]}));
          setNewPackage('');
          setIsSaved(false);
      }
  };
  const removePackage = (pkg: string) => {
      setSettings(prev => ({...prev, rentalPackages: prev.rentalPackages.filter(p => p !== pkg)}));
      setIsSaved(false);
  };

  const THEME_OPTIONS = [
      { id: 'red', name: 'Abu-abu (Default)', bg: 'bg-slate-600' },
      { id: 'blue', name: 'Biru', bg: 'bg-blue-600' },
      { id: 'green', name: 'Hijau', bg: 'bg-green-600' },
      { id: 'purple', name: 'Ungu', bg: 'bg-purple-600' },
      { id: 'orange', name: 'Orange', bg: 'bg-orange-600' },
      { id: 'black', name: 'Hitam', bg: 'bg-slate-800' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Pengaturan Sistem</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Konfigurasi operasional dan akun pengguna.</p>
        </div>
        {isSaved && <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold animate-fade-in">✓ Data Tersimpan</span>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {isSuperAdmin ? (
              <>
                <button onClick={() => setActiveTab('general')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'general' ? 'bg-red-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600 hover:bg-slate-50'}`}>Umum & Invoice</button>
                <button onClick={() => setActiveTab('appearance')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'appearance' ? 'bg-red-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600 hover:bg-slate-50'}`}>Tampilan</button>
                <button onClick={() => setActiveTab('master')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'master' ? 'bg-red-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600 hover:bg-slate-50'}`}>Kategori & Paket</button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'users' ? 'bg-red-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600 hover:bg-slate-50'}`}>Manajemen User</button>
              </>
          ) : (
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Profil Saya</button>
          )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          
          {activeTab === 'appearance' && isSuperAdmin && (
              <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
                  <div className="flex items-center gap-3 border-b dark:border-slate-700 pb-4">
                      <Palette size={32} className="text-red-600" />
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tampilan Aplikasi</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Sesuaikan warna tema dan mode tampilan.</p>
                      </div>
                  </div>
                  
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-sm uppercase tracking-wider">Warna Tema Utama</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          {THEME_OPTIONS.map(option => (
                              <button 
                                  key={option.id}
                                  type="button"
                                  onClick={() => handleThemeColorChange(option.id)}
                                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.themeColor === option.id ? 'border-red-600 bg-red-50 dark:bg-red-900/20 scale-105 shadow-md' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                              >
                                  <div className={`w-8 h-8 rounded-full ${option.bg} shadow-sm`}></div>
                                  <span className={`text-xs font-bold ${settings.themeColor === option.id ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                      {option.name}
                                  </span>
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="pt-6 border-t dark:border-slate-700">
                       <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-sm uppercase tracking-wider">Mode Tampilan</h4>
                       <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => !settings.darkMode && toggleDarkMode()}
                                className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${!settings.darkMode ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >
                                <Sun size={24} /> Mode Terang
                            </button>
                            <button
                                type="button"
                                onClick={() => settings.darkMode && toggleDarkMode()}
                                className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${settings.darkMode ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >
                                <Moon size={24} /> Mode Gelap
                            </button>
                       </div>
                  </div>

                  <div className="pt-6 border-t dark:border-slate-700">
                     <button type="submit" disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest w-full shadow-lg shadow-red-100 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 transition-all">
                        {isSaving ? <Clock className="animate-spin" size={18}/> : <Save size={18}/>}
                        {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Tampilan'}
                     </button>
                  </div>
              </form>
          )}

          {activeTab === 'general' && isSuperAdmin && (
             <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
                 <div className="flex items-center gap-6 pb-6 border-b dark:border-slate-700">
                     <div className="w-20 h-20 border rounded-xl p-2 flex items-center justify-center bg-white shadow-inner">
                         <Logo src={settings.logoUrl} />
                     </div>
                     <div>
                         <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Logo Perusahaan</label>
                         <label className="cursor-pointer bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold transition-colors inline-block dark:text-white">
                             Pilih File Logo
                             <input 
                                 type="file" 
                                 accept="image/*" 
                                 className="hidden" 
                                 onChange={handleLogoUpload} 
                             />
                         </label>
                         {isUploading && <p className="text-[10px] text-red-600 font-bold mt-1 animate-pulse">Memproses gambar...</p>}
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Nama Perusahaan (Lengkap)</label>
                         <input name="companyName" value={settings.companyName} onChange={handleChange} className="w-full border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-3 font-bold" />
                     </div>
                     <div>
                         <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Nama Display Aplikasi (Singkat)</label>
                         <input name="displayName" value={settings.displayName} onChange={handleChange} className="w-full border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-3 font-bold" placeholder="Contoh: RentoRentCar" />
                     </div>
                     <div className="md:col-span-2">
                         <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Tagline / Slogan</label>
                         <input name="tagline" value={settings.tagline} onChange={handleChange} className="w-full border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-3 font-bold" />
                     </div>
                     <div className="md:col-span-2">
                         <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Alamat Kantor</label>
                         <input name="address" value={settings.address} onChange={handleChange} className="w-full border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-3 font-bold" />
                     </div>
                     <div>
                         <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Nomor Telepon</label>
                         <input name="phone" value={settings.phone} onChange={handleChange} className="w-full border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-3 font-bold" />
                     </div>
                     <div>
                         <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Alamat Email</label>
                         <input name="email" value={settings.email} onChange={handleChange} className="w-full border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-3 font-bold" />
                     </div>
                     
                     <div className="md:col-span-2 pt-6 border-t mt-4 dark:border-slate-700">
                        <h3 className="font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-tighter"><FileText size={18} className="text-red-600"/> Konten Invoice & Nota</h3>
                     </div>

                     <div className="md:col-span-2">
                         <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Ketentuan Pembayaran</label>
                         <textarea name="paymentTerms" value={settings.paymentTerms} onChange={handleChange} className="w-full border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-3 font-bold text-xs" rows={4} />
                     </div>
                     
                     <div className="md:col-span-2">
                         <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Syarat & Ketentuan Sewa</label>
                         <textarea name="termsAndConditions" value={settings.termsAndConditions} onChange={handleChange} className="w-full border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-3 font-bold text-xs" rows={6} />
                     </div>

                     <div className="md:col-span-2">
                         <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Footer Invoice (Kecil di bawah)</label>
                         <input name="invoiceFooter" value={settings.invoiceFooter} onChange={handleChange} className="w-full border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-3 font-bold text-xs" />
                     </div>

                     <div className="md:col-span-2 pt-6 border-t mt-4 dark:border-slate-700">
                        <h3 className="font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-tighter"><MessageCircle size={18} className="text-red-600"/> Template Chat WhatsApp</h3>
                        <textarea 
                             name="whatsappTemplate" 
                             value={settings.whatsappTemplate} 
                             onChange={handleChange} 
                             className="w-full border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-4 font-mono text-xs leading-relaxed" 
                             rows={10} 
                        />
                        <p className="text-[9px] text-slate-400 mt-2">*Gunakan variabel {'{name}'}, {'{unit}'}, {'{total}'}, dll untuk otomatisasi.</p>
                     </div>
                 </div>
                 <button type="submit" disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-red-100 dark:shadow-none w-full flex items-center justify-center gap-2 active:scale-95 transition-all">
                    {isSaving ? <Clock className="animate-spin" size={18}/> : <Save size={18}/>}
                    {isSaving ? 'Menyimpan...' : 'Simpan Seluruh Pengaturan'}
                 </button>
             </form>
          )}

          {activeTab === 'master' && isSuperAdmin && (
              <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-white uppercase tracking-tighter">
                          <Clock size={20} className="text-red-600"/> Aturan Overtime
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Tipe Denda</label>
                              <div className="flex p-1 bg-white dark:bg-slate-950 rounded-xl border dark:border-slate-800">
                                  <button 
                                    type="button"
                                    onClick={() => setSettings(prev => ({...prev, overtimeType: 'Percentage'}))}
                                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${settings.overtimeType === 'Percentage' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}
                                  >
                                      Persentase
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => setSettings(prev => ({...prev, overtimeType: 'Nominal'}))}
                                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${settings.overtimeType === 'Nominal' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}
                                  >
                                      Nominal
                                  </button>
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                                  Nilai Denda ({settings.overtimeType === 'Percentage' ? '% per Jam' : 'Rp per Jam'})
                              </label>
                              <div className="relative">
                                  <span className="absolute left-4 top-3 text-slate-400 font-bold">
                                      {settings.overtimeType === 'Percentage' ? '%' : 'Rp'}
                                  </span>
                                  <input 
                                    type="number"
                                    name="overtimeValue"
                                    value={settings.overtimeValue}
                                    onChange={handleChange}
                                    className="w-full border dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-xl p-3 pl-10 font-black focus:ring-2 ring-red-500 outline-none"
                                  />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <h3 className="font-black text-sm mb-4 flex items-center gap-2 text-slate-800 dark:text-white uppercase tracking-widest"><List size={18} className="text-red-600"/> Kategori Kendaraan</h3>
                          <div className="flex gap-2 mb-4">
                              <input 
                                className="border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-2.5 flex-1 font-bold text-sm" 
                                placeholder="Tambah (e.g. Luxury)" 
                                value={newCategory} 
                                onChange={e => setNewCategory(e.target.value)}
                              />
                              <button type="button" onClick={addCategory} className="bg-slate-800 dark:bg-slate-700 text-white px-4 rounded-xl font-bold hover:bg-black transition-colors">Tambah</button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {settings.carCategories.map(cat => (
                                  <span key={cat} className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-200 dark:border-slate-600 shadow-sm">
                                      {cat}
                                      <button type="button" onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-red-600 transition-colors"><X size={14}/></button>
                                  </span>
                              ))}
                          </div>
                      </div>

                      <div>
                          <h3 className="font-black text-sm mb-4 flex items-center gap-2 text-slate-800 dark:text-white uppercase tracking-widest"><List size={18} className="text-red-600"/> Paket Rental</h3>
                          <div className="flex gap-2 mb-4">
                              <input 
                                className="border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl p-2.5 flex-1 font-bold text-sm" 
                                placeholder="Tambah (e.g. 6 Jam)" 
                                value={newPackage} 
                                onChange={e => setNewPackage(e.target.value)}
                              />
                              <button type="button" onClick={addPackage} className="bg-slate-800 dark:bg-slate-700 text-white px-4 rounded-xl font-bold hover:bg-black transition-colors">Tambah</button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {settings.rentalPackages.map(pkg => (
                                  <span key={pkg} className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-200 dark:border-slate-600 shadow-sm">
                                      {pkg}
                                      <button type="button" onClick={() => removePackage(pkg)} className="text-slate-300 hover:text-red-600 transition-colors"><X size={14}/></button>
                                  </span>
                              ))}
                          </div>
                      </div>
                  </div>
                  
                  <div className="pt-6 border-t dark:border-slate-700">
                     <button type="submit" disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest w-full shadow-lg shadow-red-100 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 transition-all">
                        {isSaving ? <Clock className="animate-spin" size={18}/> : <Save size={18}/>}
                        {isSaving ? 'Menyimpan...' : 'Simpan Master Data'}
                     </button>
                  </div>
              </form>
          )}

          {activeTab === 'users' && isSuperAdmin && (
              <div className="space-y-8 animate-fade-in">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tighter">{editingUserId ? 'Edit Akun Pengguna' : 'Tambah Akses Pengguna'}</h3>
                          {editingUserId && (
                              <button onClick={resetUserForm} className="text-xs font-black text-red-600 hover:underline uppercase tracking-widest flex items-center gap-1">
                                  <X size={14}/> Batal Edit
                              </button>
                          )}
                      </div>
                      
                      <form onSubmit={handleSaveUser} className="space-y-6">
                          <div className="flex flex-col items-center mb-6">
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Foto Profil</label>
                              <div className="relative w-24 h-24 bg-white dark:bg-slate-950 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden group hover:border-red-500 transition-colors cursor-pointer shadow-inner">
                                  {userImage ? (
                                      <>
                                          <img src={userImage} alt="Preview" className="w-full h-full object-cover" />
                                          <button 
                                              type="button"
                                              onClick={() => setUserImage(null)}
                                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                          >
                                              <X size={20} />
                                          </button>
                                      </>
                                  ) : (
                                      <div className="text-center text-slate-400 dark:text-slate-500 pointer-events-none">
                                          <Camera className="w-8 h-8 mx-auto mb-1" />
                                          <span className="text-[8px] font-black uppercase">Upload</span>
                                      </div>
                                  )}
                                  <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                      onChange={handleUserImageUpload}
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nama Lengkap</label>
                                <input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-xl p-3 font-bold text-sm" placeholder="Nama Karyawan" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Jabatan / Role</label>
                                <select value={role} onChange={e => setRole(e.target.value)} className="w-full border dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-xl p-3 font-bold text-sm">
                                    <option value="admin">Admin Operasional</option>
                                    <option value="driver">Driver (Supir)</option>
                                    <option value="partner">Investor (Pemilik Unit)</option>
                                    <option value="superadmin">Super Admin</option>
                                </select>
                            </div>
                            {role === 'driver' && (
                                <div className="md:col-span-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-[10px] font-black uppercase text-yellow-800 dark:text-yellow-500 mb-2 flex items-center gap-1">
                                        <LinkIcon size={12}/> Hubungkan dengan Database Driver
                                    </label>
                                    <select value={linkedDriverId} onChange={e => setLinkedDriverId(e.target.value)} className="w-full border dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-xl p-2.5 font-bold text-xs">
                                        <option value="">-- Pilih Data Driver --</option>
                                        {driversList.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {role === 'partner' && (
                                <div className="md:col-span-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-900/30 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-[10px] font-black uppercase text-purple-800 dark:text-purple-500 mb-2 flex items-center gap-1">
                                        <LinkIcon size={12}/> Hubungkan dengan Database Investor
                                    </label>
                                    <select value={linkedPartnerId} onChange={e => setLinkedPartnerId(e.target.value)} className="w-full border dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-xl p-2.5 font-bold text-xs">
                                        <option value="">-- Pilih Data Investor --</option>
                                        {partnersList.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Username Login</label>
                                <input required value={username} onChange={e => setUsername(e.target.value)} className="w-full border dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-xl p-3 font-bold text-sm" placeholder="username_login" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Password Baru</label>
                                <input type="text" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-xl p-3 font-bold text-sm" placeholder="Isi password..." />
                            </div>
                          </div>

                          <div className="pt-4 border-t dark:border-slate-700 flex gap-2">
                              {editingUserId && (
                                  <button type="button" onClick={resetUserForm} className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest">Batal</button>
                              )}
                              <button type="submit" disabled={isUploading} className="flex-1 bg-slate-800 dark:bg-slate-700 hover:bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">
                                  {editingUserId ? 'Simpan Perubahan User' : 'Simpan User Baru'}
                              </button>
                          </div>
                      </form>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                          <thead className="bg-slate-50 dark:bg-slate-900/50">
                              <tr>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi User</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Hak Akses</th>
                                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Kontrol</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                              {users.map(u => (
                                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                              <img className="h-10 w-10 rounded-full object-cover mr-3 bg-slate-100 border-2 border-slate-100" src={u.image || `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt="" />
                                              <div>
                                                  <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{u.name}</div>
                                                  <div className="text-[10px] text-slate-500 font-mono">@{u.username}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`px-3 py-1 inline-flex text-[9px] leading-5 font-black rounded-full uppercase tracking-tighter ${u.role === 'superadmin' ? 'bg-red-600 text-white shadow-sm' : u.role === 'driver' ? 'bg-yellow-100 text-yellow-800' : u.role === 'partner' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>
                                              {u.role}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right">
                                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => handleEditUser(u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16}/></button>
                                              {u.id !== currentUser.id && (
                                                  <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                              )}
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

// Internal sub-component for icons used above
const Edit2 = ({size}: {size:number}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;

export default SettingsPage;