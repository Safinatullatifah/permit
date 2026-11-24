"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  Paperclip,
  Check,
  CheckCheck,
  User,
  Building2,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Shield,
  Clock,
  X,
} from "lucide-react";

interface SenderInfo {
  id: string;
  full_name: string;
  role: string;
  username: string;
}

interface MessageItem {
  id: string;
  message: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
  sender: SenderInfo;
  isMe: boolean;
}

interface ReadStatusItem {
  userId: string;
  userName: string;
  role: string;
  lastReadAt: string;
}

interface PermitChatBoxProps {
  permitId: string;
  permitNomor?: string;
  workName?: string;
  onClose?: () => void;
}

export function PermitChatBox({
  permitId,
  permitNomor,
  workName,
  onClose,
}: PermitChatBoxProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [readStatuses, setReadStatuses] = useState<ReadStatusItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Attachment state
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatData = async (initial = false) => {
    if (initial) setIsLoading(true);
    try {
      const res = await fetch(`/api/permits/${permitId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setReadStatuses(data.readStatuses || []);
      }
    } catch (err) {
      console.error("Gagal memuat pesan chat:", err);
    } finally {
      if (initial) setIsLoading(false);
    }
  };

  // Initial fetch and auto-polling every 4s
  useEffect(() => {
    fetchChatData(true);
    const interval = setInterval(() => {
      fetchChatData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [permitId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/safety-doc", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mengunggah lampiran");
      }

      setAttachment({
        url: data.filePath,
        name: file.name,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengunggah file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachment) || isSending) return;

    setIsSending(true);
    setErrorMsg("");

    const textToSend = inputText.trim() || (attachment ? `Mengirim lampiran: ${attachment.name}` : "");
    const attachToSend = attachment;

    // Optimistic reset
    setInputText("");
    setAttachment(null);

    try {
      const res = await fetch(`/api/permits/${permitId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          attachmentUrl: attachToSend?.url,
          attachmentName: attachToSend?.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mengirim pesan");
      }

      setMessages((prev) => [...prev, data.message]);
      scrollToBottom();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengirim pesan");
    } finally {
      setIsSending(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SHE":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300";
      case "PIC":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300";
      case "LP":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300";
      case "VENDOR":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300 border-slate-300";
    }
  };

  return (
    <div className="flex flex-col h-[560px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Ruang Diskusi &amp; Klarifikasi Permit
              </h3>
              {permitNomor && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {permitNomor}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-sm">
              {workName || "Diskusi terkoordinasi antara User, PIC, LP, SHE, dan Vendor"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchChatData(false)}
            title="Segarkan pesan"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Tutup ruang obrolan"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-50/30 dark:bg-zinc-950/20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs">Memuat obrolan permit...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Belum ada pesan pada permit ini
            </p>
            <p className="text-[11px] text-zinc-400 max-w-xs">
              Mulai obrolan untuk mengonfirmasi JSA, menanyakan APD, atau mengklarifikasi kesiapan area kerja.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.isMe ? "items-end" : "items-start"}`}
            >
              {/* Sender Name & Role (for incoming messages) */}
              {!m.isMe && (
                <div className="flex items-center gap-1.5 mb-1 pl-1">
                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                    {m.sender.full_name}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                      m.sender.role
                    )}`}
                  >
                    {m.sender.role}
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-1.5 ${
                  m.isMe
                    ? "bg-blue-600 text-white rounded-br-xs"
                    : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-bl-xs"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>

                {/* Attachment if present */}
                {m.attachmentUrl && (
                  <div className="pt-1">
                    <a
                      href={m.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                        m.isMe
                          ? "bg-blue-700 text-blue-100 border-blue-500 hover:bg-blue-800"
                          : "bg-zinc-100 dark:bg-zinc-700 text-blue-600 dark:text-blue-300 border-zinc-200 dark:border-zinc-600 hover:underline"
                      }`}
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[180px]">
                        {m.attachmentName || "Buka Lampiran"}
                      </span>
                    </a>
                  </div>
                )}

                <div
                  className={`text-[9px] flex items-center justify-end gap-1 ${
                    m.isMe ? "text-blue-200" : "text-zinc-400"
                  }`}
                >
                  <span>
                    {new Date(m.createdAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {m.isMe && <CheckCheck className="w-3 h-3 text-blue-200" />}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Read Receipts Status Bar */}
      {readStatuses.length > 0 && (
        <div className="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-1.5 overflow-x-auto">
          <CheckCheck className="w-3 h-3 text-blue-500 shrink-0" />
          <span className="shrink-0 font-medium">Dibaca oleh:</span>
          <div className="flex items-center gap-2 truncate">
            {readStatuses
              .filter((r) => r.userId !== messages[messages.length - 1]?.sender.id)
              .map((r) => (
                <span key={r.userId} className="font-semibold text-zinc-600 dark:text-zinc-300">
                  {r.userName} ({r.role})
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Attached preview */}
      {attachment && (
        <div className="px-4 py-2 bg-blue-50/60 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Paperclip className="w-3.5 h-3.5" />
            <span className="truncate max-w-xs">{attachment.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="p-1 hover:text-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Form Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isSending}
          title="Lampirkan foto atau dokumen"
          className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
        >
          {isUploading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ketik pesan atau klarifikasi permit di sini..."
          className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={isSending || (!inputText.trim() && !attachment)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
        >
          {isSending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
