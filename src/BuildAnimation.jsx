import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const BOOT_LOGS = [
  { text: "initializing runtime...", delay: 0 },
  { text: "loading dependencies...", delay: 400 },
  { text: "compiling portfolio.jsx...", delay: 800 },
  { text: "optimizing assets...", delay: 1200 },
  { text: "ready.", delay: 1600 },
];

export default function BuildAnimation() {
  const navigate = useNavigate();

  // Phase: "boot" → "transition" → "hero"
  const [phase, setPhase] = useState("boot");
  const [bootStep, setBootStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const [typedText, setTypedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  const message = "I turn ideas into real-world applications.";
  const email = "saloni.gupta.dev@gmail.com";
  const skills = ["React", "Node.js", "Java", "SQL", "REST APIs"];

  /* ───── PHASE 1 : BOOT SEQUENCE ───── */
  useEffect(() => {
    if (phase !== "boot") return;

    const logTimers = BOOT_LOGS.map((log, i) =>
      setTimeout(() => setBootStep(i + 1), log.delay)
    );

    // Progress bar animation (0 → 100 over 2s)
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, Math.round((elapsed / 2000) * 100));
      setProgress(p);
      if (p >= 100) clearInterval(interval);
    }, 40);

    // After 2.2s → transition → hero
    const endTimer = setTimeout(() => {
      setPhase("transition");
      setTimeout(() => setPhase("hero"), 500);
    }, 2200);

    return () => {
      logTimers.forEach(clearTimeout);
      clearInterval(interval);
      clearTimeout(endTimer);
    };
  }, [phase]);

  /* ───── PHASE 2 : HERO TYPED TEXT ───── */
  useEffect(() => {
    if (phase !== "hero") return;

    let index = 0;
    const timer = setInterval(() => {
      index++;
      setTypedText(message.slice(0, index));
      if (index >= message.length) clearInterval(timer);
    }, 45);

    return () => clearInterval(timer);
  }, [phase]);

  /* ───── PARALLAX MOUSE ───── */
  useEffect(() => {
    const handler = (e) => {
      if (window.matchMedia("(pointer: coarse)").matches) return;
      const rect = heroRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMousePos({
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <main
      ref={heroRef}
      className="relative h-dvh w-full overflow-hidden bg-[#090817] text-white"
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes appear {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: .3; }
          50% { opacity: .65; }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes logLine {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bootFadeOut {
          0% { opacity: 1; transform: scale(1); filter: blur(0); }
          100% { opacity: 0; transform: scale(0.96); filter: blur(8px); }
        }
        @keyframes heroFadeIn {
          0% { opacity: 0; transform: translateY(20px) scale(0.98); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        .float-card { animation: float 5s ease-in-out infinite; }
        .appear { animation: appear .7s ease-out both; }
        .glow { animation: glowPulse 4s ease-in-out infinite; }
        .caret { animation: blink 1s steps(1) infinite; }
        .log-line { animation: logLine .35s ease-out both; }

        .saloni-gradient {
          background: linear-gradient(110deg, #f0abfc, #c4b5fd 45%, #f9a8d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .boot-out { animation: bootFadeOut .5s ease-in forwards; }
        .hero-in { animation: heroFadeIn .6s cubic-bezier(.2,.9,.3,1) both; }

        .scanline::after {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(240,171,252,0.10), transparent);
          height: 120px;
          animation: scanLine 3s linear infinite;
          pointer-events: none;
          z-index: 5;
        }

        @media (prefers-reduced-motion: reduce) {
          .float-card, .appear, .glow, .caret, .log-line,
          .boot-out, .hero-in, .scanline::after {
            animation: none;
          }
        }
      `}</style>

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(196,181,253,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(196,181,253,.2) 1px, transparent 1px)",
            backgroundSize: "45px 45px",
            maskImage:
              "radial-gradient(ellipse at center, black, transparent 80%)",
          }}
        />
        <div
          className="glow absolute -left-16 top-[8%] h-56 w-56 rounded-full bg-violet-500/25 blur-[90px] sm:h-72 sm:w-72"
          style={{ transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)` }}
        />
        <div
          className="glow absolute -right-16 bottom-[5%] h-64 w-64 rounded-full bg-pink-500/20 blur-[100px] sm:h-80 sm:w-80"
          style={{ transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)` }}
        />
        <div className="absolute left-1/2 top-1/2 hidden h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.07] sm:block lg:h-[450px] lg:w-[450px]" />
      </div>

      {/* ═══════════════════ PHASE 1 : BOOT TERMINAL ═══════════════════ */}
      {(phase === "boot" || phase === "transition") && (
        <div
          className={`absolute inset-0 z-20 flex items-center justify-center px-5 ${
            phase === "transition" ? "boot-out" : ""
          }`}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-violet-300/20 bg-[#0d0a1e]/95 shadow-[0_0_80px_-20px_#c4b5fd80] backdrop-blur-xl">
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-violet-300/15 bg-black/40 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              <span className="ml-2 font-mono text-[10px] tracking-widest text-violet-200/60">
                ~/saloni · boot.sh
              </span>
              <span className="ml-auto flex items-center gap-1 font-mono text-[9px] text-pink-300/70">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-300" />
                LIVE
              </span>
            </div>

            {/* Logs */}
            <div className="px-5 py-5 font-mono text-xs sm:text-sm">
              <p className="mb-3 text-violet-300/70">
                <span className="text-pink-300">$</span> ./boot --portfolio
              </p>

              <div className="space-y-1.5">
                {BOOT_LOGS.slice(0, bootStep).map((log, i) => (
                  <p
                    key={i}
                    className="log-line flex items-center gap-2 text-violet-100/80"
                  >
                    <span className="text-emerald-300">✓</span>
                    <span>{log.text}</span>
                  </p>
                ))}

                {bootStep < BOOT_LOGS.length && (
                  <p className="flex items-center gap-2 text-violet-200/50">
                    <span className="inline-block h-3 w-1.5 animate-pulse bg-pink-300" />
                    <span className="text-[11px]">processing…</span>
                  </p>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-[9px] uppercase tracking-[0.25em] text-violet-200/50">
                  <span>booting</span>
                  <span className={progress === 100 ? "text-emerald-300" : ""}>
                    {progress}%
                  </span>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-violet-950/60 ring-1 ring-inset ring-violet-300/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-300 via-pink-300 to-fuchsia-300 shadow-[0_0_10px_#f0abfc] transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ PHASE 2 : HERO ═══════════════════ */}
      {phase === "hero" && (
        <>
          {/* Floating code cards */}
          <div className="pointer-events-none absolute left-5 top-[18%] z-0 hidden lg:block">
            <div className="float-card rounded-xl border border-violet-300/15 bg-[#17132b]/70 p-3 font-mono text-[11px] backdrop-blur-xl">
              <p className="text-pink-300">const developer = {"{"}</p>
              <p className="pl-3 text-zinc-300">
                name: <span className="text-violet-300">"Saloni"</span>,
              </p>
              <p className="pl-3 text-zinc-300">
                passion: <span className="text-pink-300">"Coding"</span>
              </p>
              <p className="text-pink-300">{"}"}</p>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-[16%] right-5 z-0 hidden lg:block">
            <div
              className="float-card rounded-xl border border-violet-300/15 bg-[#17132b]/70 p-3 font-mono text-[11px] backdrop-blur-xl"
              style={{ animationDelay: "1s" }}
            >
              <p className="text-zinc-500">// current status</p>
              <p className="mt-2 text-pink-300">✦ Creating something meaningful</p>
              <p className="mt-1 text-violet-200/70">status: available</p>
            </div>
          </div>

          {/* Main content */}
          <section className="hero-in relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col justify-center px-5 sm:px-8 lg:px-10">

            {/* Navbar */}
            <nav className="appear mb-8 flex items-center justify-between gap-3 sm:mb-10">
              <div className="text-base font-bold tracking-tight sm:text-lg">
                Saloni<span className="saloni-gradient">.dev</span>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-[9px] font-medium tracking-wider text-emerald-200 sm:px-4 sm:text-[11px]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                OPEN TO OPPORTUNITIES
              </div>
            </nav>

            {/* Intro */}
            <div className="appear mb-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-violet-200/70 sm:mb-4 sm:text-xs">
              <span className="h-px w-7 bg-pink-300" />
              Hello, World!
            </div>

            {/* Hero */}
            <div className="appear" style={{ animationDelay: "100ms" }}>
              <h1 className="text-[clamp(3.2rem,10vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.065em]">
                I'm <span className="saloni-gradient">Saloni</span>
                <span className="text-pink-300">.</span>
              </h1>

              <h2 className="mt-3 text-[clamp(1.2rem,3.5vw,2.2rem)] font-medium tracking-tight text-zinc-300 sm:mt-4">
                Software Developer
              </h2>

              {/* College */}
              <div className="mt-3 inline-flex items-center gap-2.5 rounded-lg border border-violet-300/20 bg-violet-400/[0.08] px-3 py-2 sm:mt-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-300/15 text-sm text-violet-200">
                  ✦
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-violet-200/60">
                    Studying at
                  </p>
                  <p className="text-sm font-semibold text-violet-100">
                    IIIT Delhi
                  </p>
                </div>
              </div>

              <div className="mt-4 flex min-h-6 items-center font-mono text-xs text-zinc-300 sm:mt-5 sm:text-sm">
                <span className="mr-2 shrink-0 text-pink-300">{"//"}</span>
                <span className="break-words">{typedText}</span>
                <span className="caret ml-1 inline-block h-4 w-1.5 shrink-0 bg-pink-300" />
              </div>
            </div>

            {/* Skills */}
            <div
              className="appear mt-5 flex flex-wrap gap-2 sm:mt-6"
              style={{ animationDelay: "200ms" }}
            >
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-violet-200/10 bg-white/[0.035] px-2.5 py-1.5 text-[10px] text-zinc-300 transition hover:border-pink-300/40 hover:text-pink-200 sm:px-3 sm:py-2 sm:text-xs"
                >
                  <span className="mr-1.5 text-pink-300">◆</span>
                  {skill}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div
              className="appear mt-6 flex flex-wrap items-center gap-3 sm:mt-7 sm:gap-4"
              style={{ animationDelay: "300ms" }}
            >
              <button
                onClick={() => navigate("/portfolio")}
                className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-300 to-pink-300 px-5 py-3 text-sm font-semibold text-[#171025] shadow-lg shadow-violet-400/15 transition hover:-translate-y-0.5 hover:brightness-110 sm:px-6 sm:py-3.5"
              >
                Explore My Work
                <span className="text-lg transition-transform group-hover:translate-x-1">
                  ↗
                </span>
              </button>

              <button
                onClick={copyEmail}
                className="rounded-xl border border-violet-200/15 bg-white/[0.025] px-5 py-3 text-sm text-zinc-200 transition hover:border-pink-300/40 hover:text-pink-200 sm:px-6 sm:py-3.5"
              >
                {copied ? "✓ Email Copied!" : "Let's Talk"}
              </button>
            </div>

            {/* Footer */}
            <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-violet-200/10 pt-4 text-[10px] text-zinc-500 sm:mt-10 sm:pt-5 sm:text-xs">
              <span>© {new Date().getFullYear()} Saloni</span>
              <span className="font-mono tracking-wider">
                DREAM. DESIGN. DEVELOP.
              </span>
            </footer>

          </section>
        </>
      )}
    </main>
  );
}