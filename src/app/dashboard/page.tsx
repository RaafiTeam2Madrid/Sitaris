'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardHome() {
  const router = useRouter();
  const [kunjunganList, setKunjunganList] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }

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
    <div className="flex h-screen bg-gray-50 font-sans selection:bg-blue-200">
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700/50">
          <img src="/logo-anri.jpg" alt="Logo ANRI" className="w-12 h-12 object-contain bg-white rounded-lg p-1 shadow-sm transition-transform duration-300 hover:rotate-3 hover:scale-105" />
          <div><h2 className="font-bold text-sm tracking-wide">Arsip Nasional</h2><p className="text-xs text-gray-400">Republik Indonesia</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className="flex items-center gap-3 bg-blue-600/20 text-blue-400 px-4 py-3 rounded-xl text-sm font-semibold shadow-inner border border-blue-500/20 transition-all duration-200 active:scale-95">🏠 Home</a>
          <a href="/dashboard/kunjungan" className="flex items-center gap-3 hover:bg-slate-700 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white active:scale-95 hover:translate-x-1">👥 Kunjungan</a>
          
          {userRole === 'SUPER_ADMIN' && (
            <a href="/dashboard/master" className="flex items-center gap-3 hover:bg-slate-700 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white active:scale-95 hover:translate-x-1">📂 Master Data</a>
          )}
        </nav>
        <div className="p-4 border-t border-gray-700/50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-red-500 text-gray-300 hover:text-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 active:scale-95 shadow-sm hover:shadow-red-500/25">🚪 Keluar</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Ringkasan Analitik</h1>
          <p className="text-gray-500 text-sm mt-1">Overview data kunjungan tamu ANRI terkini</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default border border-slate-700">
            <div><p className="text-4xl font-bold group-hover:scale-105 transition-transform origin-left">{totalKunjungan}</p><p className="text-sm text-slate-400 mt-2 font-medium">Total Kunjungan</p></div><span className="text-4xl opacity-20 absolute right-6 top-8 group-hover:rotate-12 transition-transform duration-300">👥</span>
          </div>
          <div className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default border border-gray-100 relative overflow-hidden">
            <div className="relative z-10"><p className="text-4xl font-bold text-blue-600 group-hover:scale-105 transition-transform origin-left">{kunjunganHariIni}</p><p className="text-sm text-gray-500 mt-2 font-medium">Hari Ini</p></div><span className="text-4xl absolute right-4 top-6 opacity-80 group-hover:rotate-12 transition-transform duration-300 drop-shadow-sm">📅</span>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
          </div>
          <div className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default border border-gray-100 relative overflow-hidden">
            <div className="relative z-10"><p className="text-4xl font-bold text-amber-500 group-hover:scale-105 transition-transform origin-left">{menunggu}</p><p className="text-sm text-gray-500 mt-2 font-medium">Menunggu Surat</p></div><span className="text-4xl absolute right-4 top-6 opacity-80 group-hover:-rotate-12 transition-transform duration-300 drop-shadow-sm">⏳</span>
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
          </div>
          <div className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default border border-gray-100 relative overflow-hidden">
            <div className="relative z-10"><p className="text-4xl font-bold text-emerald-500 group-hover:scale-105 transition-transform origin-left">{selesai}</p><p className="text-sm text-gray-500 mt-2 font-medium">Surat Selesai</p></div><span className="text-4xl absolute right-4 top-6 opacity-80 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">✅</span>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">Tren Kunjungan <span className="text-sm font-normal text-gray-400">(7 Hari Terakhir)</span></h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataGrafik}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dx={-10} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="jumlah" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={48} className="hover:opacity-80 transition-opacity cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Instansi Teraktif</h2>
            <div className="space-y-3">
              {topInstansi.length === 0 ? (<p className="text-sm text-gray-500 text-center py-8">Belum ada data kunjungan.</p>) : (
                topInstansi.map((instansi, index) => (
                  <div key={index} className="group flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100 transition-all duration-300 hover:translate-x-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 text-blue-600 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {index + 1}
                      </div>
                      <p className="font-semibold text-sm text-slate-700 group-hover:text-blue-700 transition-colors line-clamp-1">{instansi.nama}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm group-hover:border-blue-200 group-hover:text-blue-700 transition-colors">
                      {instansi.jumlah}
                    </span>
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