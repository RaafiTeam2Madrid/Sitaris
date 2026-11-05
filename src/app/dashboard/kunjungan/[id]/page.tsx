'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function DetailKunjunganPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [statusSurat, setStatusSurat] = useState('');
  const [nomorSurat, setNomorSurat] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      // 1. Ambil data kunjungan sekaligus data relasi dari kunjungan_surat
      const { data: detailData } = await supabase
        .from('kunjungan')
        .select('*, instansi(nama), kunjungan_surat(nomor_surat)')
        .eq('id', params.id)
        .single();
      
      if (detailData) {
        setData(detailData);
        setStatusSurat(detailData.status_surat || 'tanpa');
        
        // 2. Ekstrak nomor surat dari tabel relasi kunjungan_surat
        let existingNomor = '';
        if (detailData.kunjungan_surat && Array.isArray(detailData.kunjungan_surat) && detailData.kunjungan_surat.length > 0) {
          existingNomor = detailData.kunjungan_surat[0].nomor_surat;
        } else if (detailData.kunjungan_surat && !Array.isArray(detailData.kunjungan_surat)) {
          existingNomor = (detailData.kunjungan_surat as any).nomor_surat;
        }
        setNomorSurat(existingNomor);
      }
      setLoading(false);
    };
    fetchDetail();
  }, [params.id]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    // TAHAP 1: Update status di tabel kunjungan
    const { error: errKunjungan } = await supabase
      .from('kunjungan')
      .update({ status_surat: statusSurat })
      .eq('id', params.id);

    let errSurat = null;

    // TAHAP 2: Simpan nomor surat ke tabel kunjungan_surat
    if (nomorSurat.trim() !== '') {
      // Cek apakah data surat untuk kunjungan ini sudah ada sebelumnya
      const { data: existingSurat } = await supabase
        .from('kunjungan_surat')
        .select('kunjungan_id')
        .eq('kunjungan_id', params.id)
        .single();

      if (existingSurat) {
        // Jika sudah ada, lakukan UPDATE
        const { error } = await supabase
          .from('kunjungan_surat')
          .update({ nomor_surat: nomorSurat })
          .eq('kunjungan_id', params.id);
        errSurat = error;
      } else {
        // Jika belum ada, lakukan INSERT
        const { error } = await supabase
          .from('kunjungan_surat')
          .insert({ kunjungan_id: params.id, nomor_surat: nomorSurat });
        errSurat = error;
      }
    }

    setIsSaving(false);
    
    if (errKunjungan || errSurat) {
      console.error("Error Kunjungan:", errKunjungan, "Error Surat:", errSurat);
      setSaveMessage('❌ Gagal menyimpan data.');
    } else {
      setSaveMessage('✅ Perubahan berhasil disimpan!');
      setTimeout(() => setSaveMessage(''), 3000);
      setData({ ...data, status_surat: statusSurat });
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!data) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4"><p className="text-gray-500 font-medium">Data kunjungan tidak ditemukan.</p><button onClick={() => router.back()} className="text-blue-600 font-semibold hover:underline">Kembali</button></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold transition-colors group">
          <span className="transform transition-transform group-hover:-translate-x-1">←</span> Kembali ke Daftar Kunjungan
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-[#1e293b] px-8 py-6 flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Tiket Kunjungan Resmi</p>
              <h1 className="text-2xl font-bold text-white tracking-tight">{data.nama_perwakilan}</h1>
            </div>
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <img src="/logo-anri.jpg" alt="Logo ANRI" className="w-12 h-12 object-contain" />
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-5">
                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Asal Instansi</p>
                  <p className="text-slate-800 font-semibold text-lg">{data.instansi?.nama || 'Umum / Pribadi'}</p>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Waktu Kedatangan</p>
                  <p className="text-slate-800 font-semibold text-lg">{new Date(data.waktu_kunjungan).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tujuan Kunjungan</p>
                  <p className="text-slate-700 font-medium leading-relaxed">{data.tujuan || 'Tidak ada keterangan tujuan.'}</p>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Jalur Input</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-slate-200 text-slate-700 uppercase tracking-wide">
                    {data.jalur_input}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col h-full">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-blue-200 pb-2">Update Administrasi Surat</h2>
                
                <div className="space-y-5 flex-1">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Status Berkas/Surat</label>
                    <select 
                      value={statusSurat} 
                      onChange={(e) => setStatusSurat(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    >
                      <option value="ada">✅ Ada Surat / Lengkap</option>
                      <option value="mepet">⏳ Mepet / Menyusul</option>
                      <option value="tanpa">❌ Tidak Ada Surat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nomor Surat Srikandi</label>
                    <input 
                      type="text" 
                      value={nomorSurat} 
                      onChange={(e) => setNomorSurat(e.target.value)}
                      placeholder="Contoh: B-123/ANRI/2026..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-blue-100">
                  {saveMessage && (
                    <div className={`mb-4 p-3 rounded-xl text-sm font-bold text-center animate-fade-in ${saveMessage.includes('berhasil') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {saveMessage}
                    </div>
                  )}
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                  </button>
                </div>
              </div>

            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium">ID Kunjungan: {data.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}