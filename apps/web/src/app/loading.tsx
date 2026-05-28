export default function Loading() {
  return (
    <div className="container-mvh py-24 text-center">
      <div className="inline-flex items-center gap-3 text-primary/60">
        <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
        <span className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:200ms]" />
        <span className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:400ms]" />
        <span className="ml-2 font-serif italic">Cargando…</span>
      </div>
    </div>
  );
}
