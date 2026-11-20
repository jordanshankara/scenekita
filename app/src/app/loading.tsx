export default function Loading() {
  return (
    <div
      style={{
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "var(--space-8) var(--gutter-mobile)",
      }}
      aria-busy="true"
      aria-label="Memuat halaman..."
    >
      {/* Skeleton Header */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <div className="skeleton" style={{ width: "160px", height: "32px", marginBottom: "var(--space-2)" }} />
        <div className="skeleton" style={{ width: "240px", height: "18px" }} />
      </div>

      {/* Skeleton Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "var(--space-6)",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-card)",
              overflow: "hidden",
              padding: "var(--space-4)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div
              className="skeleton"
              style={{
                width: "100%",
                aspectRatio: "2 / 3",
                borderRadius: "var(--radius-poster)",
              }}
            />
            <div className="skeleton" style={{ width: "70%", height: "20px" }} />
            <div className="skeleton" style={{ width: "90%", height: "16px" }} />
            <div className="skeleton" style={{ width: "100%", height: "44px", marginTop: "auto" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
