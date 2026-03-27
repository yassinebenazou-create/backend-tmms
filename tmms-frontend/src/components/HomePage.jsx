function HomePage() {
  const companyPhotos = [
    {
      id: 1,
      title: 'Notre equipe',
      url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 2,
      title: 'Innovation industrielle',
      url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 3,
      title: 'Excellence operationnelle',
      url: 'https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 4,
      title: 'Collaboration et performance',
      url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  return (
    <section className="space-y-6">
      <div className="glass-card overflow-hidden rounded-2xl border border-white/10">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80"
            alt="TMMS company cover"
            className="h-56 w-full object-cover md:h-72"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Bienvenue chez TMMS Group</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
              Nous construisons des solutions modernes pour la gestion des machines, des taches et des fichiers,
              avec une vision orientee performance, securite et innovation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Notre mission</p>
          <p className="mt-2 text-sm text-slate-200">Digitaliser les operations et accelerer la prise de decision.</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Notre vision</p>
          <p className="mt-2 text-sm text-slate-200">Un environnement industriel intelligent, connecte et agile.</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Nos valeurs</p>
          <p className="mt-2 text-sm text-slate-200">Qualite, transparence, collaboration, excellence continue.</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Nos services</p>
          <p className="mt-2 text-sm text-slate-200">Analytics, gestion documentaire, gouvernance des acces, reporting.</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-100">Galerie entreprise</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {companyPhotos.map((photo) => (
            <article key={photo.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img
                src={photo.url}
                alt={photo.title}
                className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="p-3">
                <p className="text-sm font-medium text-slate-100">{photo.title}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomePage;
