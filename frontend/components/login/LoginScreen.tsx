"use client";

import { useState } from "react";
import { Lock, Mail, LogIn, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/api";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("sultan@test.com");
  const [password, setPassword] = useState("testhash123");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = await loginUser(email, password);

if (!result.success) {
  setErrorMessage("E-Mail oder Passwort ist ungültig.");
  return;
}

localStorage.setItem(
  "salesAssistantUser",
  JSON.stringify(result.user)
);

router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setErrorMessage("E-Mail oder Passwort ist ungültig.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F4] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#DDE5DA] overflow-hidden">
        <div className="p-10 md:p-14 flex flex-col justify-center">
          <div className="mb-6 flex justify-center">
            <img
              src="/ai-assistant.png"
              alt="AI Sales Assistant Icon"
              className="w-24 h-24 object-contain"
            />
          </div>

          <div className="mb-10">
            <h2 className="text-3xl text-[#2D3A3A] mb-2 text-center">
             Willkommen
            </h2>
            <p className="text-sm text-[#6B7280] mb-2 text-center">
              Anmelden, um den Assistenten zu nutzen.
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm text-[#2D3A3A] mb-2">
                E-Mail
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8FA98F]" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sales.agent@company.com"
                  className="w-full h-12 pl-12 pr-4 border border-[#DDE5DA] rounded-xl bg-white text-sm text-[#2D3A3A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#A7BDA7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#2D3A3A] mb-2">
                Passwort
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8FA98F]" />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort eingeben"
                  className="w-full h-12 pl-12 pr-4 border border-[#DDE5DA] rounded-xl bg-white text-sm text-[#2D3A3A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#A7BDA7]"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-[#E2C593] bg-[#FFF8E7] px-4 py-3 text-xs text-[#6B7280]">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-[#8FA98F] text-white text-sm flex items-center justify-center gap-2 hover:bg-[#7F9A7F] transition disabled:opacity-60"
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? "Anmeldung läuft..." : "Anmelden"}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl border border-[#DDE5DA] bg-[#F5F7F4] flex gap-3">
            <ShieldCheck className="w-5 h-5 text-[#8FA98F] shrink-0 mt-1" />

            <div>
              <p className="text-sm text-[#2D3A3A]">Proof of Concept</p>

              <p className="text-xs text-[#6B7280]">
                Es werden ausschliesslich simulierte Testdaten verwendet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}