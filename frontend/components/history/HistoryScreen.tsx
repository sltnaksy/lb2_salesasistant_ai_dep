"use client";

import { useEffect, useState } from "react";
import { getHistory } from "@/services/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Eye } from "lucide-react";

type HistoryItem = {
  customer_name: string;
  customer_company: string;
  ai_response_id: number;
  message_id: number;
  customer_request: string;
  ai_answer: string;
  status: string;
  created_at: string;
  created_date: string;
  created_time: string;
};

export default function HistoryScreen() {
  const router = useRouter();

  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  // Load history data from backend
  useEffect(() => {
    getHistory()
      .then((data) => setHistoryData(data))
      .catch((error) => console.error(error));
  }, []);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);
// Check for authenticated user on component mount
  useEffect(() => {
  const storedUser = localStorage.getItem("salesAssistantUser");

  if (!storedUser) {
    router.push("/");
  }
}, [router]);

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString("de-CH", {
    timeZone: "Europe/Zurich",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (value: string) => {
  return new Date(value).toLocaleTimeString("de-CH", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
  });
};

  const getStatusStyle = (status: string) => {
    if (status === "approved") {
      return "bg-[#F5F7F4] border-[#A7BDA7] text-[#2D3A3A]";
    }

    if (status === "in_review") {
      return "bg-[#FFF8E7] border-[#E2C593] text-[#2D3A3A]";
    }

    return "bg-white border-[#DDE5DA] text-[#6B7280]";
  };

  const getStatusLabel = (status: string) => {
    if (status === "approved") return "Freigegeben";
    if (status === "in_review") return "In Prüfung";
    if (status === "generated") return "Generiert";

    return status;
  };

  const getAiStyle = (type: string) => {
    if (type === "ai-verified") {
      return "bg-[#8FA98F] border-[#8FA98F] text-white";
    }

    if (type === "ai-supported") {
      return "bg-[#F5F7F4] border-[#A7BDA7] text-[#2D3A3A]";
    }

    return "bg-white border-[#DDE5DA] text-[#6B7280]";
  };

  // Search and status filtering
  const filteredHistory = historyData.filter((row) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      row.customer_request.toLowerCase().includes(search) ||
      row.ai_answer.toLowerCase().includes(search) ||
      row.customer_name.toLowerCase().includes(search) ||
      row.customer_company.toLowerCase().includes(search) ||
      row.created_date.includes(search);

    const matchesStatus =
      statusFilter === "all" || row.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination based on filtered data
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-[#F5F7F4] text-[#2D3A3A] flex flex-col">
      <header className="bg-white border-b border-[#DDE5DA] shadow-sm px-8 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-xl border border-[#DDE5DA] bg-white hover:bg-[#F5F7F4] transition"
          >
            <ArrowLeft className="w-4 h-4 text-[#8FA98F]" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-[#2D3A3A]">
              Verlauf & Aktivitäten
            </h1>

            <p className="text-xs text-[#6B7280]">
              Bearbeitete Kundenanfragen und KI-unterstützte Vorgänge
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA98F]" />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Suchen nach Kunde, Thema oder Datum..."
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#DDE5DA] bg-white text-sm text-[#2D3A3A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#A7BDA7]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-[#DDE5DA] bg-white text-sm text-[#2D3A3A] focus:outline-none focus:ring-2 focus:ring-[#A7BDA7]"
          >
            <option value="all">Alle Status</option>
            <option value="generated">Generiert</option>
            <option value="in_review">In Prüfung</option>
            <option value="approved">Freigegeben</option>
          </select>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-[#DDE5DA] rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#DDE5DA] bg-[#F5F7F4]">
                  <th className="text-left px-6 py-4 text-xs text-[#6B7280]">
                    Datum
                  </th>
                  <th className="text-left px-6 py-4 text-xs text-[#6B7280]">
                    Kunde
                  </th>
                  <th className="text-left px-6 py-4 text-xs text-[#6B7280]">
                    Thema
                  </th>
                  <th className="text-left px-6 py-4 text-xs text-[#6B7280]">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs text-[#6B7280]">
                    KI-Verarbeitung
                  </th>
                  <th className="text-right px-6 py-4 text-xs text-[#6B7280]">
                    Aktion
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedHistory.map((row) => (
                  <tr
                    key={row.ai_response_id}
                    className="border-b border-[#DDE5DA] hover:bg-[#F5F7F4] transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{row.created_date}</div>
                      <div className="text-xs text-[#6B7280]">
                        {row.created_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm max-w-[160px] whitespace-normal break-words">
                      <div className="font-medium text-[#2D3A3A]">
                        {row.customer_name || "Unbekannter Kunde"}
                      </div>

                      {row.customer_company && (
                        <div className="text-[#6B7280] mt-1">
                          {row.customer_company}
                        </div>
                      )}
                    </td>

                    

                    <td className="px-6 py-4 text-sm max-w-[300px] whitespace-normal break-words">
                      {row.customer_request.length > 70
                        ? `${row.customer_request.slice(0, 70)}...`
                        : row.customer_request}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-3 py-1 rounded-full border text-xs ${getStatusStyle(
                          row.status
                        )}`}
                      >
                        {getStatusLabel(row.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${getAiStyle(
                          row.ai_answer ? "ai-supported" : "manual"
                        )}`}
                      >
                        {row.ai_answer ? "KI unterstützt" : "Manuell"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/request?aiResponseId=${row.ai_response_id}`
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#DDE5DA] bg-white text-sm hover:bg-[#F5F7F4] transition"
                      >
                        <Eye className="w-4 h-4 text-[#8FA98F]" />
                        Öffnen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedHistory.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-[#6B7280]">
                Keine passenden Einträge gefunden.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-[#6B7280]">
              Zeige{" "}
              {filteredHistory.length === 0
                ? 0
                : (currentPage - 1) * itemsPerPage + 1}
              –{Math.min(currentPage * itemsPerPage, filteredHistory.length)} von{" "}
              {filteredHistory.length} Einträgen
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-[#DDE5DA] bg-white text-sm hover:bg-[#F5F7F4] transition disabled:opacity-50"
              >
                Zurück
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-xl border text-sm transition ${
                      currentPage === page
                        ? "border-[#A7BDA7] bg-[#F5F7F4]"
                        : "border-[#DDE5DA] bg-white hover:bg-[#F5F7F4]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 rounded-xl border border-[#DDE5DA] bg-white text-sm hover:bg-[#F5F7F4] transition disabled:opacity-50"
              >
                Weiter
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}