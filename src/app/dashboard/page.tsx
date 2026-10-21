"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [kunjunganList, setKunjunganList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("kunjungan")
        .select(`*, instansi (nama)`)
        .order("waktu_kunjungan", { ascending: false });

      if (error) {
        console.error("Gagal mengambil data:", error);
      } else if (data) {
        setKunjunganList(data);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/login");
    } else {
      alert("Gagal logout: " + error.message);
    }
  };

  const totalKunjungan = kunjunganList.length;
  const hariIni = new Date().toISOString().split("T")[0];
  const kunjunganHariIni = kunjunganList.filter((item) =>
    item.waktu_kunjungan.startsWith(hariIni),
  ).length;
  const menunggu = kunjunganList.filter(
    (item) => item.status_surat !== "ada",
  ).length;
  const selesai = kunjunganList.filter(
    (item) => item.status_surat === "ada",
  ).length;

  const filteredData = kunjunganList.filter((item) => {
    const nama = item.nama_perwakilan?.toLowerCase() || "";
    const instansi = item.instansi?.nama?.toLowerCase() || "";
    const keyword = searchQuery.toLowerCase();

    return nama.includes(keyword) || instansi.includes(keyword);
  });

  // --- FUNGSI EKSPOR KE CSV ---
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    const headers = [
      "Waktu Kunjungan",
      "Nama Tamu",
      "Instansi",
      "Jalur Input",
      "Status Surat",
    ];

    const csvRows = filteredData.map((item) => {
      const waktu = new Date(item.waktu_kunjungan).toLocaleString("id-ID");
      const nama = `"${item.nama_perwakilan || "-"}"`;
      const instansi = `"${item.instansi?.nama || "-"}"`;
      const jalur = `"${item.jalur_input}"`;
      const status = `"${item.status_surat.toUpperCase()}"`;

      // UBAH DI SINI: Gunakan titik koma (;) alih-alih koma (,)
      return [waktu, nama, instansi, jalur, status].join(";");
    });

    // UBAH DI SINI JUGA: Gunakan titik koma (;) untuk header
    const csvString = [headers.join(";"), ...csvRows].join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Kunjungan_ANRI_${hariIni}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
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
            href="/dashboard"
            className="flex items-center gap-3 bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium text-white"
          >
            👥 Kunjungan
          </a>
          <a
            href="/dashboard/master"
            className="flex items-center gap-3 hover:bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-300"
          >
            📂 Master Data
          </a>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 hover:bg-red-500 hover:text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-400"
          >
            🚪 Keluar (Logout)
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Direktorat Informasi Kearsipan
            </h1>
            <p className="text-gray-500 text-sm">Dashboard Kunjungan</p>
          </div>
          <a
            href="/dashboard/tambah"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors block text-center"
          >
            + Tambah Kunjungan
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1e293b] text-white p-6 rounded-xl shadow-sm flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold">{totalKunjungan}</p>
              <p className="text-sm text-gray-400 mt-1">Total Kunjungan</p>
            </div>
            <span className="text-2xl opacity-50">👥</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {kunjunganHariIni}
              </p>
              <p className="text-sm text-gray-500 mt-1">Hari Ini</p>
            </div>
            <span className="text-2xl">📅</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-yellow-600">{menunggu}</p>
              <p className="text-sm text-gray-500 mt-1">Menunggu</p>
            </div>
            <span className="text-2xl">⏳</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-green-600">{selesai}</p>
              <p className="text-sm text-gray-500 mt-1">Selesai</p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              placeholder="🔍 Cari tamu atau instansi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-72 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Tombol dihubungkan dengan fungsi handleExportCSV */}
            <button
              onClick={handleExportCSV}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
            >
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
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">
                      Tidak ada data yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
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
