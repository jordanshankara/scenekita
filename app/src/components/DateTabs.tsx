"use client";

import React from "react";
import { HariOpsi } from "@/lib/date";

interface DateTabsProps {
  days: HariOpsi[];
  selectedKey: string;
  onSelect: (key: string) => void;
  showAllOption?: boolean;
}

export function DateTabs({
  days,
  selectedKey,
  onSelect,
  showAllOption = true,
}: DateTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Pilih tanggal tayang"
      style={{
        display: "flex",
        gap: "var(--space-2)",
        overflowX: "auto",
        paddingBottom: "var(--space-2)",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {showAllOption && (
        <button
          type="button"
          role="tab"
          aria-selected={selectedKey === "all"}
          onClick={() => onSelect("all")}
          style={{
            padding: "8px 16px",
            height: "var(--touch-min)", // 44px
            borderRadius: "var(--radius-pill)",
            fontSize: "var(--text-caption)",
            fontWeight: selectedKey === "all" ? 600 : 500,
            cursor: "pointer",
            border: selectedKey === "all"
              ? "1px solid var(--color-primary-light)"
              : "1px solid var(--color-border-default)",
            backgroundColor: selectedKey === "all"
              ? "var(--color-primary)"
              : "var(--color-surface-elevated)",
            color: selectedKey === "all"
              ? "var(--color-text-primary)"
              : "var(--color-text-muted)",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "all var(--duration-fast) var(--ease-standard)",
          }}
        >
          Semua Tanggal
        </button>
      )}

      {days.map((d) => {
        const isSelected = selectedKey === d.key;
        return (
          <button
            key={d.key}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(d.key)}
            style={{
              padding: "8px 16px",
              height: "var(--touch-min)", // 44px
              borderRadius: "var(--radius-pill)",
              fontSize: "var(--text-caption)",
              fontWeight: isSelected ? 600 : 500,
              cursor: "pointer",
              border: isSelected
                ? "1px solid var(--color-primary-light)"
                : "1px solid var(--color-border-default)",
              backgroundColor: isSelected
                ? "var(--color-primary)"
                : "var(--color-surface-elevated)",
              color: isSelected
                ? "var(--color-text-primary)"
                : "var(--color-text-muted)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all var(--duration-fast) var(--ease-standard)",
            }}
          >
            <span style={{ fontWeight: 600 }}>{d.label}</span>
            <span style={{ opacity: 0.75, marginLeft: "var(--space-1)" }}>({d.sublabel})</span>
          </button>
        );
      })}
    </div>
  );
}
