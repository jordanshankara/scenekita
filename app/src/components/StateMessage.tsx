import React from "react";
import Link from "next/link";

export type StateType = "empty" | "error" | "forbidden" | "not-found";

interface ActionBtn {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

interface StateMessageProps {
  type?: StateType;
  title: string;
  description: string;
  action?: ActionBtn;
  secondaryAction?: ActionBtn;
  icon?: React.ReactNode;
}

export function StateMessage({
  type = "empty",
  title,
  description,
  action,
  secondaryAction,
  icon,
}: StateMessageProps) {
  const defaultIcons: Record<StateType, React.ReactNode> = {
    empty: (
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
    error: (
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
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    forbidden: (
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
    ),
    "not-found": (
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
    ),
  };

  const renderButton = (btn: ActionBtn, key: string) => {
    const isPrimary = btn.variant !== "secondary";
    const btnStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: "var(--touch-min)",
      minWidth: "120px",
      padding: "0 var(--space-6)",
      borderRadius: "var(--radius-control)",
      fontSize: "var(--text-caption)",
      fontWeight: 600,
      textDecoration: "none",
      cursor: "pointer",
      border: isPrimary ? "none" : "1px solid var(--color-border-secondary)",
      backgroundColor: isPrimary ? "var(--color-primary)" : "var(--color-surface-elevated)",
      color: "var(--color-text-primary)",
      transition: "background-color var(--duration-fast) var(--ease-standard)",
    };

    if (btn.href) {
      return (
        <Link key={key} href={btn.href} style={btnStyle}>
          {btn.label}
        </Link>
      );
    }

    return (
      <button key={key} type="button" onClick={btn.onClick} style={btnStyle}>
        {btn.label}
      </button>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        maxWidth: "480px",
        margin: "0 auto",
        padding: "var(--space-8) var(--space-4)",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ marginBottom: "var(--space-2)" }}>
        {icon || defaultIcons[type]}
      </div>

      <h2
        style={{
          fontSize: "var(--text-h2-mobile)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          fontSize: "var(--text-body-sm)",
          color: "var(--color-text-muted)",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>

      {(action || secondaryAction) && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "var(--space-3)",
          }}
        >
          {action && renderButton(action, "action-primary")}
          {secondaryAction && renderButton(secondaryAction, "action-secondary")}
        </div>
      )}
    </div>
  );
}
