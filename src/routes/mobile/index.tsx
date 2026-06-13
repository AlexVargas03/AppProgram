import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Home,
  Activity,
  SlidersHorizontal,
  MessageCircle,
  Heart,
  Waves,
  Moon,
  Flame,
  Zap,
  Sparkles,
  Check,
  Bluetooth,
  ShieldAlert,
  LogOut,
  ChevronRight,
  UserCircle,
  Building2,
  Calendar,
  Stethoscope,
  Venus,
} from "lucide-react";
import {
  sendFatigaData,
  sendMetricsData,
  registerConnectivitySync,
  getPendingCount,
} from "@/services/azureApi";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/mobile/")({
  head: () => ({
    meta: [
      { title: "Sami · Mobile" },
      { name: "description", content: "Sami Watch — panel móvil del médico." },
    ],
  }),
  component: MobileApp,
});

type Tab = "home" | "metrics" | "fatigue" | "sami" | "profile";
type AppView = "login" | "register" | "onboarding" | "quiz" | "app";

const DEMO_MODE = !import.meta.env.VITE_FIREBASE_API_KEY;

function MobileApp() {
  const { user, loading: authLoading, error: authError, login, register, logout } = useAuth();
  const [view, setView] = useState<AppView>("login");
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    const off = registerConnectivitySync();
    return off;
  }, []);

  useEffect(() => {
    if (DEMO_MODE) return;
    if (authLoading) return;
    if (!user) {
      setView((v) => (v === "register" ? "register" : "login"));
      return;
    }
    const onboarded = localStorage.getItem(`sami:onboarded:${user.uid}`) === "true";
    const quizDone = localStorage.getItem(`sami:quiz:${user.uid}`) === "true";
    setView(!onboarded ? "onboarding" : !quizDone ? "quiz" : "app");
  }, [user, authLoading]);

  if (!DEMO_MODE && authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <span className="h-8 w-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
      </div>
    );
  }

  if (view === "login") {
    return (
      <LoginScreen
        login={login}
        loading={authLoading}
        error={authError}
        onRegister={() => setView("register")}
        onDemo={DEMO_MODE ? () => setView("onboarding") : undefined}
      />
    );
  }

  if (view === "register") {
    return (
      <RegisterScreen
        register={register}
        loading={authLoading}
        error={authError}
        onLogin={() => setView("login")}
      />
    );
  }

  if (view === "onboarding") {
    return <OnboardingScreen uid={user?.uid ?? "demo"} onDone={() => setView("quiz")} />;
  }

  if (view === "quiz") {
    return <QuizScreen uid={user?.uid ?? "demo"} onDone={() => setView("app")} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 pb-20">
      <div className="max-w-md mx-auto px-4 pt-6">
        {tab === "home" && (
          <DashboardScreen onLogout={DEMO_MODE ? () => setView("login") : logout} />
        )}
        {tab === "metrics" && <MetricasScreen />}
        {tab === "fatigue" && <FatigaScreen />}
        {tab === "sami" && <SamiScreen />}
        {tab === "profile" && (
          <ProfileScreen
            uid={user?.uid ?? "demo"}
            onLogout={DEMO_MODE ? () => setView("login") : logout}
          />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-white/10 flex items-center justify-around px-2 py-3">
        {(
          [
            { id: "home", icon: Home, label: "Inicio" },
            { id: "metrics", icon: Activity, label: "Métricas" },
            { id: "fatigue", icon: SlidersHorizontal, label: "Fatiga" },
            { id: "sami", icon: MessageCircle, label: "Sami" },
            { id: "profile", icon: UserCircle, label: "Perfil" },
          ] as const
        ).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-1 transition ${
              tab === id ? "text-emerald-400" : "text-white/30"
            }`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ─────────────── Login ─────────────── */

function LoginScreen({
  login,
  loading,
  error,
  onRegister,
  onDemo,
}: {
  login: (e: string, p: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  onRegister: () => void;
  onDemo?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-sky-500/30 blur-xl animate-pulse" />
            <div className="relative h-16 w-16 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-400/40">
              <Bluetooth className="text-sky-300 animate-pulse" size={32} />
            </div>
          </div>
          <p className="mt-5 text-white text-xl font-semibold tracking-tight">Sami Watch</p>
          <p className="text-white/40 text-sm">Acceso médico seguro</p>
        </div>

        <div className="bg-neutral-900 rounded-3xl p-8 flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo institucional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 rounded-xl bg-neutral-800 border border-white/10 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 transition"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) void login(email, password);
            }}
            className="w-full h-12 rounded-xl bg-neutral-800 border border-white/10 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 transition"
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={() => void login(email, password)}
            disabled={loading}
            className="w-full h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition text-black font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="h-4 w-4 rounded-full border-2 border-black/40 border-t-black animate-spin" />
            )}
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </div>

        <button
          onClick={onRegister}
          className="mt-5 w-full text-center text-white/40 text-sm hover:text-white/70 transition"
        >
          ¿Sin cuenta? <span className="text-emerald-400 font-medium">Regístrate</span>
        </button>

        {onDemo && (
          <button
            onClick={onDemo}
            className="mt-3 w-full text-center text-white/20 text-xs hover:text-white/40 transition"
          >
            Ver demo sin cuenta
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Register ─────────────── */

function RegisterScreen({
  register,
  loading,
  error,
  onLogin,
}: {
  register: (e: string, p: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  onLogin: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRegister = () => {
    if (password !== confirm) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setLocalError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLocalError(null);
    void register(email, password);
  };

  const displayError = localError ?? error;

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-sky-500/30 blur-xl animate-pulse" />
            <div className="relative h-16 w-16 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-400/40">
              <Bluetooth className="text-sky-300 animate-pulse" size={32} />
            </div>
          </div>
          <p className="mt-5 text-white text-xl font-semibold tracking-tight">Crear cuenta</p>
          <p className="text-white/40 text-sm">Registro de médico</p>
        </div>

        <div className="bg-neutral-900 rounded-3xl p-8 flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo institucional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 rounded-xl bg-neutral-800 border border-white/10 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 transition"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 rounded-xl bg-neutral-800 border border-white/10 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 transition"
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) handleRegister();
            }}
            className="w-full h-12 rounded-xl bg-neutral-800 border border-white/10 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 transition"
          />

          {displayError && <p className="text-red-400 text-sm text-center">{displayError}</p>}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition text-black font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="h-4 w-4 rounded-full border-2 border-black/40 border-t-black animate-spin" />
            )}
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </div>

        <button
          onClick={onLogin}
          className="mt-5 w-full text-center text-white/40 text-sm hover:text-white/70 transition"
        >
          ¿Ya tienes cuenta? <span className="text-emerald-400 font-medium">Iniciar sesión</span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────── Quiz Clínico ─────────────── */

type QuizDimension = "D" | "RP";

const QUIZ_QUESTIONS: {
  id: number;
  dimension: QuizDimension;
  subtitulo: string;
  pregunta: string;
}[] = [
  {
    id: 1,
    dimension: "D",
    subtitulo: "Atención mecánica",
    pregunta:
      "Doctor/a, ¿sintió que la alta demanda de hoy le obligó a atender de manera más mecánica o apresurada de lo habitual?",
  },
  {
    id: 2,
    dimension: "D",
    subtitulo: "Desconexión mental",
    pregunta:
      "Debido a la carga del turno, ¿sintió la necesidad de desconectarse emocionalmente de los casos para poder continuar?",
  },
  {
    id: 3,
    dimension: "D",
    subtitulo: "Fricción externa",
    pregunta:
      "¿Tuvo que enfrentar hoy quejas de pacientes o familiares por limitaciones administrativas que escapan de su control médico?",
  },
  {
    id: 4,
    dimension: "RP",
    subtitulo: "Efectividad",
    pregunta:
      "A pesar del agotamiento, ¿siente que mantuvo total seguridad clínica en sus decisiones durante esta guardia?",
  },
  {
    id: 5,
    dimension: "RP",
    subtitulo: "Propósito",
    pregunta:
      "¿Atendió hoy algún caso o diagnóstico específico que le haya dejado una clara satisfacción profesional?",
  },
];

function QuizScreen({ uid, onDone }: { uid: string; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<
    { questionId: number; dimension: QuizDimension; answer: "SI" | "NO" }[]
  >([]);

  const current = QUIZ_QUESTIONS[index];
  const isLast = index === QUIZ_QUESTIONS.length - 1;

  const respond = (answer: "SI" | "NO") => {
    const next = [...answers, { questionId: current.id, dimension: current.dimension, answer }];
    if (isLast) {
      localStorage.setItem(`sami:quiz:${uid}`, "true");
      localStorage.setItem(`sami:quiz-answers:${uid}`, JSON.stringify(next));
      onDone();
    } else {
      setAnswers(next);
      setIndex(index + 1);
    }
  };

  const isD = current.dimension === "D";

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col p-6">
      <div className="max-w-sm mx-auto w-full flex flex-col flex-1 gap-8 pt-10">
        {/* Progreso */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                isD
                  ? "bg-amber-500/10 text-amber-300 border-amber-400/20"
                  : "bg-emerald-500/10 text-emerald-300 border-emerald-400/20"
              }`}
            >
              {isD ? "Despersonalización" : "Realización Personal"} · {current.subtitulo}
            </span>
            <span className="text-white/30 text-xs font-medium tabular-nums">
              {index + 1} / {QUIZ_QUESTIONS.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isD ? "bg-amber-400" : "bg-emerald-500"}`}
              style={{ width: `${((index + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Pregunta */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-white font-semibold text-xl leading-snug">{current.pregunta}</p>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 pb-4">
          <button
            onClick={() => respond("SI")}
            className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition text-black font-bold text-lg"
          >
            Sí
          </button>
          <button
            onClick={() => respond("NO")}
            className="w-full h-16 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-[0.98] transition text-white/80 font-semibold text-lg"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Onboarding ─────────────── */

const TOTAL_STEPS = 5;

type OnboardingProfile = {
  nombre: string;
  edad: string;
  profesion: string;
  instituto: string;
  genero: string;
  horario: string;
  notificaciones: string;
};

const GENERO_OPTIONS = ["Masculino", "Femenino", "No binario", "Prefiero no decir"];

const HORARIO_OPTIONS = [
  "Turno Mañana (6:00 – 14:00)",
  "Turno Tarde (14:00 – 22:00)",
  "Turno Noche (22:00 – 6:00)",
  "Jornada Regular (8:00 – 17:00)",
  "Turno Rotativo (variable)",
  "Guardias de 12 horas",
  "Guardias de 24 horas o más",
];

const NOTIFICACION_OPTIONS = [
  "Al iniciar mi turno",
  "En mis momentos de descanso",
  "Al finalizar mi turno",
  "Solo cuando mis métricas estén en alerta",
  "Cada 2 horas durante el turno",
];

function OnboardingScreen({ uid, onDone }: { uid: string; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>({
    nombre: "",
    edad: "",
    profesion: "",
    instituto: "",
    genero: "",
    horario: "",
    notificaciones: "",
  });

  const isLast = step === TOTAL_STEPS - 1;

  const set = (key: keyof OnboardingProfile, value: string) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const stepValid =
    step === 0
      ? profile.nombre.trim() !== "" && profile.edad.trim() !== "" && Number(profile.edad) > 0
      : step === 1
        ? profile.profesion.trim() !== "" && profile.instituto.trim() !== ""
        : step === 2
          ? profile.genero !== ""
          : step === 3
            ? profile.horario !== ""
            : profile.notificaciones !== "";

  const advance = () => {
    if (!stepValid) return;
    if (isLast) {
      localStorage.setItem(`sami:onboarded:${uid}`, "true");
      localStorage.setItem(`sami:profile:${uid}`, JSON.stringify(profile));
      onDone();
    } else {
      setStep(step + 1);
    }
  };

  const inputClass =
    "w-full h-12 rounded-xl bg-neutral-800 border border-white/10 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 transition";

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col p-6">
      <div className="max-w-sm mx-auto w-full flex flex-col flex-1 gap-8 pt-12">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-sky-500/20 blur-xl" />
            <div className="relative h-12 w-12 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-400/30">
              <Bluetooth className="text-sky-300" size={24} />
            </div>
          </div>
          <p className="text-white/50 text-xs font-medium tracking-wider uppercase">
            Configuración inicial
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? "bg-emerald-400 w-6"
                  : i < step
                    ? "bg-emerald-400/50 w-2"
                    : "bg-white/20 w-2"
              }`}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-5 flex-1">
          {step === 0 && (
            <>
              <p className="text-white font-semibold text-lg leading-snug">Cuéntanos sobre ti</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-medium uppercase tracking-wider px-1">
                    Nombre y apellido
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. María García"
                    value={profile.nombre}
                    onChange={(e) => set("nombre", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-medium uppercase tracking-wider px-1">
                    Edad
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 32"
                    min={18}
                    max={99}
                    value={profile.edad}
                    onChange={(e) => set("edad", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-white font-semibold text-lg leading-snug">Datos profesionales</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-medium uppercase tracking-wider px-1">
                    Profesión
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Médico residente"
                    value={profile.profesion}
                    onChange={(e) => set("profesion", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-medium uppercase tracking-wider px-1">
                    Nombre del instituto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Hospital Nacional Arzobispo Loayza"
                    value={profile.instituto}
                    onChange={(e) => set("instituto", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-white font-semibold text-lg leading-snug">
                ¿Con qué género te identificas?
              </p>
              <div className="flex flex-col gap-2.5">
                {GENERO_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => set("genero", option)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-medium transition active:scale-[0.98] flex items-center justify-between gap-3 ${
                      profile.genero === option
                        ? "bg-emerald-500/15 border-emerald-400/60 text-emerald-300"
                        : "bg-neutral-800 border-white/10 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <span>{option}</span>
                    {profile.genero === option && (
                      <Check size={16} className="text-emerald-400 shrink-0" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-white font-semibold text-lg leading-snug">
                ¿Cuál es tu horario laboral habitual?
              </p>
              <div className="flex flex-col gap-2.5">
                {HORARIO_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => set("horario", option)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-medium transition active:scale-[0.98] flex items-center justify-between gap-3 ${
                      profile.horario === option
                        ? "bg-emerald-500/15 border-emerald-400/60 text-emerald-300"
                        : "bg-neutral-800 border-white/10 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <span>{option}</span>
                    {profile.horario === option && (
                      <Check size={16} className="text-emerald-400 shrink-0" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <p className="text-white font-semibold text-lg leading-snug">
                ¿En qué momento quieres recibir notificaciones?
              </p>
              <div className="flex flex-col gap-2.5">
                {NOTIFICACION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => set("notificaciones", option)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-medium transition active:scale-[0.98] flex items-center justify-between gap-3 ${
                      profile.notificaciones === option
                        ? "bg-emerald-500/15 border-emerald-400/60 text-emerald-300"
                        : "bg-neutral-800 border-white/10 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <span>{option}</span>
                    {profile.notificaciones === option && (
                      <Check size={16} className="text-emerald-400 shrink-0" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={advance}
          disabled={!stepValid}
          className="w-full h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition text-black font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLast ? "Comenzar" : "Continuar"}
          {!isLast && <ChevronRight size={16} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
}

/* ─────────────── Perfil ─────────────── */

type UserProfile = {
  nombre: string;
  edad: string;
  profesion: string;
  instituto: string;
  genero: string;
};

function ProfileScreen({ uid, onLogout }: { uid: string; onLogout: () => void }) {
  const raw = localStorage.getItem(`sami:profile:${uid}`);
  const profile: UserProfile | null = raw ? (JSON.parse(raw) as UserProfile) : null;

  const initials = profile?.nombre
    ? profile.nombre
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  const rows = profile
    ? [
        {
          icon: <Calendar size={16} className="text-emerald-400" />,
          label: "Edad",
          value: `${profile.edad} años`,
        },
        {
          icon: <Stethoscope size={16} className="text-sky-400" />,
          label: "Profesión",
          value: profile.profesion,
        },
        {
          icon: <Building2 size={16} className="text-violet-400" />,
          label: "Instituto",
          value: profile.instituto,
        },
        {
          icon: <Venus size={16} className="text-pink-400" />,
          label: "Género",
          value: profile.genero,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <p className="text-white font-semibold text-lg tracking-tight">Mi perfil</p>

      {/* Avatar + nombre */}
      <div className="bg-neutral-900 rounded-3xl p-6 flex flex-col items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
          <span className="text-emerald-300 text-2xl font-bold tracking-tight">{initials}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-white font-semibold text-xl tracking-tight">
            {profile?.nombre ?? "Sin nombre"}
          </p>
          <p className="text-white/40 text-sm">{profile?.profesion ?? "—"}</p>
        </div>
      </div>

      {/* Datos */}
      {profile ? (
        <div className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between bg-neutral-900 rounded-2xl px-5 py-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                  {row.icon}
                </div>
                <span className="text-white/50 text-sm">{row.label}</span>
              </div>
              <span className="text-white text-sm font-medium text-right max-w-[55%] leading-snug">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/30 text-sm text-center">No hay datos de perfil guardados.</p>
      )}

      {/* Cerrar sesión */}
      <button
        onClick={onLogout}
        className="w-full h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 active:scale-[0.98] transition text-white/60 text-sm font-medium flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </div>
  );
}

/* ─────────────── Dashboard ─────────────── */

function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const [synced, setSynced] = useState<"idle" | "sent" | "queued">("idle");
  const [pending, setPending] = useState(0);

  const resilience = 78;
  const streak = 5;
  const radius = 90;
  const stroke = 12;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (resilience / 100) * circ;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await sendMetricsData({ hrv: 65, heartRate: 72, sleepHours: 4.5 });
      if (cancelled) return;
      setSynced(r.sent ? "sent" : "queued");
      setPending(getPendingCount());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-lg tracking-tight">Hola, Dr. Diego</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                synced === "sent" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="text-[11px] text-white/40 font-medium">
              {synced === "sent"
                ? "Azure sync ✓"
                : synced === "queued"
                  ? `offline (${pending})`
                  : "Sincronizando…"}
            </span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-white/30 hover:text-white/60 transition"
          aria-label="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="bg-neutral-900 rounded-3xl p-6 flex flex-col items-center gap-4">
        <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">
          Score de Resiliencia
        </p>
        <div className="relative">
          <svg width="210" height="210" className="-rotate-90">
            <defs>
              <linearGradient id="mring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <circle
              cx="105"
              cy="105"
              r={radius}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              cx="105"
              cy="105"
              r={radius}
              stroke="url(#mring)"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ filter: "drop-shadow(0 0 8px rgba(52,211,153,0.6))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white text-5xl font-semibold tabular-nums">{resilience}</span>
            <span className="text-white/40 text-sm font-medium">/ 100</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-neutral-800 rounded-full px-4 py-2">
          <Zap className="text-emerald-400" size={16} />
          <span className="text-white text-sm font-medium">Racha de autocuidado</span>
          <span className="text-emerald-400 font-semibold text-sm">{streak} días</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: <Waves size={18} className="text-emerald-400" />,
            label: "HRV",
            value: "65 ms",
            color: "text-emerald-400",
          },
          {
            icon: <Heart size={18} className="text-white" />,
            label: "Pulso",
            value: "72 lpm",
            color: "text-white",
          },
          {
            icon: <Moon size={18} className="text-orange-400" />,
            label: "Sueño",
            value: "4.5 h",
            color: "text-orange-400",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-neutral-900 rounded-2xl px-3 py-4 flex flex-col items-center gap-2"
          >
            {m.icon}
            <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider">
              {m.label}
            </span>
            <span className={`text-base font-semibold tabular-nums ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Métricas ─────────────── */

const SENSOR_CONFIDENCE = 62;

function MetricasScreen() {
  const [synced, setSynced] = useState<"idle" | "sent" | "queued">("idle");
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await sendMetricsData({
        hrv: 65,
        heartRate: 72,
        sleepHours: 4.5,
        usagePercent: 85,
      });
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
      color: "text-emerald-400",
    },
    {
      icon: <Heart size={18} className="text-white" />,
      label: "Pulso en reposo",
      value: "72 lpm",
      color: "text-white",
    },
    {
      icon: <Moon size={18} className="text-orange-400" />,
      label: "Sueño hoy",
      value: "4.5 h",
      color: "text-orange-400",
    },
    {
      icon: <Flame size={18} className="text-amber-400" />,
      label: "Wear Time",
      value: "85%",
      color: "text-amber-300",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-lg tracking-tight">Biometría</p>
        <span className="text-[11px] text-white/40 font-medium">
          {synced === "sent" ? "sync ✓" : synced === "queued" ? `offline (${pending})` : "…"}
        </span>
      </div>

      <div className="bg-neutral-900 rounded-3xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
              <ShieldAlert
                size={17}
                className={SENSOR_CONFIDENCE < 70 ? "text-amber-400" : "text-emerald-400"}
              />
            </div>
            <span className="text-white text-sm font-medium">Calidad de señal</span>
          </div>
          <span
            className={`text-base font-semibold tabular-nums ${
              SENSOR_CONFIDENCE < 70 ? "text-amber-300" : "text-emerald-400"
            }`}
          >
            {SENSOR_CONFIDENCE}%
          </span>
        </div>

        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              SENSOR_CONFIDENCE < 70 ? "bg-amber-400" : "bg-emerald-500"
            }`}
            style={{ width: `${SENSOR_CONFIDENCE}%` }}
          />
        </div>

        {SENSOR_CONFIDENCE < 70 && (
          <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-4 py-2.5">
            <Zap className="text-amber-400 shrink-0" size={16} />
            <p className="text-amber-300 text-xs font-medium leading-snug">
              Vibración enviada al reloj: Reajustar correa
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-center justify-between bg-neutral-900 rounded-3xl px-5 py-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                {it.icon}
              </div>
              <span className="text-white text-sm font-medium">{it.label}</span>
            </div>
            <span className={`text-base font-semibold tabular-nums ${it.color}`}>{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Fatiga ─────────────── */

function FatigaScreen() {
  const [value, setValue] = useState(45);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "queued">("idle");

  const color =
    value > 66 ? "text-red-400" : value > 33 ? "text-amber-300" : "text-emerald-400";
  const trackColor =
    value > 66 ? "bg-red-500" : value > 33 ? "bg-amber-400" : "bg-emerald-500";
  const label = value > 66 ? "Alta" : value > 33 ? "Moderada" : "Baja";

  const save = async () => {
    setStatus("sending");
    const r = await sendFatigaData(value, {
      hrv: 65,
      heartRate: 72,
      sleepHours: 4.5,
      usagePercent: 85,
    });
    setStatus(r.sent ? "ok" : "queued");
    setTimeout(() => setStatus("idle"), 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-white font-semibold text-lg tracking-tight">Fatiga percibida</p>

      <div className="bg-neutral-900 rounded-3xl p-7 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className={`text-7xl font-semibold tabular-nums ${color}`}>{value}</span>
          <span className={`text-sm font-medium ${color}`}>{label}</span>
        </div>

        <div className="w-full flex flex-col gap-3">
          <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full rounded-full ${trackColor} transition-all`}
              style={{ width: `${value}%`, opacity: 0.85 }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-white/30 font-medium">
            <span>Sin fatiga</span>
            <span>Agotamiento</span>
          </div>
        </div>

        <button
          onClick={() => void save()}
          disabled={status === "sending"}
          className="h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition flex items-center justify-center shadow-lg shadow-emerald-500/30 disabled:opacity-60"
          aria-label="Guardar"
        >
          {status === "sending" ? (
            <span className="h-5 w-5 rounded-full border-2 border-black/40 border-t-black animate-spin" />
          ) : (
            <Check className="text-black" size={24} strokeWidth={3} />
          )}
        </button>

        {(status === "ok" || status === "queued") && (
          <p
            className={`text-sm font-medium ${
              status === "ok" ? "text-emerald-400" : "text-amber-300"
            }`}
          >
            {status === "ok" ? "Guardado en Azure ✓" : "Sin conexión — en cola"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Sami ─────────────── */

type SamiState = "active" | "accepted" | "ignored";

function SamiScreen() {
  const [state, setState] = useState<SamiState>("active");
  const [sending, setSending] = useState(false);

  const respond = async (accepted: boolean) => {
    setSending(true);
    await sendFatigaData(72, {
      hrv: 32,
      heartRate: 78,
      sleepHours: 310 / 60,
      usagePercent: 88,
    });
    setSending(false);
    setState(accepted ? "accepted" : "ignored");
  };

  if (state === "accepted") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
          <Check className="text-emerald-400" size={32} />
        </div>
        <p className="text-white font-semibold text-xl">Pausa iniciada</p>
        <p className="text-white/50 text-sm leading-relaxed px-4">
          Sami ha registrado tu respuesta. Tómate 2 minutos de respiración box-breathing.
        </p>
        <button
          onClick={() => setState("active")}
          className="h-11 px-6 rounded-full bg-neutral-800 hover:bg-neutral-700 transition text-white/70 text-sm font-medium"
        >
          Volver
        </button>
      </div>
    );
  }

  if (state === "ignored") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
        <p className="text-white/40 text-sm leading-relaxed px-4">
          Entendido. Sami seguirá monitoreando tu biometría.
        </p>
        <button
          onClick={() => setState("active")}
          className="h-11 px-6 rounded-full bg-neutral-800 hover:bg-neutral-700 transition text-white/70 text-sm font-medium"
        >
          Ver alerta
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="relative bg-neutral-900 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 rounded-3xl ring-2 ring-sky-400/40 pointer-events-none" />

        <div className="p-7 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-sky-400/30 blur-md" />
              <div className="relative h-11 w-11 rounded-full bg-sky-500/20 border border-sky-300/40 flex items-center justify-center">
                <Sparkles className="text-sky-300 animate-pulse" size={22} />
              </div>
            </div>
            <div>
              <p className="text-white font-semibold tracking-tight">Sami te habla</p>
              <p className="text-sky-300/70 text-xs font-medium">Alerta predictiva · ahora</p>
            </div>
          </div>

          <div className="bg-sky-500/5 border border-sky-400/20 rounded-2xl p-4">
            <p className="text-white/80 text-sm leading-relaxed">
              Tu HRV bajó a{" "}
              <span className="text-red-400 font-semibold">32 ms</span> y dormiste menos de 5.4 h.
              La carga acumulada es alta. ¿Hacemos una pausa de 2 min con box-breathing?
            </p>
          </div>

          <div className="flex gap-2">
            {[
              { label: "HRV", value: "32 ms", color: "text-red-400" },
              { label: "Sueño", value: "5.2 h", color: "text-orange-400" },
              { label: "Pulso", value: "78 lpm", color: "text-white" },
            ].map((m) => (
              <div
                key={m.label}
                className="flex-1 bg-neutral-800 rounded-2xl p-3 flex flex-col items-center gap-1"
              >
                <span className="text-white/40 text-[10px] uppercase tracking-wider">
                  {m.label}
                </span>
                <span className={`text-sm font-semibold tabular-nums ${m.color}`}>{m.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => void respond(true)}
              disabled={sending}
              className="w-full h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition text-black font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {sending && (
                <span className="h-4 w-4 rounded-full border-2 border-black/40 border-t-black animate-spin" />
              )}
              Aceptar pausa
            </button>
            <button
              onClick={() => void respond(false)}
              disabled={sending}
              className="w-full h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 active:scale-[0.98] transition text-white/70 text-sm font-medium disabled:opacity-60"
            >
              Ignorar por ahora
            </button>
          </div>
        </div>
      </div>

      <p className="text-white/30 text-xs text-center leading-relaxed px-4">
        Sami nunca emite juicios clínicos. En caso de crisis, activa el protocolo de soporte
        del centro de salud.
      </p>
    </div>
  );
}
