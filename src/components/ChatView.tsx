"use client";

import { useShop } from "@/lib/shop";
import { useEffect, useRef, useState } from "react";
import { BackIcon } from "./Icons";

export default function ChatView() {
  const { state, actions } = useShop();
  const [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const chat = state.openChat;
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [state.chatMessages.length]);
  if (!chat) return null;
  const mine = state.user?.uid;
  const title = mine === chat.buyerId ? chat.sellerName : chat.buyerName;
  const subtitle = chat.productName || (chat.orderId ? "Order query" : "Chat");
  const send = () => {
    actions.sendChat(draft);
    setDraft("");
  };
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background md:inset-y-6 md:left-1/2 md:w-[min(42rem,92vw)] md:-translate-x-1/2 md:rounded-2xl md:shadow-2xl md:ring-1 md:ring-black/10">
      <div className="flex items-center gap-2 border-b border-surface-variant p-2">
        <button type="button" onClick={actions.closeChat} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Back">
          <BackIcon />
        </button>
        <div>
          <p className="font-semibold">{title || "Chat"}</p>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {state.chatMessages.length === 0 && (
          <p className="pt-3 text-xs text-muted">
            {chat.productName
              ? `Ask anything about ${chat.productName}. The seller will reply here.`
              : "Send a message about this order. The other person sees it here."}
          </p>
        )}
        {state.chatMessages.map((m) => {
          const own = m.senderId === mine;
          return (
            <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                  own ? "bg-primary text-on-primary" : "bg-surface-variant"
                }`}
              >
                {m.text}
              </p>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form
        className="flex gap-2 border-t border-surface-variant p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) send();
        }}
      >
        <input className="field flex-1" placeholder="Message" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={999} />
        <button type="submit" className="btn btn-primary" disabled={!draft.trim() || state.busy}>
          Send
        </button>
      </form>
    </div>
  );
}
