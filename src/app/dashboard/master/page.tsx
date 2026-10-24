"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function MasterDataPage() {
  const router = useRouter();

  // State untuk menyimpan data
  const [instansiList, setInstansiList] = useState<any[]>([]);
  const [topikList, setTopikList] = useState<any[]>([]);

  // State untuk input form tambah data
  const [newInstansi, setNewInstansi] = useState("");
  const [newTopik, setNewTopik] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ambil data saat halaman dimuat
  const fetchData = async () => {
    const { data: dataInstansi } = await supabase
      .from("instansi")
      .select("*")
      .order("nama");
    if (dataInstansi) setInstansiList(dataInstansi);

    const { data: dataTopik } = await supabase
      .from("topik")
      .select("*")
      .order("nama");
    if (dataTopik) setTopikList(dataTopik);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FUNGSI TAMBAH DATA ---
  const handleAddInstansi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstansi.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from("instansi")
      .insert([{ nama: newInstansi }]);
    setIsSubmitting(false);

    if (error) alert("Gagal menambah instansi: " + error.message);
    else {
      setNewInstansi("");
      fetchData();
    }
  };

  const handleAddTopik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopik.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("topik").insert([{ nama: newTopik }]);
    setIsSubmitting(false);

    if (error) alert("Gagal menambah topik: " + error.message);
    else {
      setNewTopik("");
      fetchData();
    }
  };

  // --- FUNGSI HAPUS DATA ---
  const handleDeleteInstansi = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menghapus instansi "${nama}"?`)) return;
    const { error } = await supabase.from("instansi").delete().eq("id", id);
    if (error)
      alert(
        "Gagal menghapus (mungkin instansi ini sedang dipakai di data kunjungan)",
      );
    else fetchData();
  };

  const handleDeleteTopik = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menghapus topik "${nama}"?`)) return;
    const { error } = await supabase.from("topik").delete().eq("id", id);
    if (error)
      alert(
        "Gagal menghapus (mungkin topik ini sedang dipakai di data kunjungan)",
      );
    else fetchData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700">
          {/* Tag img ditambahkan di sini menggantikan div kotak biru */}
          <img
            src="/logo-anri.jpg"
            alt="Logo ANRI"
            className="w-12 h-12 object-contain bg-white rounded p-1"
          />
          <div>
            <h2 className="font-bold text-sm">Arsip Nasional</h2>
            <p className="text-xs text-gray-400">Republik Indonesia</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a
            href="/dashboard"
            className="flex items-center gap-3 hover:bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-300"
          >
            🏠 Home
          </a>
          <a
            href="/dashboard/kunjungan"
            className="flex items-center gap-3 hover:bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-300"
          >
            👥 Kunjungan
          </a>
          {/* Menu Master Data Aktif */}
          <a
            href="/dashboard/master"
            className="flex items-center gap-3 bg-[#334155] px-4 py-3 rounded-lg text-sm font-medium"
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

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Manajemen Master Data
          </h1>
          <p className="text-gray-500 text-sm">
            Kelola daftar pilihan Instansi dan Topik Kunjungan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bagian Instansi */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Data Instansi
            </h2>
            <form onSubmit={handleAddInstansi} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newInstansi}
                onChange={(e) => setNewInstansi(e.target.value)}
                placeholder="Nama instansi baru..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                disabled={isSubmitting}
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Tambah
              </button>
            </form>
            <div className="h-96 overflow-y-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-sm text-gray-600">
                <tbody>
                  {instansiList.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.nama}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            handleDeleteInstansi(item.id, item.nama)
                          }
                          className="text-red-500 hover:text-red-700 text-xs font-bold uppercase"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bagian Topik */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Data Topik Kunjungan
            </h2>
            <form onSubmit={handleAddTopik} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newTopik}
                onChange={(e) => setNewTopik(e.target.value)}
                placeholder="Topik kunjungan baru..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                disabled={isSubmitting}
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Tambah
              </button>
            </form>
            <div className="h-96 overflow-y-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-sm text-gray-600">
                <tbody>
                  {topikList.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.nama}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteTopik(item.id, item.nama)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold uppercase"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
