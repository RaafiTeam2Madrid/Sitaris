'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function TambahKunjunganManualPage() {
  const router = useRouter();
  
  // State untuk master data (dropdown)
  const [instansiList, setInstansiList] = useState<any[]>([]);
  const [topikList, setTopikList] = useState<any[]>([]);

  // State untuk form input
  const [nama, setNama] = useState('');
  const [instansiId, setInstansiId] = useState('');
  const [topikId, setTopikId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ambil data instansi dan topik untuk pilihan dropdown
  useEffect(() => {
    const fetchMasterData = async () => {
      const { data: instansi } = await supabase.from('instansi').select('*').order('nama');
      const { data: topik } = await supabase.from('topik').select('*').order('nama');
      
      if (instansi) setInstansiList(instansi);
      if (topik) setTopikList(topik);
    };
    fetchMasterData();
  }, []);

  // Fungsi simpan data ke database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from('kunjungan')
      .insert([
        {
          nama_perwakilan: nama,
          instansi_id: instansiId,
          topik_id: topikId,
          jalur_input: 'MANUAL', // Penanda khusus bahwa ini diinput petugas
          status_surat: 'tanpa' // Default
        }
      ]);

    setIsSubmitting(false);

    if (error) {
      alert('Gagal menambah kunjungan: ' + error.message);
    } else {
      alert('Berhasil menambah kunjungan manual!');
      router.push('/dashboard'); // Kembali ke dashboard
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-gray-50 min-h-screen">
      <button onClick={() => router.push('/dashboard')} className="mb-6 text-blue-600 hover:underline font-medium">
        &larr; Kembali ke Dashboard
      </button>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold mb-2">Tambah Kunjungan (Manual)</h1>
        <p className="text-gray-500 mb-8 text-sm">Gunakan form ini jika tamu tidak bisa memindai QR Code secara mandiri.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap Tamu</label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instansi Asal</label>
            <select
              required
              value={instansiId}
              onChange={(e) => setInstansiId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>-- Pilih Instansi --</option>
              {instansiList.map((item) => (
                <option key={item.id} value={item.id}>{item.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topik Kunjungan</label>
            <select
              required
              value={topikId}
              onChange={(e) => setTopikId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>-- Pilih Topik --</option>
              {topikList.map((item) => (
                <option key={item.id} value={item.id}>{item.nama}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg px-4 py-4 mt-4 transition-colors disabled:bg-blue-400"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Kunjungan'}
          </button>
        </form>
      </div>
    </div>
  );
}