"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary: "bg-white text-ink border border-line hover:bg-surface",
  danger: "bg-marker-danger text-white hover:opacity-90",
  ghost: "bg-transparent text-primary hover:bg-surface",
};

export default function Button({
  variant = "primary",
  className = "",
  disabled,
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center rounded-md px-4 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-40 ${styles[variant]} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
