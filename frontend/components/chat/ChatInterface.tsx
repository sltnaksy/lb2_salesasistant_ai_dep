"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    Send,
    RefreshCw,
    Edit3,
    Target,
    FileText,
    Activity,
    AlertTriangle,
} from "lucide-react";
import {
    generateAiAnswer,
    updateAiResponseStatus,
    updateAiResponseText,
    getAiResponseById,
} from "@/services/api";
import { request } from "https";
type Source = {
    id: number;
    title: string;
    category: string;
};
// Helper function to extract customer name from request text
export default function ChatInterface() {
    const router = useRouter();
    // State variables for customer request, AI answer, sources, confidence, etc.
    const searchParams = useSearchParams();
    const [customerRequest, setCustomerRequest] = useState(`Guten Tag,

wir sind an Ihrer Enterprise-Lösung für unser Unternehmen mit ca. 500 Mitarbeitern interessiert.

Können Sie uns Informationen zu Preisen und dem Implementierungszeitraum zusenden?

Mit freundlichen Grüssen,
Thomas Müller
TechCorp GmbH`);

    const [aiAnswer, setAiAnswer] = useState(`Sehr geehrter Herr Müller,

vielen Dank für Ihr Interesse an unserer Enterprise-Lösung.

Für Unternehmen mit 500 Mitarbeitenden bieten wir eine individuelle Preisgestaltung mit Mengenrabatten an.
Die typische Implementierungsdauer beträgt 6–8 Wochen.

Gerne würden wir einen Termin vereinbaren, um Ihre spezifischen Anforderungen zu besprechen.

Mit freundlichen Grüssen
Sales Team`);

    const [sources, setSources] = useState<Source[]>([
        { id: 1, title: "pricing_model_v3.pdf", category: "Pricing" },
        { id: 2, title: "enterprise_onboarding.doc", category: "Onboarding" },
        { id: 3, title: "sales_playbook_q2.pdf", category: "Sales" },
    ]);

    const [confidence, setConfidence] = useState(94);
    const [requestType, setRequestType] = useState("Enterprise Sales");

    const [priority, setPriority] = useState("Hoch");

    const [intents, setIntents] = useState([
        "Enterprise Preisanfrage",
        "Implementierungszeitraum",
    ]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiResponseId, setAiResponseId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedAnswer, setEditedAnswer] = useState("");
    const [reviewStatus, setReviewStatus] = useState("generated");
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [createdAt, setCreatedAt] = useState(new Date().toISOString());
    const [messageId, setMessageId] = useState<number | null>(null);
    // Load existing AI response if aiResponseId is present in URL
    useEffect(() => {
        const id = searchParams.get("aiResponseId");

        if (!id) return;

        getAiResponseById(Number(id))
            .then((data) => {
                setCustomerRequest(data.customer_request);

                setAiAnswer(data.ai_answer);

                setAiResponseId(data.ai_response_id);

                setRequestType(data.request_type);

                setPriority(data.priority);

                setIntents(data.intents || []);

                setConfidence(Number(data.confidence) || 0);
                setCreatedAt(data.created_at);
                setMessageId(data.message_id);
            })
            .catch((error) => console.error(error));
    }, [searchParams]);
    // Check for authenticated user on component mount
    useEffect(() => {
        const storedUser = localStorage.getItem("salesAssistantUser");

        if (!storedUser) {
            router.push("/");
        }
    }, [router]);
    // Handler function to generate AI answer
    const handleGenerateAnswer = async () => {
        try {
            setIsGenerating(true);

            const result = await generateAiAnswer(customerRequest);

            setAiAnswer(result.answer);

            setSources(result.sources);

            setConfidence(result.confidence);

            setRequestType(result.requestType);

            setPriority(result.priority);

            setIntents(result.intents);

            setAiResponseId(result.aiResponseId);

            setReviewStatus(result.status);
            setCreatedAt(new Date().toISOString());
            setMessageId(result.messageId);

        } catch (error) {
            console.error(error);
            setAiAnswer(
                "Die KI-Antwort konnte nicht generiert werden. Bitte überprüfen Sie die Verbindung zum Backend."
            );
        } finally {
            setIsGenerating(false);
        }
    };
    // Handler functions for review, edit, save, etc.
    const displayConfidence =
        confidence <= 1
            ? Math.round(confidence * 100)
            : Math.round(confidence);
    // Handler functions for review, edit, save, etc.
    const handleReview = async () => {
        try {
            if (!aiResponseId) return;

            const result = await updateAiResponseStatus(
                aiResponseId,
                "in_review"
            );

            setReviewStatus(result.status);
        } catch (error) {
            console.error(error);
        }
    };
    const handleEdit = () => {
        setEditedAnswer(aiAnswer);
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        try {
            if (!aiResponseId) return;

            const result = await updateAiResponseText(
                aiResponseId,
                editedAnswer
            );


            setAiAnswer(result.generated_text);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
        }

    };
    // Helper function to format date/time
    const formatDateTime = (value: string) => {
        return new Date(value).toLocaleString("de-CH", {
            timeZone: "Europe/Zurich",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };
    return (
        <div className="min-h-screen bg-[#F5F7F4] text-[#2D3A3A] flex flex-col">
            <header className="bg-white border-b border-[#DDE5DA] shadow-sm px-8 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="p-2 rounded-xl border border-[#DDE5DA] bg-white hover:bg-[#F5F7F4] transition"
                    >
                        <ArrowLeft className="w-4 h-4 text-[#8FA98F]" />
                    </button>

                    <div>
                        <h1 className="text-lg font-semibold text-[#2D3A3A]">
                            Kundenanfrage bearbeiten
                        </h1>
                        <p className="text-xs text-[#6B7280]">
                            Anfrage #{messageId ?? "neu"}
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-[32%_1fr_280px] overflow-hidden min-w-0">
                <aside className="bg-white border-r border-[#DDE5DA] p-8 overflow-y-auto min-w-0">
                    <h2 className="text-sm font-semibold mb-4">Kundenanfrage</h2>

                    <div className="rounded-2xl border border-[#DDE5DA] bg-[#F5F7F4] p-6 text-sm leading-relaxed text-[#2D3A3A]">
                        <div className="whitespace-pre-wrap break-words font-sans">
                            <textarea
                                value={customerRequest}
                                onChange={(e) => setCustomerRequest(e.target.value)}
                                className="w-full min-h-[300px] rounded-2xl border-none bg-[#F5F7F4] p-0 text-sm leading-relaxed text-[#2D3A3A] focus:outline-none resize-none"
                                spellCheck={false}
                            />
                        </div>
                    </div>
                    {showAnalysis && (
                        <div className="mt-4 pt-4 border-t border-[#DDE5DA] space-y-4 text-xs text-[#2D3A3A]">

                            <div className="flex justify-between">
                                <span className="text-[#6B7280]">Eingang:</span>
                                <span>{formatDateTime(createdAt)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-[#6B7280]">Priorität:</span>
                                <span>{priority}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#6B7280]">Kategorie:</span>
                                <span>{requestType}</span>
                            </div>

                        </div>
                    )}
                    <button
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className="w-full mt-6 h-11 rounded-xl border border-[#A7BDA7] bg-white text-sm text-[#2D3A3A] hover:bg-[#F5F7F4] transition"
                    >
                        {showAnalysis ? "Analyse ausblenden" : "Detaillierte Analyse anzeigen"}
                    </button>
                </aside>
                <main className="bg-white p-8 overflow-y-auto min-w-0">
                    <h2 className="text-sm font-semibold mb-4">
                        KI-generierte Antwort
                    </h2>

                    <div className="rounded-2xl border border-[#DDE5DA] bg-white shadow-sm p-6 mb-6 min-h-[330px]">
                        {isGenerating ? (
                            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
                                <div className="w-4 h-4 border-2 border-[#A7BDA7] border-t-transparent rounded-full animate-spin" />
                                KI-Antwort wird generiert...
                            </div>
                        ) : isEditing ? (
                            <textarea
                                value={editedAnswer}
                                onChange={(e) => setEditedAnswer(e.target.value)}
                                className="w-full min-h-[260px] resize-none outline-none text-sm text-[#2D3A3A] bg-white font-sans"
                            />
                        ) : aiAnswer ? (
                            <div className="whitespace-pre-wrap break-words font-sans text-sm text-[#2D3A3A]">
                                {aiAnswer}
                            </div>
                        ) : (
                            <div className="text-sm text-[#6B7280]">
                                Noch keine KI-Antwort generiert.
                            </div>
                        )}
                        </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleGenerateAnswer}
                            disabled={isGenerating}
                            className="px-5 py-3 rounded-xl border border-[#DDE5DA] bg-white text-sm hover:bg-[#F5F7F4] transition flex items-center gap-2 disabled:opacity-60"
                        >
                            <RefreshCw className="w-4 h-4 text-[#8FA98F]" />
                            {isGenerating ? "Wird generiert..." : "Neu generieren"}
                        </button>

                        <button
                            onClick={isEditing ? handleSaveEdit : handleEdit}
                            className="px-5 py-3 rounded-xl border border-[#DDE5DA] bg-white text-sm hover:bg-[#F5F7F4] transition flex items-center gap-2"
                        >
                            <Edit3 className="w-4 h-4 text-[#8FA98F]" />
                            {isEditing ? "Speichern" : "Bearbeiten"}

                        </button>

                        <button onClick={handleReview}
                            className="ml-auto px-7 py-3 rounded-xl bg-[#8FA98F] text-white text-sm hover:bg-[#7F9A7F] transition flex items-center gap-2">
                            Zur Prüfung
                        </button>
                    </div>

                    <div className="mt-6 p-4 rounded-xl border border-[#E2C593] bg-[#FFF8E7] flex gap-3 text-xs text-[#6B7280]">
                        <AlertTriangle className="w-4 h-4 text-[#D9A441] shrink-0" />
                        <span>
                            Diese Antwort wurde automatisch generiert und muss vor dem Versand
                            manuell überprüft werden.
                        </span>
                    </div>
                </main>

                <aside className="bg-[#F5F7F4] border-l border-[#DDE5DA] p-6 overflow-y-auto min-w-0">
                    <h2 className="text-sm font-semibold mb-6">KI-Kontext</h2>

                    <div className="rounded-2xl border border-[#DDE5DA] bg-white p-4 mb-5">
                        <p className="text-xs text-[#6B7280] mb-2">Anfrage Typ</p>
                        <p className="text-sm font-medium">{requestType}</p>
                        <p className="text-xs text-[#6B7280] mt-1">
                            Priorität: {priority}
                        </p>
                    </div>

                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-[#8FA98F]" />
                            <h3 className="text-xs font-medium">Erkannte Absicht</h3>
                        </div>
                        <div className="space-y-2">
                            {intents.map((intent, index) => (
                                <div
                                    key={index}
                                    className="px-3 py-2 rounded-xl bg-white border border-[#DDE5DA] text-xs"
                                >
                                    {intent}
                                </div>
                            ))}
                        </div>

                    </div>

                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-[#8FA98F]" />
                            <h3 className="text-xs font-medium">Verwendete Quellen</h3>
                        </div>

                        <div className="space-y-2 text-xs text-[#6B7280]">
                            {sources.map((source) => (
                                <p key={source.id}>• {source.title}</p>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#DDE5DA] bg-white p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 text-[#8FA98F]" />
                            <h3 className="text-xs font-medium">KI-Konfidenz</h3>
                        </div>

                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-[#6B7280]">Antwortqualität</span>
                            <span>{displayConfidence}%</span>
                        </div>

                        <div className="h-2 rounded-full bg-[#DDE5DA] overflow-hidden">
                            <div
                                className="h-full bg-[#8FA98F]"
                                style={{ width: `${displayConfidence}%` }}
                            />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}




