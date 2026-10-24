import FormTamuPublik from '@/components/FormTamuPublik';

export default function HalamanTamu() {
  return (
    // Background abu-abu muda seperti di desain mockup
    // Ditambahkan flex-col agar elemen tersusun vertikal
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10">
      
      {/* Komponen Form Utama */}
      <FormTamuPublik />
      
      {/* Tautan halus untuk akses Login Petugas */}
      <div className="mt-8 text-center">
        <a href="/login" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
          Login Petugas ANRI
        </a>
      </div>
      
    </main>
  );
}