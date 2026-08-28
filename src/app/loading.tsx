export default function GlobalLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Cargando plataforma...
        </p>
      </div>
    </div>
  );
}
