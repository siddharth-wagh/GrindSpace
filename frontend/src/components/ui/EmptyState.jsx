function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      {Icon ? (
        <Icon className="w-8 h-8 mb-3 text-[var(--text-muted)]" />
      ) : null}
      <div className="text-sm font-medium text-[var(--text-primary)]">
        {title}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-[var(--text-muted)]">{hint}</div>
      ) : null}
    </div>
  );
}

export default EmptyState;
