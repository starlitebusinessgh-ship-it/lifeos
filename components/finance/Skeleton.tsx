export function SkeletonHome() {
  return (
    <div className="rv-skeleton-page" aria-hidden>
      <div className="rv-skeleton rv-skeleton-card rv-skeleton-master" />
      <div className="rv-skeleton rv-skeleton-strip" />
      <div className="rv-skeleton-actions">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rv-skeleton rv-skeleton-action" />
        ))}
      </div>
      <div className="rv-skeleton rv-skeleton-panel" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="rv-skeleton rv-skeleton-row" />
      ))}
    </div>
  );
}

export function SkeletonScreen() {
  return (
    <div className="rv-skeleton-page" aria-hidden>
      <div className="rv-skeleton rv-skeleton-head" />
      <div className="rv-skeleton rv-skeleton-panel" />
      <div className="rv-skeleton rv-skeleton-panel" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rv-skeleton rv-skeleton-row" />
      ))}
    </div>
  );
}
