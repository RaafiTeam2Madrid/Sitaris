'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function KunjunganPage() {
  const router = useRouter();
  const [kunjunganList, setKunjunganList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setUserRole(profile.role);
      }

      // Mengambil data kunjungan beserta relasi instansi dan nomor_surat dari tabel kunjungan_surat
      const { data } = await supabase
        .from('kunjungan')
        .select('*, instansi (nama), kunjungan_surat (nomor_surat)')
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

  // Helper untuk membaca nomor_surat baik berupa array maupun objek tunggal
  const getNomorSurat = (item: any): string => {
    if (!item?.kunjungan_surat) return '-';
    if (Array.isArray(item.kunjungan_surat)) {
      return item.kunjungan_surat[0]?.nomor_surat || '-';
    }
    return item.kunjungan_surat.nomor_surat || '-';
  };

  const filteredData = kunjunganList.filter((item) => {
    const nama = item.nama_perwakilan?.toLowerCase() || '';
    const instansi = item.instansi?.nama?.toLowerCase() || '';
    const nomorSurat = getNomorSurat(item).toLowerCase();
    const keyword = searchQuery.toLowerCase();

    return nama.includes(keyword) || instansi.includes(keyword) || nomorSurat.includes(keyword);
  });

  const handleExportCSV = () => {
    if (filteredData.length === 0) return alert('Tidak ada data!');
    const headers = ['Waktu', 'Nama Tamu', 'Instansi', 'Jalur', 'Status', 'Nomor Surat'];
    const csvRows = filteredData.map(item => [
      new Date(item.waktu_kunjungan).toLocaleString('id-ID'),
      `"${item.nama_perwakilan || '-'}"`,
      `"${item.instansi?.nama || '-'}"`,
      `"${item.jalur_input}"`,
      `"${item.status_surat.toUpperCase()}"`,
      `"${getNomorSurat(item)}"`
    ].join(';'));

    const csvContent = [headers.join(';'), ...csvRows].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', 'Data_Kunjungan.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans selection:bg-blue-200">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700/50">
          <img src="/logo-anri.jpg" alt="Logo ANRI" className="w-12 h-12 object-contain bg-white rounded-lg p-1 shadow-sm transition-transform duration-300 hover:rotate-3 hover:scale-105" />
          <div><h2 className="font-bold text-sm tracking-wide">Arsip Nasional</h2><p className="text-xs text-gray-400">Republik Indonesia</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className="flex items-center gap-3 hover:bg-slate-700 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white active:scale-95 hover:translate-x-1">🏠 Home</a>
          <a href="/dashboard/kunjungan" className="flex items-center gap-3 bg-blue-600/20 text-blue-400 px-4 py-3 rounded-xl text-sm font-semibold shadow-inner border border-blue-500/20 transition-all duration-200 active:scale-95">👥 Kunjungan</a>
          
          {userRole === 'SUPER_ADMIN' && (
            <a href="/dashboard/master" className="flex items-center gap-3 hover:bg-slate-700 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white active:scale-95 hover:translate-x-1">📂 Master Data</a>
          )}
        </nav>
        <div className="p-4 border-t border-gray-700/50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-red-500 text-gray-300 hover:text-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 active:scale-95 shadow-sm hover:shadow-red-500/25">🚪 Keluar</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div><h1 className="text-3xl font-bold text-gray-800 tracking-tight">Manajemen Kunjungan</h1><p className="text-gray-500 text-sm mt-1">Kelola dan pantau seluruh data tamu</p></div>
          
          {userRole !== 'PIMPINAN' && (
            <a href="/dashboard/tambah" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
              ➕ Tambah Kunjungan
            </a>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-blue-500 transition-colors">🔍</span>
              <input
                type="text"
                placeholder="Cari tamu, instansi, atau nomor surat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 w-80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md bg-gray-50/50 focus:bg-white"
              />
            </div>
            <button onClick={handleExportCSV} className="bg-white border border-gray-200 hover:border-gray-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2">
              📥 Ekspor Laporan
            </button>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Nama Tamu</th>
                  <th className="px-6 py-4">Instansi</th>
                  <th className="px-6 py-4">Status Surat</th>
                  <th className="px-6 py-4">Nomor Surat</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-500 font-medium">Memuat data pengunjung...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400 font-medium">Tidak ada data kunjungan yang sesuai.</td></tr>
                ) : (
                  filteredData.map((item) => {
                    const nomorSurat = getNomorSurat(item);
                    return (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition-colors duration-200 group">
                        <td className="px-6 py-4 font-medium text-slate-600">
                          {new Date(item.waktu_kunjungan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {item.nama_perwakilan}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{item.instansi?.nama || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm border ${
                            item.status_surat === 'ada'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : item.status_surat === 'mepet'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {item.status_surat}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {nomorSurat !== '-' ? (
                            <span className="font-mono text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                              {nomorSurat}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <a href={`/dashboard/kunjungan/${item.id}`} className="inline-flex items-center justify-center bg-white border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 active:scale-95 shadow-sm group-hover:shadow-md">
                            Detail
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}