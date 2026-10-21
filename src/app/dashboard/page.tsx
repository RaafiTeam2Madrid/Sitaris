"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [kunjunganList, setKunjunganList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mengambil data saat dashboard pertama kali dimuat
  useEffect(() => {
    const fetchData = async () => {
      // Kita pakai select('*, instansi(nama)') untuk mengambil relasi tabel
      const { data, error } = await supabase
        .from("kunjungan")
        .select(
          `
          *,
          instansi (nama)
        `,
        )
        .order("waktu_kunjungan", { ascending: false }); // Urutkan dari yang paling baru

      if (error) {
        console.error("Gagal mengambil data:", error);
      } else if (data) {
        setKunjunganList(data);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Menghitung statistik sederhana
  const totalKunjungan = kunjunganList.length;

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar (Sama seperti sebelumnya) */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700">
          <div className="w-10 h-10 bg-blue-500 rounded font-bold flex items-center justify-center">
            ANRI
          </div>
          <div>
            <h2 className="font-bold text-sm">Arsip Nasional</h2>
            <p className="text-xs text-gray-400">Republik Indonesia</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a
            href="#"
            className="flex items-center gap-3 hover:bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-300"
          >
            🏠 Home
          </a>
          <a
            href="#"
            className="flex items-center gap-3 bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium"
          >
            👥 Kunjungan
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Direktorat Informasi Kearsipan
            </h1>
            <p className="text-gray-500 text-sm">Dashboard Kunjungan</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            + Tambah Kunjungan
          </button>
        </div>

        {/* Stat Cards Dinamis */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1e293b] text-white p-6 rounded-xl shadow-sm flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold">{totalKunjungan}</p>
              <p className="text-sm text-gray-400 mt-1">Total Kunjungan</p>
            </div>
            <span className="text-2xl opacity-50">👥</span>
          </div>
          {/* Sisa card dibiarkan statis dulu untuk prototype */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-gray-800">-</p>
              <p className="text-sm text-gray-500 mt-1">Hari Ini</p>
            </div>
            <span className="text-2xl">📅</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-gray-800">-</p>
              <p className="text-sm text-gray-500 mt-1">Menunggu</p>
            </div>
            <span className="text-2xl">⏳</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-gray-800">-</p>
              <p className="text-sm text-gray-500 mt-1">Selesai</p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>

        {/* Table Area Dinamis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              placeholder="🔍 Cari..."
              className="border border-gray-300 rounded-lg px-4 py-2 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
              📥 Ekspor Laporan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Waktu</th>
                  <th className="px-4 py-3">Nama Tamu</th>
                  <th className="px-4 py-3">Instansi</th>
                  <th className="px-4 py-3">Jalur Input</th>
                  <th className="px-4 py-3">Status Surat</th>
                  <th className="px-4 py-3 rounded-tr-lg">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : kunjunganList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">
                      Belum ada data kunjungan.
                    </td>
                  </tr>
                ) : (
                  kunjunganList.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      {/* Format jam otomatis */}
                      <td className="px-4 py-3">
                        {new Date(item.waktu_kunjungan).toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.nama_perwakilan}
                      </td>
                      <td className="px-4 py-3">
                        {item.instansi?.nama || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold uppercase">
                          {item.jalur_input}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {/* Ganti warna badge berdasarkan status surat */}
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                            item.status_surat === "ada"
                              ? "bg-green-100 text-green-700"
                              : item.status_surat === "mepet"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.status_surat}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/dashboard/${item.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Detail
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
