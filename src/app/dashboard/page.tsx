'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardHome() {
  const router = useRouter();
  const [kunjunganList, setKunjunganList] = useState<any[]>([]);
  
  // 1. State baru untuk menyimpan Role pengguna
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthAndData = async () => {
      // 2. Cek siapa yang sedang login
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 3. Ambil role dari tabel profiles berdasarkan ID user
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setUserRole(profile.role);
        }
      }

      // Ambil data kunjungan (kode lama)
      const { data } = await supabase.from('kunjungan').select('*, instansi(nama)');
      if (data) setKunjunganList(data);
    };
    fetchAuthAndData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const totalKunjungan = kunjunganList.length;
  const hariIni = new Date().toISOString().split('T')[0];
  const kunjunganHariIni = kunjunganList.filter(item => item.waktu_kunjungan.startsWith(hariIni)).length;
  const menunggu = kunjunganList.filter(item => item.status_surat !== 'ada').length;
  const selesai = kunjunganList.filter(item => item.status_surat === 'ada').length;

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); 
    return d.toISOString().split('T')[0];
  });
  const dataGrafik = last7Days.map(date => {
    const count = kunjunganList.filter(k => k.waktu_kunjungan.startsWith(date)).length;
    return { tanggal: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), jumlah: count };
  });

  const instansiCount = kunjunganList.reduce((acc, curr) => {
    const nama = curr.instansi?.nama || 'Lainnya / Manual';
    acc[nama] = (acc[nama] || 0) + 1;
    return acc;
  }, {});
  const topInstansi = Object.entries(instansiCount)
    .map(([nama, jumlah]) => ({ nama, jumlah: jumlah as number }))
    .sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700">
          <img src="/logo-anri.jpg" alt="Logo ANRI" className="w-12 h-12 object-contain bg-white rounded p-1" />
          <div><h2 className="font-bold text-sm">Arsip Nasional</h2><p className="text-xs text-gray-400">Republik Indonesia</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className="flex items-center gap-3 bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium text-white shadow-inner">🏠 Home</a>
          <a href="/dashboard/kunjungan" className="flex items-center gap-3 hover:bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-300">👥 Kunjungan</a>
          
          {/* 4. Logika RBAC: Render menu Master Data HANYA jika role-nya SUPER_ADMIN */}
          {userRole === 'SUPER_ADMIN' && (
            <a href="/dashboard/master" className="flex items-center gap-3 hover:bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-300">📂 Master Data</a>
          )}
          
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 hover:bg-red-500 hover:text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-400">🚪 Keluar</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Konten main persis sama seperti sebelumnya (grafik dan statistik) */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Ringkasan Analitik</h1>
          <p className="text-gray-500 text-sm">Overview data kunjungan tamu ANRI terkini</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#1e293b] to-gray-800 text-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex justify-between items-center">
            <div><p className="text-4xl font-bold">{totalKunjungan}</p><p className="text-sm text-gray-300 mt-1">Total Kunjungan</p></div><span className="text-3xl opacity-30">👥</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div><p className="text-4xl font-bold text-blue-600">{kunjunganHariIni}</p><p className="text-sm text-gray-500 mt-1">Hari Ini</p></div><span className="text-3xl drop-shadow-sm">📅</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div><p className="text-4xl font-bold text-yellow-500">{menunggu}</p><p className="text-sm text-gray-500 mt-1">Menunggu Surat</p></div><span className="text-3xl drop-shadow-sm">⏳</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div><p className="text-4xl font-bold text-green-500">{selesai}</p><p className="text-sm text-gray-500 mt-1">Surat Selesai</p></div><span className="text-3xl drop-shadow-sm">✅</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Tren Kunjungan (7 Hari Terakhir)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataGrafik}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="jumlah" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Instansi Teraktif</h2>
            <div className="space-y-4">
              {topInstansi.length === 0 ? (<p className="text-sm text-gray-500 text-center py-4">Belum ada data kunjungan.</p>) : (
                topInstansi.map((instansi, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">{index + 1}</div><p className="font-medium text-sm text-gray-700">{instansi.nama}</p></div>
                    <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">{instansi.jumlah}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}