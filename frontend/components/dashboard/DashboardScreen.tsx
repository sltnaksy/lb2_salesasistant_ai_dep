"use client";

import { useEffect, useState } from "react";
import {
  MessageSquarePlus,
  History,
  Search,
  LogOut,
  CheckCircle2,
  Database,
  Clock,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getDashboardStats } from "@/services/api";

type DashboardStats = {
  systemStatus: string;
  knowledgeCount: number;
  lastProcessing: string | null;
  lastProcessingDisplay: string | null;
};

export default function DashboardScreen() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    systemStatus: "System aktiv",
    knowledgeCount: 0,
    lastProcessing: null,
    lastProcessingDisplay: null,
  });
// State to hold current user information
  const [currentUser, setCurrentUser] = useState<{
  username: string;
  email: string;
} | null>(null);

  // Load dashboard statistics from backend
  useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data))
      .catch((error) => console.error(error));
  }, []);
  // Check for authenticated user on component mount
  useEffect(() => {
  const storedUser = localStorage.getItem("salesAssistantUser");

  if (!storedUser) {
    router.push("/");
    return;
  }

  setCurrentUser(JSON.parse(storedUser));
}, [router]);

  const formatDateTime = (value: string | null) => {
    if (!value) return "Noch keine Verarbeitung";

    return new Date(value).toLocaleString("de-CH", {
      timeZone: "Europe/Zurich",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (value: string | null) => {
  if (!value) return "Noch keine Anfrage";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Noch keine Anfrage";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `Vor ${diffMinutes} Minuten`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `Vor ${diffHours} Stunden`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `Vor ${diffDays} Tagen`;
};
  const actionCards = [
    {
      icon: MessageSquarePlus,
      title: "Neue Kundenanfrage",
      description: "Kundenanfrage mit KI-Unterstützung bearbeiten",
      path: "/request",
    },
    {
      icon: History,
      title: "Verlauf & Aktivitäten",
      description: "Bisherige Anfragen und Bearbeitungen ansehen",
      path: "/history",
    },
    {
      icon: Search,
      title: "Wissensbasis durchsuchen",
      description: "Dokumente, FAQ und Sales-Informationen öffnen",
      path: "/knowledge",
    },
  ];

  const systemItems = [
    {
      icon: CheckCircle2,
      title: stats.systemStatus,
      text: "Bereit für Anfragen",
    },
    {
      icon: Database,
      title: "Wissensbasis online",
      text: `${stats.knowledgeCount} Einträge verfügbar`,
    },
    {
      icon: Clock,
      title: "Letzte Verarbeitung",
      text: stats.lastProcessingDisplay || "Noch keine Verarbeitung",
    },
    {
      icon: FileText,
      title: "Letzte Anfrage",
      text: getRelativeTime(stats.lastProcessing),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F4] text-[#2D3A3A]">
      {/* Top navigation */}
      <header className="bg-white border-b border-[#DDE5DA] shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl border border-[#A7BDA7] bg-[#F5F7F4] flex items-center justify-center">
              <img
                src="/ai-assistant.png"
                alt="AI Sales Assistant Icon"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <div className="text-base font-semibold text-[#2D3A3A]">
                AI Sales Assistant
              </div>
              <div className="text-xs text-[#8FA98F]">
                Online fragen. Smarte Antworten.
              </div>
            </div>
          </div>

          {/* User area */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6B7280]">
              {currentUser?.username || "Sales Agent"}
            </span>
            <div className="w-9 h-9 rounded-full border border-[#A7BDA7] bg-[#F5F7F4] flex items-center justify-center">
              {currentUser?.username
                ? currentUser.username
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
                : "SA"}
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("salesAssistantUser");
                router.push("/");
              }}
              className="p-2 rounded-xl border border-[#DDE5DA] bg-white hover:bg-[#F5F7F4] transition"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 text-[#8FA98F]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-8 py-14">
        {/* Page header */}
        <section className="mb-10">
          <h1 className="text-3xl font-semibold text-[#2D3A3A] mb-2">
            Willkommen zurück, {currentUser?.username || "Sales Agent"}
          </h1>
          <p className="text-sm text-[#6B7280]">
            Wählen Sie eine Aktion, um mit dem KI-gestützten Sales-Prozess zu
            beginnen.
          </p>
        </section>

        {/* System overview */}
        <section className="bg-white border border-[#DDE5DA] rounded-3xl shadow-sm p-8 mb-10">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-base font-semibold text-[#2D3A3A]">
                Systemübersicht
              </h2>
              <p className="text-xs text-[#6B7280]">
                Aktueller Status des Proof of Concept
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {systemItems.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#DDE5DA] bg-[#F5F7F4] p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#DDE5DA] flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-[#8FA98F]" />
                  </div>

                  <span className="text-sm font-medium text-[#2D3A3A]">
                    {item.title}
                  </span>
                </div>

                <p className="text-xs text-[#6B7280]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Action cards */}
        <section className="grid grid-cols-3 gap-6">
          {actionCards.map((card, index) => (
            <button
              key={index}
              onClick={() => router.push(card.path)}
              className="group bg-white border border-[#DDE5DA] rounded-3xl shadow-sm p-8 text-left hover:border-[#A7BDA7] hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F5F7F4] border border-[#DDE5DA] flex items-center justify-center mb-7 group-hover:bg-[#DDE5DA] transition">
                <card.icon className="w-6 h-6 text-[#8FA98F]" />
              </div>

              <h2 className="text-lg font-semibold text-[#2D3A3A] mb-2">
                {card.title}
              </h2>

              <p className="text-sm text-[#6B7280] leading-relaxed">
                {card.description}
              </p>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}