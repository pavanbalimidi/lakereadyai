"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What does Readiness actually do?",
  "How is the score calculated?",
  "Can I try it without giving you credentials?",
  "What permissions do you need on Snowflake?",
];

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi — I'm Readiness Assistant. Ask me anything about how the scanner works, what we measure, or how to get started. Pick a starter below or type your question.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  async function send(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || streaming) return;
    setInput("");

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Skip the synthetic greeting on the wire — Claude doesn't need it.
        body: JSON.stringify({
          messages: next.filter((m) => m !== GREETING),
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res
          .json()
          .catch(() => ({ error: `Request failed with status ${res.status}` }));
        setMessages((m) => {
          const copy = m.slice(0, -1);
          return [
            ...copy,
            {
              role: "assistant",
              content: `_${err.error ?? "Something went wrong."}_`,
            },
          ];
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = m.slice(0, -1);
          return [...copy, { role: "assistant", content: acc }];
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error.";
      setMessages((m) => {
        const copy = m.slice(0, -1);
        return [...copy, { role: "assistant", content: `_${message}_` }];
      });
    } finally {
      setStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const showStarters = messages.length === 1 && messages[0] === GREETING;

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-fab"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-white/15 bg-gradient-to-br from-blue-600 to-purple-600 px-5 py-3 text-sm font-medium text-white shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50"
            aria-label="Open Readiness Assistant"
          >
            <span className="relative grid h-7 w-7 place-items-center rounded-full bg-white/15">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-blue-600" />
            </span>
            Ask Readiness
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 flex h-[min(620px,calc(100vh-3rem))] w-[min(420px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a14]/95 shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-br from-blue-600/20 to-purple-600/10 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-600/30">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Readiness Assistant
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online · Powered by Claude
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-color:rgba(255,255,255,0.1)_transparent] [scrollbar-width:thin]"
            >
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <Bubble key={i} role={m.role} content={m.content} streaming={streaming && i === messages.length - 1} />
                ))}
              </div>

              {showStarters && (
                <div className="mt-4 grid gap-2">
                  <div className="text-[10px] uppercase tracking-widest text-white/30">
                    Try asking
                  </div>
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-xs text-white/70 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-black/30 p-2 focus-within:border-white/20">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder="Ask about Readiness…"
                  className="max-h-32 flex-1 resize-none bg-transparent px-1 py-1 text-sm text-white outline-none placeholder:text-white/30"
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || streaming}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow transition",
                    (!input.trim() || streaming) && "opacity-40",
                  )}
                  aria-label="Send"
                >
                  {streaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-2 px-1 text-[10px] text-white/30">
                Replies are AI-generated. For pricing or procurement, email
                hello@readiness.ai.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({
  role,
  content,
  streaming,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
            : "border border-white/10 bg-white/[0.03] text-white/85",
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none [&_a]:text-blue-300 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {streaming && <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-white/60 align-middle" />}
          </div>
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-white/50" />
        )}
      </div>
    </div>
  );
}
