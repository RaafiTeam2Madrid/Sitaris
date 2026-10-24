'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function KunjunganPage() {
  const router = useRouter();
  const [kunjunganList, setKunjunganList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 1. State baru untuk menyimpan role
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthAndData = async () => {
      // 2. Ambil data sesi login dan profil role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }

      // 3. Ambil data kunjungan
      const { data } = await supabase
        .from('kunjungan')
        .select('*, instansi (nama)')
        .order('waktu_kunjungan', { ascending: false });
      
      if (data) setKunjunganList(data);
      setLoading(false);
    };
    
    fetchAuthAndData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const filteredData = kunjunganList.filter((item) => {
    const nama = item.nama_perwakilan?.toLowerCase() || '';
    const instansi = item.instansi?.nama?.toLowerCase() || '';
    return nama.includes(searchQuery.toLowerCase()) || instansi.includes(searchQuery.toLowerCase());
  });

  const handleExportCSV = () => {
    if (filteredData.length === 0) return alert('Tidak ada data!');
    const headers = ['Waktu', 'Nama Tamu', 'Instansi', 'Jalur', 'Status'];
    const csvRows = filteredData.map(item => [
      new Date(item.waktu_kunjungan).toLocaleString('id-ID'),
      `"${item.nama_perwakilan || '-'}"`,
      `"${item.instansi?.nama || '-'}"`,
      `"${item.jalur_input}"`,
      `"${item.status_surat.toUpperCase()}"`
    ].join(';'));
    const csvString = [headers.join(';'), ...csvRows].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvString], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', 'Data_Kunjungan.csv');
    document.body.appendChild(link); link.click(); link.remove();
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700">
          <img src="/logo-anri.jpg" alt="Logo ANRI" className="w-12 h-12 object-contain bg-white rounded p-1" />
          <div><h2 className="font-bold text-sm">Arsip Nasional</h2><p className="text-xs text-gray-400">Republik Indonesia</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className="flex items-center gap-3 hover:bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-300">🏠 Home</a>
          <a href="/dashboard/kunjungan" className="flex items-center gap-3 bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium text-white">👥 Kunjungan</a>
          
          {/* LOGIKA RBAC 1: Sembunyikan Master Data jika bukan Super Admin */}
          {userRole === 'SUPER_ADMIN' && (
            <a href="/dashboard/master" className="flex items-center gap-3 hover:bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-300">📂 Master Data</a>
          )}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 hover:bg-red-500 hover:text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-400">🚪 Keluar</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div><h1 className="text-2xl font-bold text-gray-800">Manajemen Kunjungan</h1><p className="text-gray-500 text-sm">Kelola dan pantau seluruh data tamu</p></div>
          
          {/* LOGIKA RBAC 2: Sembunyikan tombol Tambah Kunjungan jika role adalah PIMPINAN */}
          {userRole !== 'PIMPINAN' && (
            <a href="/dashboard/tambah" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors block text-center">+ Tambah Kunjungan</a>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <input type="text" placeholder="🔍 Cari tamu atau instansi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 w-72 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleExportCSV} className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">📥 Ekspor Laporan</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                <tr><th className="px-4 py-3 rounded-tl-lg">Waktu</th><th className="px-4 py-3">Nama Tamu</th><th className="px-4 py-3">Instansi</th><th className="px-4 py-3">Status Surat</th><th className="px-4 py-3 rounded-tr-lg">Aksi</th></tr>
              </thead>
              <tbody>
                {loading ? (<tr><td colSpan={5} className="text-center py-6 text-gray-500">Memuat data...</td></tr>) : 
                 filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(item.waktu_kunjungan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.nama_perwakilan}</td>
                    <td className="px-4 py-3">{item.instansi?.nama || '-'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${item.status_surat === 'ada' ? 'bg-green-100 text-green-700' : item.status_surat === 'mepet' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'}`}>{item.status_surat}</span></td>
                    <td className="px-4 py-3"><a href={`/dashboard/${item.id}`} className="text-blue-600 hover:underline font-medium">Detail</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}