export default function Portfolio() {
  const highlights = [
    { label: 'Years of experience', value: '4+' },
    { label: 'Projects shipped', value: '18' },
    { label: 'Core focus', value: 'UI + UX' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm uppercase tracking-[0.35em] text-blue-400">Portfolio</p>
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">Saloni Sharma</h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          I design and build polished digital experiences that turn ideas into engaging products.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
              <div className="text-3xl font-semibold text-blue-400">{item.value}</div>
              <div className="mt-2 text-sm text-slate-300">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">What I do</h2>
            <ul className="mt-4 space-y-3 text-slate-300">
              <li>• Front-end development with React and modern UI systems</li>
              <li>• Product design focused on clarity, accessibility, and motion</li>
              <li>• End-to-end feature building from planning to launch</li>
            </ul>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">Featured skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {['React', 'JavaScript', 'CSS', 'UX Design', 'Node.js', 'Figma'].map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-sm text-blue-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
