'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const TOPIC_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const router = useRouter();
  const [kunjunganList, setKunjunganList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // State interaktif UI
  const [trendRange, setTrendRange] = useState<7 | 14 | 30>(7);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [publicFormUrl, setPublicFormUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicFormUrl(`${window.location.origin}/`);
    }

    const fetchDashboardData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) setUserRole(profile.role);

      // Ambil seluruh data kunjungan beserta relasi instansi, topik, dan nomor surat
      const { data } = await supabase
        .from('kunjungan')
        .select('*, instansi(nama), topik(nama), kunjungan_surat(nomor_surat)')
        .order('waktu_kunjungan', { ascending: false });

      if (data) setKunjunganList(data);
      setLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCopyFormLink = () => {
    if (!publicFormUrl) return;
    navigator.clipboard.writeText(publicFormUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getNomorSurat = (item: any): string => {
    if (!item?.kunjungan_surat) return '-';
    if (Array.isArray(item.kunjungan_surat)) {
      return item.kunjungan_surat[0]?.nomor_surat || '-';
    }
    return item.kunjungan_surat.nomor_surat || '-';
  };

  // Perhitungan Statistik Utama & Sub-Metrik Rombongan
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    let hariIni = 0;
    let menungguSurat = 0;
    let suratSelesai = 0;
    let totalRombongan = 0;

    kunjunganList.forEach((item) => {
      const itemDate = new Date(item.waktu_kunjungan).toDateString();
      if (itemDate === todayStr) hariIni += 1;

      if (item.status_surat === 'ada') {
        suratSelesai += 1;
      } else {
        menungguSurat += 1;
      }

      totalRombongan += Number(item.jumlah_rombongan) || 1;
    });

    return {
      totalKunjungan: kunjunganList.length,
      hariIni,
      menungguSurat,
      suratSelesai,
      totalRombongan,
    };
  }, [kunjunganList]);

  // Data Grafik Tren Kunjungan (Dinamis sesuai filter 7 / 14 / 30 hari)
  const trendData = useMemo(() => {
    const result: { tanggal: string; jumlah: number }[] = [];
    const now = new Date();

    for (let i = trendRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toDateString();
      const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      const count = kunjunganList.filter(
        (item) => new Date(item.waktu_kunjungan).toDateString() === dateKey
      ).length;

      result.push({ tanggal: label, jumlah: count });
    }

    return result;
  }, [kunjunganList, trendRange]);

  // Data Grafik Donut: Proporsi Topik Kunjungan
  const topikStats = useMemo(() => {
    const map: Record<string, number> = {};
    kunjunganList.forEach((item) => {
      const namaTopik = item.topik?.nama || 'Lainnya';
      map[namaTopik] = (map[namaTopik] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [kunjunganList]);

  // Data Instansi Teraktif (Top 5)
  const topInstansi = useMemo(() => {
    const map: Record<string, number> = {};
    kunjunganList.forEach((item) => {
      const namaInstansi = item.instansi?.nama || 'Umum / Pribadi';
      map[namaInstansi] = (map[namaInstansi] || 0) + 1;
    });

    return Object.entries(map)
      .map(([nama, jumlah]) => ({ nama, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 5);
  }, [kunjunganList]);

  // Daftar Perlu Tindak Lanjut Surat (status mepet atau tanpa)
  const pendingSuratList = useMemo(() => {
    return kunjunganList.filter((item) => item.status_surat !== 'ada').slice(0, 5);
  }, [kunjunganList]);

  // 5 Kunjungan Terakhir
  const recentKunjungan = useMemo(() => {
    return kunjunganList.slice(0, 5);
  }, [kunjunganList]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans selection:bg-blue-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col shadow-2xl z-20 shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700/50">
          <img
            src="/logo-anri.jpg"
            alt="Logo ANRI"
            className="w-12 h-12 object-contain bg-white rounded-lg p-1 shadow-sm transition-transform duration-300 hover:rotate-3 hover:scale-105"
          />
          <div>
            <h2 className="font-bold text-sm tracking-wide">Arsip Nasional</h2>
            <p className="text-xs text-gray-400">Republik Indonesia</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 bg-blue-600/20 text-blue-400 px-4 py-3 rounded-xl text-sm font-semibold shadow-inner border border-blue-500/20 transition-all duration-200 active:scale-95"
          >
            <span>🏠</span> Home
          </Link>
          <Link
            href="/dashboard/kunjungan"
            className="flex items-center gap-3 hover:bg-slate-700/80 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white active:scale-95 hover:translate-x-1"
          >
            <span>👥</span> Kunjungan
          </Link>
          {userRole === 'SUPER_ADMIN' && (
            <Link
              href="/dashboard/master"
              className="flex items-center gap-3 hover:bg-slate-700/80 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white active:scale-95 hover:translate-x-1"
            >
              <span>📂</span> Master Data
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-red-500 text-gray-300 hover:text-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 active:scale-95 shadow-sm hover:shadow-red-500/25 cursor-pointer"
          >
            <span>🚪</span> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
        {/* Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
              Portal Terpadu Dukman
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Overview data kunjungan tamu & administrasi surat ANRI terkini
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowQrModal(true)}
              className="group bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 hover:border-blue-300 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span className="transition-transform duration-300 group-hover:scale-125">📱</span>
              QR Form Tamu
            </button>

            {userRole !== 'PIMPINAN' && (
              <Link
                href="/dashboard/tambah"
                className="group bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
              >
                <span className="transition-transform duration-300 group-hover:rotate-90">➕</span>
                Catat Kunjungan
              </Link>
            )}
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Card 1: Total Kunjungan + Sub-metrik Rombongan */}
          <div className="group bg-[#0f172a] text-white rounded-2xl p-6 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-900/20 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full transition-transform duration-500 group-hover:scale-150" />
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-4xl font-extrabold tracking-tight">
                  {loading ? '...' : stats.totalKunjungan}
                </p>
                <p className="text-slate-300 text-sm font-medium mt-1">Total Kunjungan</p>
              </div>
              <span className="text-2xl bg-slate-800 p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                👥
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-blue-300 font-medium relative z-10">
              <span>Total {loading ? '...' : stats.totalRombongan} orang tamu</span>
              <span className="bg-blue-500/20 px-2 py-0.5 rounded-md">Akumulasi</span>
            </div>
          </div>

          {/* Card 2: Hari Ini */}
          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-blue-100 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-4xl font-extrabold text-blue-600 tracking-tight">
                  {loading ? '...' : stats.hariIni}
                </p>
                <p className="text-slate-600 text-sm font-semibold mt-1">Hari Ini</p>
              </div>
              <span className="text-2xl bg-blue-50 p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                📅
              </span>
            </div>
            <p className="mt-4 pt-3 border-t border-gray-50 text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Card 3: Menunggu Surat */}
          <Link
            href="/dashboard/kunjungan"
            className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-amber-200 active:scale-[0.99] block"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-4xl font-extrabold text-amber-500 tracking-tight">
                  {loading ? '...' : stats.menungguSurat}
                </p>
                <p className="text-slate-600 text-sm font-semibold mt-1">Menunggu Surat</p>
              </div>
              <span className="text-2xl bg-amber-50 p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                ⏳
              </span>
            </div>
            <p className="mt-4 pt-3 border-t border-gray-50 text-xs text-amber-600 font-semibold flex items-center justify-between">
              <span>Status mepet / tanpa surat</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </p>
          </Link>

          {/* Card 4: Surat Selesai */}
          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-emerald-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-4xl font-extrabold text-emerald-600 tracking-tight">
                  {loading ? '...' : stats.suratSelesai}
                </p>
                <p className="text-slate-600 text-sm font-semibold mt-1">Surat Selesai</p>
              </div>
              <span className="text-2xl bg-emerald-50 p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110">
                ✅
              </span>
            </div>
            <p className="mt-4 pt-3 border-t border-gray-50 text-xs text-emerald-600 font-medium">
              {stats.totalKunjungan > 0
                ? `${Math.round((stats.suratSelesai / stats.totalKunjungan) * 100)}% berkas lengkap`
                : 'Belum ada data berkas'}
            </p>
          </div>
        </div>

        {/* Row 2: Tren Kunjungan (Kiri) + Proporsi Topik Donut Chart (Kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grafik Tren Kunjungan dengan Filter Periode */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Tren Kunjungan</h2>
                <p className="text-xs text-slate-400">
                  Grafik frekuensi kedatangan tamu dalam {trendRange} hari terakhir
                </p>
              </div>

              {/* Filter Pill Switcher */}
              <div className="inline-flex bg-slate-100 p-1 rounded-xl self-start">
                {([7, 14, 30] as const).map((days) => (
                  <button
                    key={days}
                    onClick={() => setTrendRange(days)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                      trendRange === days
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {days} Hari
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorKunjungan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="tanggal"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                    formatter={(value: any) => [`${value} Kunjungan`, 'Jumlah']}
                  />
                  <Area
                    type="monotone"
                    dataKey="jumlah"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorKunjungan)"
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafik Donut: Proporsi Topik Kunjungan */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col">
            <div className="mb-2">
              <h2 className="text-lg font-bold text-slate-800">Topik Kunjungan</h2>
              <p className="text-xs text-slate-400">Sebaran layanan yang paling diminati</p>
            </div>

            {topikStats.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
                Belum ada data topik
              </div>
            ) : (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topikStats}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={74}
                        paddingAngle={4}
                      >
                        {topikStats.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={TOPIC_COLORS[index % TOPIC_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                        formatter={(value: any) => [`${value} Kunjungan`, 'Total']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Custom */}
                <div className="mt-2 space-y-2 max-h-28 overflow-y-auto pr-1">
                  {topikStats.map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: TOPIC_COLORS[idx % TOPIC_COLORS.length] }}
                        />
                        <span className="text-slate-700 font-medium truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md ml-2 shrink-0">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Row 3: Panel Perlu Tindak Lanjut Surat + Instansi Teraktif (2 Baris) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actionable Widget: Perlu Tindak Lanjut Surat */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>📌</span> Perlu Tindak Lanjut Surat
                </h2>
                <p className="text-xs text-slate-400">
                  Daftar kunjungan berstatus mepet atau belum melampirkan nomor surat
                </p>
              </div>
              {pendingSuratList.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                  {stats.menungguSurat} Pending
                </span>
              )}
            </div>

            {pendingSuratList.length === 0 ? (
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-6 text-center">
                <p className="text-emerald-700 font-semibold text-sm">
                  🎉 Semua berkas surat kunjungan sudah lengkap!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSuratList.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 transition-all duration-200"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase shrink-0 border ${
                          item.status_surat === 'mepet'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.status_surat}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {item.nama_perwakilan}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {item.instansi?.nama || 'Umum / Pribadi'} •{' '}
                          {new Date(item.waktu_kunjungan).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/kunjungan/${item.id}`}
                      className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm shrink-0"
                    >
                      Input Surat
                      <span className="transition-transform duration-200 group-hover:translate-x-1">
                        
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instansi Teraktif (Teks 2 Baris dengan line-clamp-2) */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800">Instansi Teraktif</h2>
              <p className="text-xs text-slate-400">5 lembaga dengan kunjungan terbanyak</p>
            </div>

            {topInstansi.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada data instansi</p>
            ) : (
              <div className="space-y-3">
                {topInstansi.map((inst, idx) => (
                  <div
                    key={inst.nama}
                    className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 line-clamp-2 leading-snug">
                        {inst.nama}
                      </p>
                    </div>
                    <span className="bg-white border border-gray-200 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-lg shadow-xs shrink-0">
                      {inst.jumlah}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 4: Tabel Ringkas 5 Kunjungan Terakhir */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">5 Kunjungan Terakhir</h2>
              <p className="text-xs text-slate-400">Aktivitas buku tamu terbaru beserta status surat</p>
            </div>
            <Link
              href="/dashboard/kunjungan"
              className="group text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-5 py-3.5">Nama Tamu</th>
                  <th className="px-5 py-3.5">Instansi</th>
                  <th className="px-5 py-3.5">Nomor Surat Srikandi</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Memuat aktivitas terbaru...
                    </td>
                  </tr>
                ) : recentKunjungan.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Belum ada data kunjungan.
                    </td>
                  </tr>
                ) : (
                  recentKunjungan.map((item) => {
                    const nomorSurat = getNomorSurat(item);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/40 transition-colors duration-200 group"
                      >
                        <td className="px-5 py-3.5 text-xs font-medium text-slate-500 whitespace-nowrap">
                          {new Date(item.waktu_kunjungan).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {item.nama_perwakilan}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {item.instansi?.nama || '-'}
                        </td>
                        <td className="px-5 py-3.5">
                          {nomorSurat !== '-' ? (
                            <span className="font-mono text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                              {nomorSurat}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${
                              item.status_surat === 'ada'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : item.status_surat === 'mepet'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}
                          >
                            {item.status_surat}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Link
                            href={`/dashboard/kunjungan/${item.id}`}
                            className="inline-flex items-center justify-center bg-white border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 active:scale-95 shadow-xs"
                          >
                            Detail
                          </Link>
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

      {/* Modal Popup QR Code Form Tamu Publik */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center transform transition-all duration-300 scale-100"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Akses Tamu Lobi
              </span>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center font-bold transition-all active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <h3 className="text-xl font-bold text-slate-800">Scan QR Buku Tamu</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Arahkan kamera ponsel tamu untuk mengisi formulir kunjungan secara mandiri
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mb-5 shadow-inner">
              {publicFormUrl && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    publicFormUrl
                  )}`}
                  alt="QR Code Formulir Tamu"
                  className="w-48 h-48 object-contain rounded-lg"
                />
              )}
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleCopyFormLink}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
                }`}
              >
                {copiedLink ? '✅ Tautan Form Tersalin!' : '📋 Salin Tautan Formulir'}
              </button>

              <Link
                href="/"
                target="_blank"
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/70 transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5"
              >
                Buka Halaman Formulir ↗
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}