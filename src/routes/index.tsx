import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Bluetooth,
  Heart,
  Zap,
  Activity,
  Moon,
  Flame,
  Feather,
  Check,
  Sparkles,
  Waves,
  ChevronsUp,
} from "lucide-react";
import {
  sendFatigaData,
  sendMetricsData,
  registerConnectivitySync,
  getPendingCount,
} from "@/services/azureApi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sami Watch" },
      { name: "description", content: "Smartwatch UI prototype for Sami biometric assistant." },
    ],
  }),
  component: WatchApp,
});

type ViewId = "splash" | "dashboard" | "slider" | "metrics" | "alert" | "likert";

// Solo estas vistas tendrán los puntitos de navegación inferiores
const NAV_VIEWS: ViewId[] = ["dashboard", "slider", "metrics"];

function WatchApp() {
  const [view, setView] = useState<ViewId>("splash");

  // 1. Quitar la pantalla de carga inicial
  useEffect(() => {
    const t = setTimeout(() => setView("dashboard"), 2200);
    return () => clearTimeout(t);
  }, []);

  // 2. Registrar sincronización con Azure
  useEffect(() => {
    const off = registerConnectivitySync();
    return off;
  }, []);

  // 3. Simular Alerta de IA (a los 12 seg) y Likert automático (a los 25 seg)
  useEffect(() => {
    if (view !== "dashboard") return;
    
    const alertTimer = setTimeout(() => setView("alert"), 12000); // Sale a los 12,000 milisegundos (12s)
    const likertTimer = setTimeout(() => setView("likert"), 25000); // Sale a los 25,000 milisegundos (25s)
    
    return () => {
      clearTimeout(alertTimer);
      clearTimeout(likertTimer);
    };
  }, [view]);

  const go = (next: ViewId) => setView(next);

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-6">
      <div className="relative">
        {/* Watch bezel */}
        <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-neutral-700 via-neutral-900 to-black shadow-2xl" />
        <div className="absolute -inset-1 rounded-full bg-black" />

        {/* Watch face: perfect circle 320x320 */}
        <div
          className="relative rounded-full bg-black overflow-hidden"
          style={{ width: 320, height: 320 }}
        >
          <WatchScreen view={view} onNavigate={go} />
        </div>

        {/* Dots nav under watch (Solo para vistas principales) */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {NAV_VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => go(v)}
              aria-label={v}
              className={`h-2 rounded-full transition-all ${
                view === v ? "w-6 bg-emerald-400" : "w-2 bg-neutral-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WatchScreen({
  view,
  onNavigate,
}: {
  view: ViewId;
  onNavigate: (v: ViewId) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to active section (solo para las 3 vistas principales)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = NAV_VIEWS.indexOf(view);
    if (idx >= 0) {
      el.scrollTo({ top: idx * 320, behavior: "smooth" });
    }
  }, [view]);

  // Vistas a pantalla completa (Alertas y Cargas)
  if (view === "splash") return <Splash />;
  if (view === "alert") return <AlertView onDismiss={() => onNavigate("dashboard")} />;
  if (view === "likert") return <LikertPullView onSaved={() => onNavigate("dashboard")} />;

  // Vistas navegables por Scroll
  return (
    <div
      ref={scrollRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
      onScroll={(e) => {
        const top = (e.target as HTMLDivElement).scrollTop;
        const idx = Math.round(top / 320);
        const next = NAV_VIEWS[idx];
        if (next && next !== view) {
          // El usuario hace scroll libre
        }
      }}
    >
      <section className="snap-start h-[320px] w-[320px]">
        <Dashboard 
          onAlert={() => onNavigate("alert")} 
          onLikert={() => onNavigate("likert")} 
        />
      </section>
      <section className="snap-start h-[320px] w-[320px]">
        <SliderView />
      </section>
      <section className="snap-start h-[320px] w-[320px]">
        <Metrics />
      </section>
    </div>
  );
}

/* ---------------- Splash ---------------- */
function Splash() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center px-8">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-sky-500/30 blur-xl animate-pulse" />
        <div className="relative h-16 w-16 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-400/40">
          <Bluetooth className="text-sky-300 animate-pulse" size={32} />
        </div>
      </div>
      <p className="mt-6 text-white text-lg font-medium tracking-tight">
        Sincronizando datos...
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Sami activo
      </div>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ onAlert, onLikert }: { onAlert: () => void; onLikert: () => void }) {
  const [time, setTime] = useState(() => formatTime(new Date()));
  useEffect(() => {
    const i = setInterval(() => setTime(formatTime(new Date())), 1000 * 30);
    return () => clearInterval(i);
  }, []);

  const progress = 72; // %
  const radius = 70;
  const stroke = 10;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;

  return (
    <div className="h-full w-full flex flex-col items-center justify-between py-7 px-6">
      <p className="text-white/90 text-base font-medium tracking-tight">Hola Diego</p>

      <div className="relative flex items-center justify-center">
        <svg width="170" height="170" className="-rotate-90">
          <defs>
            <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <circle
            cx="85"
            cy="85"
            r={radius}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx="85"
            cy="85"
            r={radius}
            stroke="url(#ring)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ filter: "drop-shadow(0 0 8px rgba(52,211,153,0.6))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Heart className="text-emerald-400 fill-emerald-400" size={26} />
          <span className="mt-1 text-white text-3xl font-semibold tracking-tight">
            {time}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onLikert}
          className="text-[12px] font-medium text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full hover:bg-emerald-400/20 transition-colors"
        >
          Ultima Pregunta
        </button>
        <button
          onClick={onAlert}
          className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
        >
          Núcleo Vital · Óptimo
        </button>
      </div>
    </div>
  );
}

function formatTime(d: Date) {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/* ---------------- Slider ---------------- */
function SliderView() {
  const [value, setValue] = useState(45);

  const color =
    value > 66 ? "text-red-400" : value > 33 ? "text-amber-300" : "text-emerald-400";
  const trackColor =
    value > 66 ? "bg-red-500" : value > 33 ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="h-full w-full flex flex-col items-center justify-between py-6 px-6">
      <p className="text-white text-sm font-medium tracking-tight">¿Nivel de fatiga?</p>

      <div className="flex items-center gap-5">
        <div className="flex flex-col items-center justify-between h-[170px] py-1">
          <Flame className="text-red-400" size={18} />
          <Feather className="text-emerald-400" size={18} />
        </div>

        <div className="relative h-[170px] w-10 rounded-full bg-white/5 border border-white/10 overflow-hidden">
          <div
            className={`absolute bottom-0 left-0 right-0 ${trackColor} transition-all`}
            style={{ height: `${value}%`, opacity: 0.85 }}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="absolute inset-0 w-[170px] h-10 -rotate-90 origin-center opacity-0 cursor-pointer"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%) rotate(-90deg)",
            }}
          />
        </div>

        <div className={`text-3xl font-semibold tabular-nums ${color} w-14 text-center`}>
          {value}
        </div>
      </div>

      <SaveFatigaButton value={value} />
    </div>
  );
}

function SaveFatigaButton({ value }: { value: number }) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "queued">("idle");
  return (
    <button
      onClick={async () => {
        setStatus("sending");
        const r = await sendFatigaData(value, {
          heartRate: 72,
          hrv: 65,
          sleepHours: 4.5,
          usagePercent: 85,
        });
        setStatus(r.sent ? "ok" : "queued");
        setTimeout(() => setStatus("idle"), 1500);
      }}
      className="h-11 w-11 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition flex items-center justify-center shadow-lg shadow-emerald-500/30 disabled:opacity-60"
      aria-label="Guardar"
      disabled={status === "sending"}
    >
      <Check className="text-black" size={22} strokeWidth={3} />
    </button>
  );
}

/* ---------------- Metrics ---------------- */
function Metrics() {
  const [pending, setPending] = useState(0);
  const [synced, setSynced] = useState<"idle" | "sent" | "queued">("idle");

  const metricsData = {
    hrv: 65,
    heartRate: 72,
    sleepHours: 4.5,
    usagePercent: 85,
    steps: 4820,
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await sendMetricsData(metricsData);
      if (cancelled) return;
      setSynced(r.sent ? "sent" : "queued");
      setPending(getPendingCount());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    {
      icon: <Waves size={18} className="text-emerald-400" />,
      label: "HRV",
      value: "65 ms",
      valueClass: "text-emerald-400",
    },
    {
      icon: <Heart size={18} className="text-white" />,
      label: "Pulso",
      value: "72 lpm",
      valueClass: "text-white",
    },
    {
      icon: <Moon size={18} className="text-orange-400" />,
      label: "Sueño hoy",
      value: "4.5 h",
      valueClass: "text-orange-400",
    },
    {
      icon: <Flame size={18} className="text-amber-400" />,
      label: "Uso",
      value: "85%",
      valueClass: "text-amber-300",
    },
  ];

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar px-5 py-5">
      <p className="text-white/70 text-[11px] font-medium uppercase tracking-wider mb-3 text-center">
        Métricas{" "}
        <span className="text-white/40 normal-case tracking-normal">
          ·{" "}
          {synced === "sent"
            ? "sync ✓"
            : synced === "queued"
              ? `offline (${pending})`
              : "…"}
        </span>
      </p>
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-center justify-between bg-neutral-900 rounded-3xl px-4 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center">
                {it.icon}
              </div>
              <span className="text-white text-sm font-medium">{it.label}</span>
            </div>
            <span className={`text-base font-semibold tabular-nums ${it.valueClass}`}>
              {it.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Alert ---------------- */
function AlertView({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 rounded-full ring-4 ring-sky-400/60 shadow-[inset_0_0_40px_rgba(56,189,248,0.35)] animate-pulse pointer-events-none" />

      <div className="h-full w-full flex flex-col items-center justify-between py-8 px-6 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-sky-400/30 blur-md" />
            <div className="relative h-10 w-10 rounded-full bg-sky-500/20 border border-sky-300/40 flex items-center justify-center">
              <Sparkles className="text-sky-300" size={20} />
            </div>
          </div>
          <p className="text-white text-base font-semibold tracking-tight">
            Alerta predictiva
          </p>
        </div>

        <p className="text-white/80 text-[13px] leading-snug px-2">
          Dormiste &lt; 5h. ¿Hacemos una pausa de 2 min?
        </p>

        <div className="flex flex-col gap-2 w-full px-1">
          <button
            onClick={onDismiss}
            className="w-full h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition text-black text-sm font-semibold"
          >
            Aceptar
          </button>
          <button
            onClick={onDismiss}
            className="w-full h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 active:scale-[0.98] transition text-white/80 text-sm font-medium"
          >
            Ignorar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Likert Pull View ---------------- */
export function LikertPullView({ 
  question = "¿Qué tan satisfecho te sientes hoy?", 
  onSaved 
}: { 
  question?: string; 
  onSaved?: () => void; 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [pointer, setPointer] = useState({ x: 160, y: 160 });
  const [hoverVal, setHoverVal] = useState<number | null>(null);
  const [confirmedVal, setConfirmedVal] = useState<number | null>(null);

  // Temporizador: Si pasan 60s sin interacción, se cierra automáticamente
  useEffect(() => {
    if (confirmedVal !== null || isDragging) return;
    const timer = setTimeout(() => {
      if (onSaved) onSaved(); 
    }, 60000);
    return () => clearTimeout(timer);
  }, [isDragging, confirmedVal, onSaved]);

  const segments = [
    { val: 1, color: "stroke-red-500", text: "text-red-500", rot: -65 },
    { val: 2, color: "stroke-orange-500", text: "text-orange-500", rot: -32.5 },
    { val: 3, color: "stroke-yellow-400", text: "text-yellow-400", rot: 0 },
    { val: 4, color: "stroke-lime-400", text: "text-lime-400", rot: 32.5 },
    { val: 5, color: "stroke-green-500", text: "text-green-500", rot: 65 },
  ];

  const handlePointerDown = (e: React.PointerEvent) => {
    if (confirmedVal) return;
    setIsDragging(true);
    updatePointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || confirmedVal) return;
    updatePointer(e);
  };

  const updatePointer = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPointer({ x, y });

    const originX = 160;
    const originY = 180;
    const dx = x - originX;
    const dy = y - originY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 50 && y < 160) {
      const cx = x - 160;
      const cy = y - 160;
      const angle = (Math.atan2(cy, cx) * 180) / Math.PI;

      if (angle > -180 && angle < -140) setHoverVal(1);
      else if (angle >= -140 && angle < -110) setHoverVal(2);
      else if (angle >= -110 && angle < -70) setHoverVal(3);
      else if (angle >= -70 && angle < -40) setHoverVal(4);
      else if (angle >= -40 && angle <= 0) setHoverVal(5);
    } else {
      setHoverVal(null);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (hoverVal !== null) {
      setConfirmedVal(hoverVal);
      setTimeout(() => {
        if (onSaved) onSaved();
      }, 2000);
    } else {
      setPointer({ x: 160, y: 160 });
    }
  };

  if (confirmedVal) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center bg-black px-6">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 transition-transform scale-110">
          <Check className="text-emerald-400" size={36} strokeWidth={3} />
        </div>
        <p className="text-white text-xl font-medium tracking-tight">¡Gracias!</p>
        <p className="text-white/60 text-sm mt-1 leading-snug">Tu respuesta ha sido<br/>registrada.</p>
      </div>
    );
  }

  const radius = 130;
  const circ = 2 * Math.PI * radius; 

  return (
    <div
      className="relative h-full w-full bg-black overflow-hidden touch-none select-none z-50"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 320 320">
        {segments.map((seg) => {
          const isHovered = hoverVal === seg.val;
          return (
            <g key={seg.val} transform={`rotate(${seg.rot - 90}, 160, 160)`}>
              <circle
                cx="160"
                cy="160"
                r={radius}
                fill="none"
                strokeWidth={isHovered ? "10" : "5"}
                className={`${seg.color} transition-all duration-300 ${
                  !isDragging || isHovered ? "opacity-100" : "opacity-30"
                }`}
                strokeDasharray={`40 ${circ}`}
                strokeDashoffset="-20"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {isDragging && (
          <line
            x1="160"
            y1="160"
            x2={pointer.x}
            y2={pointer.y}
            stroke="white"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="opacity-60"
          />
        )}
        
        {isDragging && (
          <circle 
            cx={pointer.x} cy={pointer.y} r="8" fill="white" 
            className="shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
          />
        )}
      </svg>

      {segments.map((seg) => {
        const rad = (seg.rot - 90) * (Math.PI / 180);
        const x = 160 + Math.cos(rad) * 100;
        const y = 160 + Math.sin(rad) * 100;
        const isHovered = hoverVal === seg.val;
        
        return (
          <div
            key={`text-${seg.val}`}
            className={`absolute w-6 h-6 -ml-3 -mt-3 text-center font-bold text-[15px] transition-all duration-300 pointer-events-none ${seg.text} ${
              isHovered ? "scale-150 drop-shadow-[0_0_10px_currentColor]" : (!isDragging ? "opacity-90" : "opacity-20")
            }`}
            style={{ left: x, top: y }}
          >
            {seg.val}
          </div>
        );
      })}

      <div
        className={`absolute inset-x-8 top-20 bottom-20 transition-all duration-500 flex flex-col items-center justify-center text-center pointer-events-none rounded-full ${
          isDragging ? "opacity-0 scale-75 blur-md" : "opacity-100 scale-100"
        }`}
        style={{
          background: "radial-gradient(circle, rgba(20,20,20,0.8) 0%, rgba(0,0,0,0) 70%)"
        }}
      >
        <p className="text-white font-medium text-[15px] leading-tight px-2">
          {question}
        </p>
        <div className="mt-4 flex flex-col items-center gap-0.5 opacity-50">
          <p className="text-[10px] uppercase tracking-wider text-white">Jala el centro</p>
          <ChevronsUp size={18} className="text-white animate-bounce mt-1" />
        </div>
      </div>
    </div>
  );
}