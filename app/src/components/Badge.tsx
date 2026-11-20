import React from "react";

export type BadgeVariant =
  | "neutral"
  | "warning"
  | "success"
  | "error"
  | "info"
  | "filter-pill";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  selected?: boolean;
  children: React.ReactNode;
}

export function Badge({
  variant = "neutral",
  selected = false,
  children,
  className = "",
  style,
  ...props
}: BadgeProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-pill)",
    fontSize: "var(--text-caption)", // 14px (min font)
    fontWeight: 500,
    lineHeight: 1.4,
    padding: "4px 12px",
    whiteSpace: "nowrap",
    transition: "background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
  };

  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    neutral: {
      backgroundColor: "var(--color-surface-elevated)",
      color: "var(--color-text-primary)",
      border: "1px solid var(--color-border-subtle)",
    },
    warning: {
      backgroundColor: "rgba(245, 183, 59, 0.12)",
      color: "var(--color-status-warning)",
      border: "1px solid rgba(245, 183, 59, 0.3)",
    },
    success: {
      backgroundColor: "rgba(46, 212, 122, 0.12)",
      color: "var(--color-status-success)",
      border: "1px solid rgba(46, 212, 122, 0.3)",
    },
    error: {
      backgroundColor: "rgba(240, 82, 82, 0.12)",
      color: "var(--color-status-error)",
      border: "1px solid rgba(240, 82, 82, 0.3)",
    },
    info: {
      backgroundColor: "rgba(56, 189, 248, 0.12)",
      color: "var(--color-status-info)",
      border: "1px solid rgba(56, 189, 248, 0.3)",
    },
    "filter-pill": selected
      ? {
          backgroundColor: "var(--color-primary)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-primary-light)",
          fontWeight: 600,
        }
      : {
          backgroundColor: "var(--color-surface-elevated)",
          color: "var(--color-text-muted)",
          border: "1px solid var(--color-border-default)",
        },
  };

  return (
    <span
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </span>
  );
}
