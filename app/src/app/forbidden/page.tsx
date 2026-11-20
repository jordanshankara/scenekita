import Link from "next/link";

/**
 * Halaman Forbidden — tampil saat penonton mencoba akses rute admin.
 * Ini lapisan UX saja; pengecekan sesungguhnya ada di database dan middleware.
 */
export default function ForbiddenPage() {
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
        {/* Ikon */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-status-error)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>

        <h1
          style={{
            fontSize: "var(--text-h2-mobile)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          Akses Ditolak
        </h1>

        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--text-body-sm)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Halaman ini hanya bisa diakses oleh admin bioskop.
          Jika kamu admin, pastikan sudah masuk dengan akun yang benar.
        </p>

        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            justifyContent: "center",
            width: "100%",
            marginTop: "var(--space-2)",
          }}
        >
          <Link
            href="/"
            style={{
              flex: 1,
              minWidth: "120px",
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
            }}
          >
            Ke Beranda
          </Link>
          <Link
            href="/login"
            style={{
              flex: 1,
              minWidth: "120px",
              height: "var(--touch-min)",
              backgroundColor: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border-secondary)",
              color: "var(--color-text-primary)",
              borderRadius: "var(--radius-control)",
              fontSize: "var(--text-caption)",
              fontWeight: 500,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Masuk dengan Akun Lain
          </Link>
        </div>
      </div>
    </div>
  );
}
