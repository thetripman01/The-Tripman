export function Stats() {
  // This used to be "stats" with hardcoded numbers.
  // For launch we keep it truthful and useful: quick facts / why it works.
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Quick Facts
          </h2>
          <p className="text-cyan-100">
            Simple booking. Real vibes. Built for memories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white">
            <div className="text-sm text-cyan-100">Duration</div>
            <div className="text-2xl font-extrabold mt-1">60 minutes</div>
            <div className="text-sm text-cyan-100 mt-2">
              One full hour of Tripman energy.
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white">
            <div className="text-sm text-cyan-100">Group size</div>
            <div className="text-2xl font-extrabold mt-1">1–4 people</div>
            <div className="text-sm text-cyan-100 mt-2">
              Solo, date night, or small crew.
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white">
            <div className="text-sm text-cyan-100">Pickup & drop-off</div>
            <div className="text-2xl font-extrabold mt-1">Same spot</div>
            <div className="text-sm text-cyan-100 mt-2">
              Party without the stress.
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white">
            <div className="text-sm text-cyan-100">Best for</div>
            <div className="text-2xl font-extrabold mt-1">Vibes + clips</div>
            <div className="text-sm text-cyan-100 mt-2">
              Content-ready moments.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
