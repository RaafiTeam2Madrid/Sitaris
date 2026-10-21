'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const periksaAkses = async () => {
      // Cek apakah ada sesi login yang aktif di browser
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Jika tidak ada sesi (belum login), tendang balik ke halaman login
        router.push('/login');
      } else {
        // Jika ada sesi, persilakan masuk
        setIsChecking(false);
      }
    };

    periksaAkses();
  }, [router]);

  // Tampilkan layar loading sebentar saat satpam sedang mengecek identitas
  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500 font-medium">Memeriksa akses keamanan...</p>
      </div>
    );
  }

  // Jika aman, tampilkan isi dashboard aslinya
  return <>{children}</>;
}