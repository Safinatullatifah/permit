"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink, MessageSquare, AlertCircle, Info } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Ignore network errors on polling
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { notificationId: id } : { markAll: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        title="Pemberitahuan Sistem"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-black text-white bg-red-600 rounded-full animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                Notifikasi Sistem
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {unreadCount} Baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => handleMarkAsRead()}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) handleMarkAsRead(n.id);
                  }}
                  className={`p-3.5 transition-colors cursor-pointer ${
                    n.isRead
                      ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 opacity-70"
                      : "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 font-medium"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                        {n.type === "CHAT_MESSAGE" ? (
                          <MessageSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Info className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                          {n.title}
                        </h4>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>

                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2 pl-8">
                    <span>
                      {new Date(n.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                      >
                        <span>Lihat Detail</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-zinc-400 italic text-xs">
                Tidak ada notifikasi saat ini
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
