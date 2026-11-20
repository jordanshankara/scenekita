"use client";

import { useEffect } from "react";
import { StateMessage } from "@/components/StateMessage";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Terjadi error pada aplikasi:", error);
  }, [error]);

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
      <StateMessage
        type="error"
        title="Terjadi Gangguan Sistem"
        description="Mohon maaf, halaman tidak dapat dimuat saat ini karena terjadi kendala pada sistem. Silakan coba kembali."
        action={{
          label: "Coba Lagi",
          onClick: reset,
          variant: "primary",
        }}
        secondaryAction={{
          label: "Kembali ke Beranda",
          href: "/",
          variant: "secondary",
        }}
      />
    </div>
  );
}
