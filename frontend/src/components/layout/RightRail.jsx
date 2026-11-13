export function RightRail({ children, actions }) {
  const isAuth = typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true";

  return (
    <aside className="sticky top-0 hidden h-screen w-[296px] shrink-0 flex-col border-l border-line lg:flex xl:w-[348px]">
      <div className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-line px-4">
        {actions !== undefined ? actions : !isAuth ? null : null}
      </div>
      <div className="thin-scrollbar flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </aside>
  );
}

export function RailSection({ title, action, children, className }) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-2.5 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
