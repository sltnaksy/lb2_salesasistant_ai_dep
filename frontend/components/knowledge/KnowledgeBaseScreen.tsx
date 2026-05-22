
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Search,
  FileText,
  File,
  ExternalLink,
  Share2,
  X,
  Mail,
  Link2,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getKnowledgeEntries,
} from "@/services/api";
// Type definition for knowledge documents
type KnowledgeDocument = {
  id: number;
  title: string;
  category: string;
  content: string;
  created_at: string;
  file_type: string | null;
  file_size: string | null;
  usage_count: number | null;
  used_in_responses: boolean | null;
};

export default function KnowledgeBaseScreen() {
  // Router for navigation
  const router = useRouter();
  // State for knowledge documents and UI interactions
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const shareMenuRef = useRef<HTMLDivElement | null>(
    null
  );
  // Function to show toast notifications
  const showToast = (message: string) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage("");
    }, 2500);
  };
  // Load knowledge entries from backend
  useEffect(() => {
    getKnowledgeEntries()
      .then((data) => setDocuments(data))
      .catch((error) => console.error(error));
  }, []);
  // Close share menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(
          event.target as Node
        )
      ) {
        setShowShareMenu(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);
  // Check for authenticated user on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("salesAssistantUser");

    if (!storedUser) {
      router.push("/");
    }
  }, [router]);

  const filteredDocuments = documents.filter((doc) => {
    const search = searchTerm.toLowerCase();

    return (
      doc.title.toLowerCase().includes(search) ||
      doc.category.toLowerCase().includes(search) ||
      doc.content.toLowerCase().includes(search)
    );
  });
  // Get the currently selected document based on search and selection
  const selected =
    filteredDocuments[selectedDoc] ||
    filteredDocuments[0] ||
    null;
  // Function to format date strings
  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  // Function to get file icon based on file type
  const getFileIcon = (title: string) => {
    return title.toLowerCase().endsWith(".pdf")
      ? FileText
      : File;
  };
  // Function to handle sharing the document (copying title to clipboard)
  const handleShareDocument = async () => {
    if (!selected) return;

    await navigator.clipboard.writeText(selected.title);

    showToast(`Dokumentname wurde kopiert: ${selected.title}`);
  };

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
              Wissensbasis
            </h1>

            <p className="text-xs text-[#6B7280]">
              Dokumente und Ressourcen für die KI-Antwortgenerierung
            </p>
          </div>
        </div>

        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA98F]" />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedDoc(0);
            }}
            placeholder="Dokumente durchsuchen..."
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#DDE5DA] bg-white text-sm text-[#2D3A3A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#A7BDA7]"
          />
        </div>
      </header>

      <div className="flex-1 grid grid-cols-[370px_1fr] overflow-hidden">
        <aside className="bg-white border-r border-[#DDE5DA] p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-[#6B7280]">
              {filteredDocuments.length} Dokumente
            </p>
            <span className="px-3 py-1 rounded-full border border-[#DDE5DA] bg-[#F5F7F4] text-xs text-[#8FA98F]">
              Wissensbasis aktiv
            </span>
          </div>

          <div className="space-y-4">
            {filteredDocuments.map((doc, index) => {
              const Icon = getFileIcon(doc.title);

              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(index)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${selected?.id === doc.id
                      ? "border-[#8FA98F] bg-[#F5F7F4]"
                      : "border-[#DDE5DA] bg-white hover:bg-[#F5F7F4]"
                    }`}
                >
                  <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl border border-[#DDE5DA] bg-white flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#8FA98F]" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#2D3A3A] truncate">
                        {doc.title}
                      </p>

                      <p className="text-xs text-[#6B7280] mt-1">
                        {doc.category} • {formatDate(doc.created_at)}
                      </p>

                      <p className="text-xs text-[#6B7280] mt-1">
                        Verwendet: {doc.usage_count ?? "—"}x · In Antworten
                      </p>
                    </div>
                    {toastMessage && (
                      <div className="fixed bottom-6 right-6 z-[60] rounded-2xl border border-[#A7BDA7] bg-white px-5 py-4 shadow-xl text-sm text-[#2D3A3A]">
                        {toastMessage}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredDocuments.length === 0 && (
              <p className="text-sm text-[#6B7280]">
                Keine Dokumente gefunden.
              </p>
            )}
          </div>
        </aside>

        <main className="overflow-y-auto p-10">
          {selected && (
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#DDE5DA] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-[#DDE5DA]">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl border border-[#DDE5DA] bg-[#F5F7F4] flex items-center justify-center">
                    {(() => {
                      const Icon = getFileIcon(selected.title);

                      return (
                        <Icon className="w-6 h-6 text-[#8FA98F]" />
                      );
                    })()}
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-[#2D3A3A] mb-3">
                      {selected.title}
                    </h2>

                    <div className="grid grid-cols-2 gap-y-4 text-xs text-[#6B7280]">
                      <p>
                        Kategorie:{" "}
                        <span className="text-[#2D3A3A]">
                          {selected.category}
                        </span>
                      </p>

                      <p>
                        Aktualisiert:{" "}
                        <span className="text-[#2D3A3A]">
                          {formatDate(selected.created_at)}
                        </span>
                      </p>

                      <p>
                        Verwendet:{" "}
                        <span className="text-[#2D3A3A]">
                          {selected.usage_count ?? "—"}x
                        </span>
                      </p>

                      <p>
                        In Antworten:{" "}
                        <span className="text-[#2D3A3A]">
                          {selected.used_in_responses
                            ? "Ja"
                            : "Nein"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#2D3A3A]">
                  {selected.content}
                </div>
              </div>

              <div className="p-6 border-t border-[#DDE5DA] bg-[#F5F7F4] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDocumentModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#A7BDA7] bg-white text-sm hover:bg-[#F5F7F4] transition"
                  >
                    <ExternalLink className="w-4 h-4 text-[#8FA98F]" />
                    Dokument öffnen
                  </button>

                  <div className="relative" ref={shareMenuRef}>
                    <button
                      onClick={() =>
                        setShowShareMenu(!showShareMenu)
                      }
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#DDE5DA] bg-white text-sm hover:bg-[#F5F7F4] transition"
                    >
                      <Share2 className="w-4 h-4 text-[#8FA98F]" />
                      Teilen
                    </button>

                    {showShareMenu && (
                      <div className="absolute bottom-14 left-0 w-56 rounded-2xl border border-[#DDE5DA] bg-white shadow-xl p-2 z-50">
                        <button
                          onClick={handleShareDocument}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F5F7F4] text-sm"
                        >
                          <Link2 className="w-4 h-4 text-[#8FA98F]" />
                          Link kopieren
                        </button>

                        <button
                          onClick={() =>
                            window.open(
                              `mailto:?subject=${selected.title}`
                            )
                          }
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F5F7F4] text-sm"
                        >
                          <Mail className="w-4 h-4 text-[#8FA98F]" />
                          Per E-Mail teilen
                        </button>

                        <button
                          onClick={() =>
                            showToast("Microsoft Teams Integration später möglich.")
                          }
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F5F7F4] text-sm"
                        >
                          <MessageSquare className="w-4 h-4 text-[#8FA98F]" />
                          In Teams teilen
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-[#6B7280]">
                  {selected.file_type || "DOC"} ·{" "}
                  {selected.file_size || "—"}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Document Modal */}
      {showDocumentModal && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="w-full max-w-4xl bg-white rounded-3xl border border-[#DDE5DA] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b border-[#DDE5DA]">
              <div>
                <h2 className="text-xl font-semibold text-[#2D3A3A]">
                  {selected.title}
                </h2>

                <p className="text-xs text-[#6B7280] mt-1">
                  {selected.category}
                </p>
              </div>

              <button
                onClick={() =>
                  setShowDocumentModal(false)
                }
                className="w-10 h-10 rounded-xl border border-[#DDE5DA] flex items-center justify-center hover:bg-[#F5F7F4]"
              >
                <X className="w-5 h-5 text-[#8FA98F]" />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[#2D3A3A]">
              {selected.content}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

