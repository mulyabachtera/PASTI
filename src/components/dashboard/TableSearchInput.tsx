"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

interface TableSearchInputProps {
  placeholder: string;
  initialValue?: string;
  accentColor?: "blue" | "rose";
}

export default function TableSearchInput({
  placeholder,
  initialValue = "",
  accentColor = "blue",
}: TableSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed === initialValue.trim()) return;

      startTransition(() => {
        if (trimmed) {
          router.replace(`${pathname}?q=${encodeURIComponent(trimmed)}`, {
            scroll: false,
          });
        } else {
          router.replace(pathname, { scroll: false });
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [query, initialValue, pathname, router]);

  const handleClear = () => {
    setQuery("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  const ringClass =
    accentColor === "rose"
      ? "focus:ring-rose-500"
      : "focus:ring-blue-500";

  return (
    <div className="relative w-full sm:w-96">
      {isPending ? (
        <Loader2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
      ) : (
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 ${ringClass} focus:border-transparent text-sm bg-white`}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          title="Bersihkan pencarian"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

