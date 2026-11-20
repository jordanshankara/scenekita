import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "calc(100dvh - 60px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6) var(--gutter-mobile)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-card)",
          padding: "var(--space-8)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-4)",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>

        <h1
          style={{
            fontSize: "var(--text-h2-mobile)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          Halaman Tidak Ditemukan
        </h1>

        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--text-body-sm)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>

        <Link
          href="/"
          style={{
            height: "var(--touch-min)",
            backgroundColor: "var(--color-primary)",
            color: "var(--color-text-primary)",
            borderRadius: "var(--radius-control)",
            fontSize: "var(--text-caption)",
            fontWeight: 600,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 var(--space-6)",
            marginTop: "var(--space-2)",
          }}
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
