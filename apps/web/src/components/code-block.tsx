"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function CodeBlock({
  children,
  language,
  className,
}: {
  children: string;
  language?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-white/10 bg-black/60 backdrop-blur",
        className,
      )}
    >
      {language && (
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-3 py-1.5 text-[10px] uppercase tracking-widest text-white/40">
          <span>{language}</span>
        </div>
      )}
      <button
        onClick={copy}
        aria-label="Copy code"
        className="absolute right-2 top-2 rounded-md border border-white/10 bg-white/5 p-1.5 text-white/60 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-white/85">
        <code>{children}</code>
      </pre>
    </div>
  );
}
