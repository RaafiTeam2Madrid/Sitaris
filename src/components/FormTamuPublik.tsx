'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Memanggil jembatan Supabase yang tadi kita buat

export default function FormTamuPublik() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State untuk menyimpan data pilihan dropdown dari database
  const [instansiList, setInstansiList] = useState<any[]>([]);
  const [topikList, setTopikList] = useState<any[]>([]);

  // State untuk menyimpan isian user
  const [formData, setFormData] = useState({
    nama_perwakilan: '',
    instansi_id: '',
    jumlah_rombongan: 4,
    kontak: '',
    topik_id: '',
    pic_dituju: ''
  });

  // Efek ini berjalan otomatis saat halaman pertama kali dibuka
  useEffect(() => {
    const fetchMasterData = async () => {
      // Ambil data Instansi
      const { data: instansiData } = await supabase.from('instansi').select('*').order('nama');
      if (instansiData) setInstansiList(instansiData);

      // Ambil data Topik
      const { data: topikData } = await supabase.from('topik').select('*').order('nama');
      if (topikData) setTopikList(topikData);
    };

    fetchMasterData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Proses kirim data ke Supabase
    const { error } = await supabase
      .from('kunjungan')
      .insert([
        {
          nama_perwakilan: formData.nama_perwakilan,
          instansi_id: formData.instansi_id,
          jumlah_rombongan: formData.jumlah_rombongan,
          kontak: formData.kontak,
          topik_id: formData.topik_id,
          jalur_input: 'qr', // Karena ini form publik, otomatis jalur input QR
          status_surat: 'tanpa', // Asumsi awal tamu QR datang langsung tanpa konfirmasi surat
        }
      ]);

    setIsSubmitting(false);

    if (error) {
      alert('Gagal menyimpan data: ' + error.message);
    } else {
      alert('Data Kunjungan Berhasil Dikirim!');
      // Reset form
      setFormData({
        nama_perwakilan: '',
        instansi_id: '',
        jumlah_rombongan: 4,
        kontak: '',
        topik_id: '',
        pic_dituju: ''
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="border-l-4 border-blue-500 pl-4 mb-6">
        <p className="text-gray-700 font-medium">
          Silakan isi form dalam waktu kurang dari 1 menit saat tiba di lobi
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-tight">
          Formulir Kunjungan <br /> Tamu Eksternal
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nama Perwakilan */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Nama Perwakilan</label>
            <input 
              type="text" 
              name="nama_perwakilan"
              value={formData.nama_perwakilan}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Instansi / Lembaga */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Instansi / Lembaga</label>
            <select 
              name="instansi_id"
              value={formData.instansi_id}
              onChange={handleChange}
              required 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">🔍 Pilih Instansi...</option>
              {instansiList.map((instansi) => (
                <option key={instansi.id} value={instansi.id}>{instansi.nama}</option>
              ))}
            </select>
          </div>

          {/* Jumlah Rombongan */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Jumlah Rombongan</label>
            <input 
              type="number" 
              name="jumlah_rombongan"
              min="1"
              value={formData.jumlah_rombongan}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Kontak / WhatsApp */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Kontak / No. WhatsApp (opsional)</label>
            <input 
              type="tel" 
              name="kontak"
              value={formData.kontak}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tujuan Kunjungan */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Tujuan / Topik Kunjungan</label>
            <select 
              name="topik_id"
              value={formData.topik_id}
              onChange={handleChange}
              required 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Topik...</option>
              {topikList.map((topik) => (
                <option key={topik.id} value={topik.id}>{topik.nama}</option>
              ))}
            </select>
          </div>

          {/* Unit / PIC - (Ini masih statis, karena di DB belum kita buat tabel PIC/Unit) */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Unit / PIC yang Dituju</label>
            <select 
              name="pic_dituju"
              value={formData.pic_dituju}
              onChange={handleChange}
              required 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih PIC...</option>
              <option value="Tim Srikandi">Tim Srikandi</option>
              <option value="Tim Kearsipan">Tim Kearsipan</option>
            </select>
          </div>

          {/* Checkbox Persetujuan PDP */}
          <div className="flex items-start mt-4">
            <input 
              type="checkbox" 
              required
              className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="ml-3 text-sm text-gray-700 leading-relaxed">
              Saya menyetujui data yang diisi digunakan untuk kebutuhan pelaporan internal ANRI sesuai UU PDP
            </label>
          </div>

          {/* Tombol Kirim */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#1A62B7] hover:bg-blue-800 text-white font-semibold rounded-lg px-4 py-4 mt-4 transition-colors"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Data Kunjungan'}
          </button>
        </form>
      </div>
    </div>
  );
}