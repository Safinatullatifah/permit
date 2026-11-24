"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Video, Image as ImageIcon, Trash2, UploadCloud } from "lucide-react";

type Materi = {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
};

export default function MateriManagementPage() {
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchMateri();
  }, []);

  const fetchMateri = async () => {
    const res = await fetch("/api/materi");
    if (res.ok) {
      const data = await res.json();
      setMateriList(data);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return alert("Pilih file dan isi judul!");

    setIsUploading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);

    try {
      const res = await fetch("/api/materi", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setTitle("");
        setFile(null);
        // Reset form file input
        const fileInput = document.getElementById("file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        fetchMateri();
        alert("Berhasil mengunggah materi K3!");
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mengunggah");
      }
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus materi ini? File akan dihapus permanen.")) return;
    
    const res = await fetch(`/api/materi?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchMateri();
    } else {
      alert("Gagal menghapus materi");
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes("video")) return <Video className="w-8 h-8 text-blue-500" />;
    if (type.includes("image")) return <ImageIcon className="w-8 h-8 text-green-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Materi K3</h1>
        <p className="text-muted-foreground text-sm">Kelola modul PDF dan Video panduan induksi keselamatan (Sprint 2 Point 4).</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Unggah Materi Baru</h2>
        <form onSubmit={handleUpload} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Materi</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Panduan Bekerja di Ketinggian"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File Dokumen / Video</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,video/mp4,image/*"
              required
            />
          </div>
          <Button type="submit" disabled={isUploading} className="w-full">
            {isUploading ? "Memproses Unggahan..." : (
              <>
                <UploadCloud className="w-4 h-4 mr-2" />
                Unggah ke Server
              </>
            )}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {materiList.map((item) => (
          <div key={item.id} className="flex items-center p-4 bg-white border rounded-lg shadow-sm space-x-4 hover:shadow-md transition">
            {getFileIcon(item.fileType)}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" title={item.title}>
                {item.title}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                  {item.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
        {materiList.length === 0 && (
          <p className="text-sm text-gray-500 col-span-full">Belum ada materi yang diunggah.</p>
        )}
      </div>
    </div>
  );
}