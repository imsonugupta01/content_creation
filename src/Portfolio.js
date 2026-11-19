export default function Portfolio() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl md:text-6xl font-bold text-center">
        Welcome to My Portfolio 🚀
      </h1>

      <p className="mt-4 text-slate-400 text-center">
        Software Developer | Full Stack Developer
      </p>

      <a
        href="/"
        className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 transition"
      >
        Replay Build Animation
      </a>
    </main>
  );
}