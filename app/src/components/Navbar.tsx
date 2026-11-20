"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UserInfo {
  user: { id: string; email?: string } | null;
  isAdmin: boolean;
  displayName: string;
}

/**
 * Navbar — sticky top, dark, blur.
 * Fetch user dari /api/me (tidak memblok prerendering).
 * Semua teks: Bahasa Indonesia.
 */
export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [info, setInfo] = useState<UserInfo>({
    user: null,
    isAdmin: false,
    displayName: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data: UserInfo) => {
        setInfo(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]); // refresh saat navigasi

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setInfo({ user: null, isAdmin: false, displayName: "" });
    router.push("/");
    router.refresh();
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "color-mix(in srgb, var(--color-bg-page) 85%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-border-default)",
      }}
    >
      <nav
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "0 var(--gutter-mobile)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "60px",
          gap: "var(--space-4)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: "var(--text-h3)",
            color: "var(--color-text-primary)",
            textDecoration: "none",
            letterSpacing: "-0.02em",
            flexShrink: 0,
          }}
        >
          SceneKita
        </Link>

        {/* Navigasi kanan */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            minHeight: "var(--touch-min)",
          }}
        >
          {loading ? (
            // Skeleton saat loading
            <div
              style={{
                width: "80px",
                height: "32px",
                borderRadius: "var(--radius-control)",
                backgroundColor: "var(--color-surface-elevated)",
                opacity: 0.5,
              }}
            />
          ) : info.user ? (
            <>
              {!info.isAdmin && (
                <NavLink href="/pesanan-saya" active={pathname === "/pesanan-saya"}>
                  Pesanan Saya
                </NavLink>
              )}
              {info.isAdmin && (
                <NavLink href="/admin" active={pathname.startsWith("/admin")}>
                  Panel Admin
                </NavLink>
              )}
              <button
                onClick={handleLogout}
                title={`Keluar (${info.displayName})`}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-border-secondary)",
                  borderRadius: "var(--radius-control)",
                  color: "var(--color-text-muted)",
                  fontSize: "var(--text-caption)",
                  padding: "0 var(--space-3)",
                  height: "var(--touch-min)",
                  minWidth: "var(--touch-min)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  transition: `color var(--duration-fast), border-color var(--duration-fast)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-text-primary)";
                  e.currentTarget.style.borderColor = "var(--color-border-strong)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-muted)";
                  e.currentTarget.style.borderColor = "var(--color-border-secondary)";
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Keluar
              </button>
            </>
          ) : (
            <Link
              href="/login"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-primary)",
                borderRadius: "var(--radius-control)",
                fontSize: "var(--text-caption)",
                fontWeight: 600,
                padding: "0 var(--space-4)",
                height: "var(--touch-min)",
                minWidth: "var(--touch-min)",
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                transition: `background-color var(--duration-fast)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-primary-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-primary)";
              }}
            >
              Masuk
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        color: active ? "var(--color-primary-light)" : "var(--color-text-muted)",
        fontSize: "var(--text-caption)",
        fontWeight: active ? 600 : 400,
        textDecoration: "none",
        padding: "0 var(--space-3)",
        height: "var(--touch-min)",
        minWidth: "var(--touch-min)",
        display: "flex",
        alignItems: "center",
        borderRadius: "var(--radius-control)",
        transition: `color var(--duration-fast)`,
        borderBottom: active
          ? "2px solid var(--color-primary-light)"
          : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!active)
          e.currentTarget.style.color = "var(--color-text-primary)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          e.currentTarget.style.color = "var(--color-text-muted)";
      }}
    >
      {children}
    </Link>
  );
}
