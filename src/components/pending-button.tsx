"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";

// A submit button that disables itself while its form's Server Action is running
export function PendingButton({ disabled, className = "", ...props }: ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      {...props}
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-40`}
    />
  );
}
