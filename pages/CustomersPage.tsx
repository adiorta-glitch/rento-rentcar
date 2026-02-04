
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Customer, User } from '../types';
import { getStoredData, setStoredData, exportToExcel, importFromExcel, mergeData, compressImage, downloadTemplateExcel } from '../services/dataService';
import { Plus, Trash2, Edit2, Phone, MapPin, X, UserCircle, Upload, Download, Search, FileSpreadsheet, ChevronDown, Info, Camera, CheckCircle, Clock, CreditCard, Share2 } from 'lucide-react';

interface Props {
    currentUser: User;
}

const CustomersPage: React.FC<Props> = ({ currentUser }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'approved' | 'pending'>('approved');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nik, setNik] = useState('');
  const [ktpImage, setKtpImage] = useState<string | null>(null);

  const isSuperAdmin = currentUser.role === 'superadmin';

  useEffect(() => {
    setCustomers(getStoredData<Customer[]>('customers', []));
    
    const handleClickOutside = (event: MouseEvent) => {
        if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
            setIsActionMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    let list = customers.filter(c => (c.status || 'Approved') === (activeSubTab === 'approved' ? 'Approved' : 'Pending'));
    if (!searchTerm) return list;
    const lower = searchTerm.toLowerCase();
    return list.filter(c => 
        c.name.toLowerCase().includes(lower) || 
        c.phone.includes(searchTerm) ||
        (c.nik && c.nik.includes(searchTerm)) ||
        (c.address && c.address.toLowerCase().includes(lower))
    );
  }, [searchTerm, customers, activeSubTab]);

  const handleShareLink = () => {
    const registrationLink = `${window.location.origin}/#/register`;
    navigator.clipboard.writeText(registrationLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const openModal = (cust?: Customer) => {
    if (cust) {
        setEditingCustomer(cust);
        setName(cust.name);
        setPhone(cust.phone);
        setAddress(cust.address);
        setNik(cust.nik || '');
        setKtpImage(cust.idCardImage || null);
    } else {
        setEditingCustomer(null);
        setName(''); setPhone(''); setAddress(''); setNik(''); setKtpImage(null);
    }
    setIsModalOpen(true);
  };

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const res = await compressImage(file);
              setKtpImage(res);
          } catch(e) {
              alert("Gagal memproses foto KTP.");
          }
      }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newCust: Customer = {
        id: editingCustomer ? editingCustomer.id : Date.now().toString(),
        name, phone, address, nik, 
        idCardImage: ktpImage || undefined,
        status: editingCustomer?.status || 'Approved'
    };
    let updated = editingCustomer ? customers.map(c => c.id === editingCustomer.id ? newCust : c) : [newCust, ...customers];
    setCustomers(updated);
    setStoredData('customers', updated);
    setIsModalOpen(false);
  };

  const handleApprove = (id: string) => {
      const updated = customers.map(c => c.id === id ? { ...c, status: 'Approved' as const } : c);
      setCustomers(updated);
      setStoredData('customers', updated);
  };

  const handleDelete = (id: string) => {
      if(window.confirm('Hapus data pelanggan ini secara permanen?')) {
          const updated = customers.filter(c => c.id !== id);
          setCustomers(updated);
          setStoredData('customers', updated);
      }
  };

  const handleExport = () => {
    const data = filteredCustomers.map(c => ({ Nama: c.name, NIK: c.nik, WhatsApp: c.phone, Alamat: c.address }));
    exportToExcel(data, `Data_Pelanggan_${new Date().toISOString().split('T')[0]}`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
          importFromExcel(file, (data) => {
              const imported: Customer[] = data.map((d: any) => ({
                  id: `cust-${Date.now()}-${Math.random()}`,
                  name: d.Nama || d.nama || 'Tanpa Nama',
                  phone: d.WhatsApp || d.whatsapp || d.phone || '-',
                  address: d.Alamat || d.alamat || '',
                  nik: d.NIK || d.nik || '',
                  status: 'Approved'
              }));
              const merged = mergeData(customers, imported);
              setCustomers(merged);
              setStoredData('customers', merged);
              alert('Data pelanggan berhasil diimpor!');
          });
      }
  };

  const handleWhatsApp = (phone: string) => {
      const clean = phone.replace(/\D/g, '').replace(/^0/, '62');
      window.open(`https://wa.me/${clean}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Database Pelanggan</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">Database penyewa terintegrasi dengan verifikasi KTP.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] md:w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Cari nama, NIK, atau nomor..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleShareLink}
                        className={`px-3 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm border transition-all ${copySuccess ? 'bg-green-600 border-green-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'}`}
                        title="Salin Link Pendaftaran Pelanggan"
                    >
                        {copySuccess ? <CheckCircle size={20} /> : <Share2 size={20} className="text-indigo-600" />}
                        <span className="hidden sm:inline">{copySuccess ? 'Link Tersalin' : 'Link Daftar'}</span>
                    </button>
                    <div className="relative" ref={actionMenuRef}>
                        <button onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm">
                            <FileSpreadsheet size={20} className="text-green-600" /> <span className="hidden sm:inline">Aksi Data</span> <ChevronDown size={16} />
                        </button>
                        {isActionMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border dark:border-slate-700 py-2 z-30">
                                <button onClick={handleExport} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-white"><Download size={16} /> Ekspor Excel</button>
                                <label className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-white"><Upload size={16} /> Impor Excel<input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImportFile} /></label>
                                <div className="border-t dark:border-slate-700 my-1"></div>
                                <button onClick={() => downloadTemplateExcel('pelanggan')} className="w-full text-left px-4 py-2 text-sm text-indigo-600 font-medium flex items-center gap-2"><Info size={16} /> Unduh Template</button>
                            </div>
                        )}
                    </div>
                    <button onClick={() => openModal()} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg active:scale-95"><Plus size={20} /> <span className="hidden sm:inline">Pelanggan Baru</span></button>
                </div>
            </div>
          </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700 shadow-inner">
          <button onClick={() => setActiveSubTab('approved')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSubTab === 'approved' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-md' : 'text-slate-500'}`}>
              <CheckCircle size={14} /> Terverifikasi
          </button>
          <button onClick={() => setActiveSubTab('pending')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSubTab === 'pending' ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-md' : 'text-slate-500'}`}>
              <Clock size={14} /> Menunggu Approval
              {customers.filter(c => c.status === 'Pending').length > 0 && <span className="bg-red-600 text-white px-1.5 py-0.5 rounded-full text-[8px]">{customers.filter(c => c.status === 'Pending').length}</span>}
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(c => (
              <div key={c.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 relative group">
                  <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200 dark:border-slate-700">
                             {c.idCardImage ? <img src={c.idCardImage} className="w-full h-full object-cover" /> : <UserCircle size={32} />}
                          </div>
                          <div>
                              <h3 className="font-black text-slate-800 dark:text-white text-lg uppercase tracking-tight line-clamp-1">{c.name}</h3>
                              <p className="text-[10px] text-slate-400 font-mono tracking-tighter">NIK: {c.nik || '-'}</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="space-y-2 py-3 border-y border-slate-100 dark:border-slate-700">
                      <button onClick={() => handleWhatsApp(c.phone)} className="text-sm text-green-600 font-bold flex items-center gap-2 hover:underline"><Phone size={14} /> {c.phone}</button>
                      <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium"><MapPin size={14} className="mt-0.5 text-slate-400 flex-shrink-0" /><p className="line-clamp-2">{c.address || '-'}</p></div>
                  </div>

                  <div className="flex gap-2">
                      {c.status === 'Pending' ? (
                          <button onClick={() => handleApprove(c.id)} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-100 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 transition-all"><CheckCircle size={16}/> Approve</button>
                      ) : (
                          <button onClick={() => openModal(c)} className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-100 dark:border-slate-600 hover:bg-white flex items-center justify-center gap-2 transition-all"><Edit2 size={14} /> Edit</button>
                      )}
                      <button onClick={() => handleDelete(c.id)} className="p-2.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-xl border border-red-100 transition-all active:scale-95"><Trash2 size={18} /></button>
                  </div>
              </div>
          ))}
          {filteredCustomers.length === 0 && (
              <div className="col-span-full text-center py-32 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <UserCircle size={64} className="mx-auto text-slate-300 mb-4 opacity-30" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Tidak ada data pelanggan di kategori ini</p>
              </div>
          )}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl p-8 shadow-2xl border-t-8 border-red-600 max-h-[95vh] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-8 border-b dark:border-slate-700 pb-6">
                      <div>
                          <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">{editingCustomer ? 'Edit Profil' : 'Daftarkan Pelanggan'}</h3>
                          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Wira Rent Car Database</p>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-600 bg-slate-100 dark:bg-slate-700 rounded-full p-2 transition-colors"><X size={28}/></button>
                  </div>
                  
                  <form onSubmit={handleSave} className="space-y-6">
                      <div className="space-y-3">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Upload Foto KTP</label>
                          <div className="relative w-full aspect-video bg-slate-50 dark:bg-slate-950 rounded-[2rem] border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center overflow-hidden group hover:border-red-500 transition-colors">
                                {ktpImage ? (
                                    <>
                                        <img src={ktpImage} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setKtpImage(null)} className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"><X size={20}/></button>
                                    </>
                                ) : (
                                    <div className="text-center text-slate-400 group-hover:text-red-500 transition-colors pointer-events-none">
                                        <Camera size={48} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-xs font-black uppercase tracking-widest">Upload KTP</p>
                                    </div>
                                )}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleKtpUpload} />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1">
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nama Lengkap</label>
                              <div className="relative">
                                  <UserCircle size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                  <input required className="w-full bg-slate-100 dark:bg-slate-950 border-none dark:text-white rounded-2xl p-4 pl-12 font-bold text-sm focus:ring-2 ring-red-500" value={name} onChange={e => setName(e.target.value)} placeholder="Nama Sesuai KTP" />
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">NIK (16 Digit)</label>
                              <div className="relative">
                                  <CreditCard size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                  <input required className="w-full bg-slate-100 dark:bg-slate-950 border-none dark:text-white rounded-2xl p-4 pl-12 font-black text-sm font-mono focus:ring-2 ring-red-500" value={nik} onChange={e => setNik(e.target.value)} placeholder="317xxxxxxxx" maxLength={16} />
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">No. WhatsApp</label>
                              <div className="relative">
                                  <Phone size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                  <input required className="w-full bg-slate-100 dark:bg-slate-950 border-none dark:text-white rounded-2xl p-4 pl-12 font-bold text-sm focus:ring-2 ring-red-500" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxx" />
                              </div>
                          </div>
                          <div className="space-y-1 md:col-span-2">
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Alamat Lengkap</label>
                              <div className="relative">
                                  <MapPin size={18} className="absolute left-4 top-4 text-slate-400" />
                                  <textarea required className="w-full bg-slate-100 dark:bg-slate-950 border-none dark:text-white rounded-2xl p-4 pl-12 font-bold text-sm focus:ring-2 ring-red-500 min-h-[100px]" value={address} onChange={e => setAddress(e.target.value)} placeholder="Sesuai domisili saat ini" />
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-4 mt-10 pt-8 border-t dark:border-slate-700">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-3xl font-black uppercase tracking-widest text-xs">Batal</button>
                          <button type="submit" className="flex-[2] py-4 bg-red-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-red-200 dark:shadow-none hover:bg-red-700 transition-all active:scale-95">Simpan Data Pelanggan</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default CustomersPage;
