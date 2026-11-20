import { getUser, isAdmin, getUserDisplayName } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * Layout area admin — sidebar desktop, tab mobile.
 * Guard double-check di Server Component (middleware sudah guard duluan).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user || !isAdmin(user)) {
    redirect("/forbidden");
  }

  const displayName = getUserDisplayName(user);

  const navItems = [
    {
      href: "/admin/pesanan",
      label: "Daftar Pesanan",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      href: "/admin/film",
      label: "Kelola Film",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
      ),
    },
    {
      href: "/admin/jadwal",
      label: "Kelola Jadwal",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "calc(100dvh - 60px)" }}>
      {/* Sidebar desktop */}
      <aside
        style={{
          width: "240px",
          backgroundColor: "var(--color-bg-sidebar)",
          borderRight: "1px solid var(--color-border-default)",
          flexShrink: 0,
          display: "none", // hidden mobile, tampil desktop via CSS
          flexDirection: "column",
          padding: "var(--space-6) var(--space-4)",
          gap: "var(--space-2)",
        }}
        className="admin-sidebar"
      >
        <div
          style={{
            marginBottom: "var(--space-4)",
            paddingBottom: "var(--space-4)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-caption)", margin: 0 }}>
            Admin
          </p>
          <p style={{ color: "var(--color-text-primary)", fontSize: "var(--text-body-sm)", fontWeight: 600, margin: 0 }}>
            {displayName}
          </p>
        </div>

        {navItems.map((item) => (
          <SidebarLink key={item.href} href={item.href} icon={item.icon}>
            {item.label}
          </SidebarLink>
        ))}
      </aside>

      {/* Konten utama */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Tab mobile */}
        <nav
          className="admin-tabs"
          style={{
            display: "flex",
            gap: 0,
            overflowX: "auto",
            borderBottom: "1px solid var(--color-border-default)",
            backgroundColor: "var(--color-bg-sidebar)",
            scrollbarWidth: "none",
          }}
          aria-label="Menu admin"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "0 var(--space-4)",
                height: "48px",
                fontSize: "var(--text-caption)",
                fontWeight: 500,
                color: "var(--color-text-muted)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                borderBottom: "2px solid transparent",
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: "var(--space-6) var(--gutter-mobile)" }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .admin-sidebar { display: flex !important; }
          .admin-tabs { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "0 var(--space-3)",
        height: "var(--touch-min)",
        borderRadius: "var(--radius-control)",
        color: "var(--color-text-muted)",
        fontSize: "var(--text-body-sm)",
        textDecoration: "none",
        transition: `background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)`,
      }}
    >
      {icon}
      {children}
    </Link>
  );
}
