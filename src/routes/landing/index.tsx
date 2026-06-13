import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bluetooth,
  Heart,
  Waves,
  Moon,
  Smartphone,
  Watch,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/landing/")({
  head: () => ({
    meta: [
      { title: "Sami — Cuida a quienes cuidan" },
      {
        name: "description",
        content:
          "Monitoreo biométrico pasivo para médicos. Previene el burnout con micro-pausas adaptativas.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-sky-500/30 blur-md" />
            <div className="relative h-9 w-9 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-400/30">
              <Bluetooth className="text-sky-300" size={18} />
            </div>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Sami</span>
        </div>
        <span className="text-white/30 text-xs font-medium px-3 py-1 rounded-full border border-white/10">
          Vital Watch · 2025
        </span>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-3xl mx-auto w-full gap-8">
        {/* Badge */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-4 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-300 text-xs font-medium tracking-wide">
            IA Biométrica Activa
          </span>
        </div>

        {/* Título */}
        <div className="flex flex-col gap-4">
          <h1 className="text-white text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            Cuida a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
              quienes cuidan
            </span>
          </h1>
          <p className="text-white/50 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto">
            Sami monitorea tu biometría de forma pasiva durante la guardia y sugiere
            micro-pausas adaptativas para prevenir el burnout médico.
          </p>
        </div>

        {/* Métricas pill row */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: <Waves size={14} className="text-emerald-400" />, label: "HRV en tiempo real" },
            { icon: <Moon size={14} className="text-orange-400" />, label: "Calidad de sueño" },
            { icon: <Heart size={14} className="text-red-400" />, label: "Frecuencia cardíaca" },
            { icon: <Activity size={14} className="text-sky-400" />, label: "Fatiga predictiva" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"
            >
              {item.icon}
              <span className="text-white/60 text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-lg mt-4">
          {/* App Mobile */}
          <button
            onClick={() => void navigate({ to: "/mobile/" })}
            className={cn(
              "group relative flex flex-col items-center gap-4 p-7 rounded-3xl border transition-all duration-300",
              "bg-neutral-900 border-white/10",
              "hover:border-emerald-400/50 hover:bg-emerald-500/5 hover:scale-[1.02] active:scale-[0.98]",
            )}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center group-hover:border-emerald-400/50 transition-colors">
                <Smartphone className="text-emerald-400" size={30} />
              </div>
            </div>
            <div className="flex flex-col gap-1 text-center">
              <p className="text-white font-semibold text-lg tracking-tight">App Mobile</p>
              <p className="text-white/40 text-sm leading-snug">
                Panel completo, métricas y chat con Sami
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400/70 text-xs font-medium group-hover:text-emerald-400 transition-colors">
              <ShieldCheck size={13} />
              Acceso médico seguro
            </div>
          </button>

          {/* App Reloj */}
          <button
            onClick={() => void navigate({ to: "/" })}
            className={cn(
              "group relative flex flex-col items-center gap-4 p-7 rounded-3xl border transition-all duration-300",
              "bg-neutral-900 border-white/10",
              "hover:border-sky-400/50 hover:bg-sky-500/5 hover:scale-[1.02] active:scale-[0.98]",
            )}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-sky-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-16 w-16 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center group-hover:border-sky-400/50 transition-colors">
                <Watch className="text-sky-300" size={30} />
              </div>
            </div>
            <div className="flex flex-col gap-1 text-center">
              <p className="text-white font-semibold text-lg tracking-tight">App Reloj</p>
              <p className="text-white/40 text-sm leading-snug">
                Interfaz de smartwatch, alertas y fatiga
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-sky-400/70 text-xs font-medium group-hover:text-sky-400 transition-colors">
              <Zap size={13} />
              Demo interactiva
            </div>
          </button>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t border-white/5 py-10 px-6">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: <Sparkles size={20} className="text-sky-300" />,
              title: "IA Empática",
              desc: "Sami detecta fatiga crónica e inicia conversaciones de apoyo adaptativas.",
            },
            {
              icon: <ShieldCheck size={20} className="text-emerald-400" />,
              title: "Offline-First",
              desc: "Tus datos se respaldan localmente si falla la red, sin perder telemetría.",
            },
            {
              icon: <Zap size={20} className="text-amber-400" />,
              title: "Micro-pausas",
              desc: "Intervenciones de 2 min basadas en HRV, sueño y wear time.",
            },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                {f.icon}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-5 px-6 text-center">
        <p className="text-white/20 text-xs">
          Sami · Vital Watch — Hackathon 2025 · Monitoreo biométrico para médicos
        </p>
      </footer>
    </div>
  );
}
