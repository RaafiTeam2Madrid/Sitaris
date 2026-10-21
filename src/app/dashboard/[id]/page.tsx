'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function DetailKunjunganPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  
  // State untuk form update dan tampilan data
  const [statusSuratInput, setStatusSuratInput] = useState('tanpa');
  const [nomorSuratInput, setNomorSuratInput] = useState(''); 
  const [savedNomorSurat, setSavedNomorSurat] = useState('-'); // State baru untuk menampilkan nomor surat
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      const { data: kunjungan } = await supabase
        .from('kunjungan')
        .select('*, instansi(nama), topik(nama)')
        .eq('id', params.id)
        .single();
        
      const { data: surat } = await supabase
        .from('kunjungan_surat')
        .select('nomor_surat')
        .eq('kunjungan_id', params.id)
        .maybeSingle();

      if (kunjungan) {
        setData(kunjungan);
        setStatusSuratInput(kunjungan.status_surat); 
      }
      if (surat && surat.nomor_surat) {
        setNomorSuratInput(surat.nomor_surat);
        setSavedNomorSurat(surat.nomor_surat); // Simpan ke state agar bisa ditampilkan di UI
      }
    };
    fetchDetail();
  }, [params.id]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    const { error: errKunjungan } = await supabase
      .from('kunjungan')
      .update({ status_surat: statusSuratInput })
      .eq('id', params.id);

    if (nomorSuratInput.trim() !== '') {
      await supabase
        .from('kunjungan_surat')
        .upsert({ 
          kunjungan_id: params.id, 
          nomor_surat: nomorSuratInput 
        });
    }

    setIsUpdating(false);

    if (errKunjungan) {
      alert('Gagal menyimpan perubahan: ' + errKunjungan.message);
    } else {
      alert('Status dan Nomor Surat berhasil diperbarui!');
      router.push('/dashboard'); 
    }
  };

  if (!data) return <div className="p-8">Memuat detail...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto bg-gray-50 min-h-screen">
      <button onClick={() => router.push('/dashboard')} className="mb-4 text-blue-600 hover:underline">
         Kembali ke Dashboard
      </button>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold mb-4">Detail Kunjungan</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Nama Perwakilan</p>
            <p className="font-medium text-lg">{data.nama_perwakilan}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Instansi</p>
            <p className="font-medium text-lg">{data.instansi?.nama}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Topik</p>
            <p className="font-medium">{data.topik?.nama}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status Surat Saat Ini</p>
            <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
              data.status_surat === 'ada' ? 'bg-green-100 text-green-700' : 
              data.status_surat === 'mepet' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-700'
            }`}>
              {data.status_surat}
            </span>
          </div>
          
          {/* Tambahan UI: Menampilkan Nomor Surat yang sudah tersimpan */}
          <div className="col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100 mt-2">
            <p className="text-sm text-blue-700 font-medium">Nomor Surat Srikandi Terdaftar</p>
            <p className="font-bold text-xl text-gray-900 mt-1">{savedNomorSurat}</p>
          </div>
        </div>

        <hr className="my-4" />
        
        <h2 className="text-lg font-semibold mb-3">Update oleh Petugas</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Update Status Surat</label>
            <select 
              value={statusSuratInput}
              onChange={(e) => setStatusSuratInput(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tanpa">Tanpa Surat</option>
              <option value="ada">Ada Surat</option>
              <option value="mepet">Surat Mepet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nomor Surat Srikandi (Opsional)</label>
            <input 
              type="text" 
              value={nomorSuratInput}
              onChange={(e) => setNomorSuratInput(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Masukkan nomor surat Srikandi..." 
            />
          </div>
          <button 
            onClick={handleUpdate}
            disabled={isUpdating}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}