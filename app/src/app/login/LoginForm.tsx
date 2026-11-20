"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "masuk" | "daftar";

/**
 * Formulir login/daftar.
 * Dipisah dari page.tsx agar useSearchParams bisa dibungkus Suspense.
 */
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [tab, setTab] = useState<Tab>("masuk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();

  async function handleMasuk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(petakanError(error.message));
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleDaftar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nama: nama.trim() },
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      setError(petakanError(error.message));
      setLoading(false);
      return;
    }

    // Jika Supabase tidak mewajibkan konfirmasi email, sesi langsung aktif
    if (data.session) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    // Jika Supabase masih mewajibkan konfirmasi email
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(petakanError(loginError.message));
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  function petakanError(msg: string): string {
    if (msg.includes("Invalid login credentials"))
      return "Email atau kata sandi salah. Periksa kembali.";
    if (msg.includes("already registered") || msg.includes("already been registered"))
      return "Email sudah terdaftar. Silakan masuk.";
    if (msg.includes("Email not confirmed"))
      return "Email belum diverifikasi. Harap matikan opsi 'Confirm email' di dashboard Supabase (Authentication > Providers > Email) agar akun langsung aktif.";
    if (msg.includes("Password should be at least"))
      return "Kata sandi minimal 6 karakter.";
    if (msg.includes("Invalid email"))
      return "Format email tidak valid.";
    return "Terjadi kesalahan. Coba lagi.";
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "44px",
    backgroundColor: "var(--color-bg-input)",
    border: "1px solid var(--color-border-default)",
    borderRadius: "var(--radius-control)",
    color: "var(--color-text-primary)",
    fontSize: "var(--text-body)",
    padding: "0 var(--space-4)",
    outline: "none",
    transition: `border-color var(--duration-fast) var(--ease-standard)`,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--text-caption)",
    color: "var(--color-text-muted)",
    marginBottom: "var(--space-2)",
    fontWeight: 500,
  };

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = "var(--color-primary-light)";
    e.target.style.outline = "2px solid var(--color-primary-light)";
    e.target.style.outlineOffset = "2px";
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = "var(--color-border-default)";
    e.target.style.outline = "none";
  }

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
          maxWidth: "440px",
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-card)",
          padding: "var(--space-8)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--text-h2-mobile)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "var(--space-6)",
            textAlign: "center",
          }}
        >
          SceneKita
        </h1>

        {/* Tab switch */}
        <div
          role="tablist"
          style={{
            display: "flex",
            backgroundColor: "var(--color-bg-page)",
            borderRadius: "var(--radius-control)",
            padding: "4px",
            marginBottom: "var(--space-6)",
            gap: "4px",
          }}
        >
          {(["masuk", "daftar"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => { setTab(t); setError(null); }}
              style={{
                flex: 1,
                height: "var(--touch-min)",
                borderRadius: "8px",
                border: "none",
                fontSize: "var(--text-caption)",
                fontWeight: 600,
                cursor: "pointer",
                transition: `background-color var(--duration-fast), color var(--duration-fast)`,
                backgroundColor: tab === t ? "var(--color-surface-elevated)" : "transparent",
                color: tab === t ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}
            >
              {t === "masuk" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        <form
          onSubmit={tab === "masuk" ? handleMasuk : handleDaftar}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
        >
          {tab === "daftar" && (
            <div>
              <label htmlFor="nama" style={labelStyle}>Nama Lengkap</label>
              <input
                id="nama"
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama kamu"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" style={labelStyle}>Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" style={labelStyle}>Kata Sandi</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                style={{ ...inputStyle, paddingRight: "var(--space-12)" }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoComplete={tab === "masuk" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                style={{
                  position: "absolute",
                  right: "var(--space-3)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  padding: "var(--space-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "44px",
                  minHeight: "44px",
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: "rgba(240, 82, 82, 0.1)",
                border: "1px solid var(--color-status-error)",
                borderRadius: "var(--radius-control)",
                padding: "var(--space-3) var(--space-4)",
                color: "var(--color-status-error)",
                fontSize: "var(--text-caption)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "var(--touch-min)",
              backgroundColor: loading ? "var(--color-surface-elevated)" : "var(--color-primary)",
              color: "var(--color-text-primary)",
              border: "none",
              borderRadius: "var(--radius-control)",
              fontSize: "var(--text-body)",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: `background-color var(--duration-fast), opacity var(--duration-fast)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-2)",
            }}
          >
            {loading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" style={{ animation: "spin 0.8s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Memproses...
              </>
            ) : tab === "masuk" ? "Masuk" : "Buat Akun"}
          </button>
        </form>

        <p
          style={{
            marginTop: "var(--space-4)",
            textAlign: "center",
            fontSize: "var(--text-caption)",
            color: "var(--color-text-muted)",
          }}
        >
          {tab === "masuk"
            ? "Belum punya akun? Klik tab Daftar di atas."
            : "Sudah punya akun? Klik tab Masuk di atas."}
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
