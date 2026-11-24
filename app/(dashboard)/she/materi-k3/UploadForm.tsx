"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function UploadForm() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setIsUploading(true)

    const formData = new FormData(form)
    
    // Kirim data file ke Route Handler (API) yang kita buat tadi
    const response = await fetch("/api/upload-materi", {
      method: "POST",
      body: formData,
    })

    setIsUploading(false)

    if (response.ok) {
      alert("Materi K3 berhasil diunggah!")
      form.reset()
      router.refresh() // Refresh halaman agar tabel terupdate
    } else {
      alert("Gagal mengunggah materi.")
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-4 items-end mb-6">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Materi</label>
        <input type="text" name="title" required placeholder="Contoh: Video Induksi K3" className="w-full border p-2 rounded-md" />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih File (PDF / MP4)</label>
        <input type="file" name="file" accept=".pdf,video/mp4" required className="w-full border p-1.5 rounded-md bg-white" />
      </div>
      <button type="submit" disabled={isUploading} className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800 disabled:bg-gray-400">
        {isUploading ? "Mengunggah..." : "Upload"}
      </button>
    </form>
  )
}