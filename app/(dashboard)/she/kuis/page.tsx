"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CheckCircle2,
  Edit3,
  HelpCircle,
  ImagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"

type ChoiceItem = {
  id?: string
  text: string
  isCorrect: boolean
}

type QuizItem = {
  id: string
  question: string
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  choices: {
    id: string
    text: string
    isCorrect: boolean
  }[]
}

const createDefaultChoices = (): ChoiceItem[] => [
  { text: "", isCorrect: true },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
]

export default function BankSoalKuisPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Form state (dipakai bersama untuk Tambah & Edit)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [question, setQuestion] = useState("")
  const [choices, setChoices] = useState<ChoiceItem[]>(createDefaultChoices)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchQuizzes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/quizzes")
      if (res.ok) {
        const data: QuizItem[] = await res.json()
        setQuizzes(data)
      }
    } catch {
      setErrorMsg("Gagal memuat daftar soal kuis")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  // Bersihkan object URL saat file gambar berubah atau unmount
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(imageFile)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])

  const resetForm = () => {
    setEditingId(null)
    setQuestion("")
    setChoices(createDefaultChoices())
    setImageFile(null)
    setExistingImageUrl(null)
    setRemoveExistingImage(false)
    setPreviewUrl(null)
    setErrorMsg(null)
    const fileInput = document.getElementById("quiz-image") as HTMLInputElement | null
    if (fileInput) fileInput.value = ""
  }

  const handleChoiceTextChange = (index: number, value: string) => {
    setChoices((prev) =>
      prev.map((choice, idx) => (idx === index ? { ...choice, text: value } : choice))
    )
  }

  const handleSelectCorrect = (index: number) => {
    setChoices((prev) =>
      prev.map((choice, idx) => ({ ...choice, isCorrect: idx === index }))
    )
  }

  const handleAddChoice = () => {
    if (choices.length >= 6) return
    setChoices((prev) => [...prev, { text: "", isCorrect: false }])
  }

  const handleRemoveChoice = (index: number) => {
    if (choices.length <= 2) return
    setChoices((prev) => {
      const next = prev.filter((_, idx) => idx !== index)
      if (!next.some((c) => c.isCorrect)) {
        next[0] = { ...next[0], isCorrect: true }
      }
      return next
    })
  }

  const handleStartEdit = (quiz: QuizItem) => {
    setEditingId(quiz.id)
    setQuestion(quiz.question)
    setChoices(
      quiz.choices.map((c) => ({
        id: c.id,
        text: c.text,
        isCorrect: c.isCorrect,
      }))
    )
    setImageFile(null)
    setExistingImageUrl(quiz.imageUrl)
    setRemoveExistingImage(false)
    setErrorMsg(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const trimmedQuestion = question.trim()
    const cleanedChoices = choices.map((c) => ({
      text: c.text.trim(),
      isCorrect: c.isCorrect,
    }))

    if (!trimmedQuestion) {
      setErrorMsg("Pertanyaan soal wajib diisi.")
      return
    }
    if (cleanedChoices.some((c) => !c.text)) {
      setErrorMsg("Semua teks opsi pilihan ganda wajib diisi.")
      return
    }
    if (cleanedChoices.filter((c) => c.isCorrect).length !== 1) {
      setErrorMsg("Pilih tepat 1 kunci jawaban yang benar.")
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("question", trimmedQuestion)
    formData.append("choices", JSON.stringify(cleanedChoices))
    if (imageFile) {
      formData.append("image", imageFile)
    }
    if (editingId && removeExistingImage && !imageFile) {
      formData.append("removeImage", "true")
    }

    try {
      const url = editingId ? `/api/quizzes/${editingId}` : "/api/quizzes"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, { method, body: formData })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menyimpan soal kuis.")
        return
      }

      resetForm()
      await fetchQuizzes()
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan saat menyimpan soal.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (quiz: QuizItem) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !quiz.isActive }),
      })
      if (res.ok) {
        setQuizzes((prev) =>
          prev.map((item) =>
            item.id === quiz.id ? { ...item, isActive: !quiz.isActive } : item
          )
        )
      }
    } catch {
      alert("Gagal mengubah status soal.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus soal kuis ini secara permanen?")) return
    try {
      const res = await fetch(`/api/quizzes?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        if (editingId === id) resetForm()
        setQuizzes((prev) => prev.filter((item) => item.id !== id))
      } else {
        const err = await res.json()
        alert(err.error || "Gagal menghapus soal.")
      }
    } catch {
      alert("Terjadi kesalahan jaringan.")
    }
  }

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      quiz.question.toLowerCase().includes(q) ||
      quiz.choices.some((c) => c.text.toLowerCase().includes(q))
    )
  })

  const activeCount = quizzes.filter((q) => q.isActive).length
  const displayedImage = previewUrl || (!removeExistingImage ? existingImageUrl : null)

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Manajemen Bank Soal Kuis Induksi K3
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola pertanyaan evaluasi pemahaman K3, ilustrasi gambar situasi kerja, dan kunci jawaban pilihan ganda.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-md font-medium text-gray-700">
            Total Soal: <strong>{quizzes.length}</strong>
          </span>
          <span className="bg-green-50 border border-green-200 px-3 py-1.5 rounded-md font-medium text-green-700">
            Aktif: <strong>{activeCount}</strong>
          </span>
        </div>
      </div>

      {/* Form Tambah / Edit Soal */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between border-b pb-3 mb-5">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-slate-700" />
            {editingId ? "Edit Soal Kuis" : "Tambah Soal Kuis Baru"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Batal Edit
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pertanyaan */}
          <div className="space-y-2">
            <Label htmlFor="question" className="text-gray-700">
              Pertanyaan Kuis
            </Label>
            <textarea
              id="question"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Contoh: APD apa yang wajib digunakan saat melakukan pekerjaan pengelasan di ketinggian?"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          {/* Ilustrasi Gambar Situasi Kerja (Opsional) */}
          <div className="space-y-2">
            <Label htmlFor="quiz-image" className="text-gray-700">
              Ilustrasi Gambar Situasi Kerja (Opsional)
            </Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Input
                id="quiz-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const selected = e.target.files?.[0] || null
                  setImageFile(selected)
                  if (selected) setRemoveExistingImage(false)
                }}
                className="max-w-md bg-white"
              />
              {displayedImage && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null)
                    setRemoveExistingImage(true)
                    const fileInput = document.getElementById("quiz-image") as HTMLInputElement | null
                    if (fileInput) fileInput.value = ""
                  }}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Gambar
                </button>
              )}
            </div>
            {displayedImage ? (
              <div className="mt-2 inline-block border rounded-lg p-2 bg-slate-50">
                <Image
                  src={displayedImage}
                  alt="Preview ilustrasi soal"
                  width={320}
                  height={180}
                  unoptimized
                  className="max-h-44 w-auto rounded object-contain"
                />
              </div>
            ) : (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <ImagePlus className="w-3.5 h-3.5" /> Format yang didukung: JPG, PNG, WEBP.
              </p>
            )}
          </div>

          {/* Opsi Pilihan Ganda Dinamis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700">
                Opsi Pilihan Ganda & Kunci Jawaban
              </Label>
              {choices.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddChoice}
                  className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Opsi
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {choices.map((choice, index) => {
                const optionLabel = String.fromCharCode(65 + index)
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition ${
                      choice.isCorrect
                        ? "border-green-400 bg-green-50/60"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctChoice"
                      checked={choice.isCorrect}
                      onChange={() => handleSelectCorrect(index)}
                      title={`Jadikan opsi ${optionLabel} sebagai kunci jawaban`}
                      className="h-4 w-4 accent-green-600 cursor-pointer"
                    />
                    <span className="w-6 text-center text-xs font-bold text-gray-600">
                      {optionLabel}.
                    </span>
                    <Input
                      type="text"
                      value={choice.text}
                      onChange={(e) => handleChoiceTextChange(index, e.target.value)}
                      placeholder={`Isi opsi jawaban ${optionLabel}`}
                      required
                      className="flex-1 bg-white"
                    />
                    {choice.isCorrect && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Benar
                      </span>
                    )}
                    {choices.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChoice(index)}
                        title="Hapus opsi"
                        className="p-1.5 text-gray-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-500">
              Pilih tombol bulat di sebelah kiri untuk menandai 1 jawaban yang benar.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:bg-gray-400 transition"
            >
              {isSubmitting
                ? "Menyimpan..."
                : editingId
                ? "Simpan Perubahan"
                : "Simpan Soal"}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar Bank Soal */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Bank Soal</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pertanyaan atau opsi..."
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500 py-6 text-center">Memuat bank soal...</p>
        ) : filteredQuizzes.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center border rounded-md bg-slate-50">
            {quizzes.length === 0
              ? "Belum ada soal kuis. Tambahkan soal pertama pada form di atas."
              : "Tidak ada soal yang cocok dengan kata kunci pencarian."}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredQuizzes.map((quiz, qIndex) => (
              <div
                key={quiz.id}
                className={`border rounded-lg p-4 transition ${
                  quiz.isActive ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50 opacity-80"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                        Soal #{qIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(quiz)}
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full transition ${
                          quiz.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {quiz.isActive ? "Aktif" : "Non-aktif"}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900 whitespace-pre-line">
                      {quiz.question}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(quiz)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(quiz.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>

                {quiz.imageUrl && (
                  <div className="mt-3">
                    <Image
                      src={quiz.imageUrl}
                      alt={`Ilustrasi soal ${qIndex + 1}`}
                      width={320}
                      height={180}
                      unoptimized
                      className="max-h-44 w-auto rounded border object-contain bg-slate-50"
                    />
                  </div>
                )}

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quiz.choices.map((choice, cIndex) => {
                    const letter = String.fromCharCode(65 + cIndex)
                    return (
                      <div
                        key={choice.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border ${
                          choice.isCorrect
                            ? "bg-green-50 border-green-300 text-green-900 font-medium"
                            : "bg-slate-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        <span className="font-bold text-xs">{letter}.</span>
                        <span className="flex-1">{choice.text}</span>
                        {choice.isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
