"use client";

import { primary, sellerLabel, toInr } from "@/lib/product";
import { useShop } from "@/lib/shop";
import { HEAD_OFFICE, type ChatMessage } from "@/lib/types";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AttachIcon,
  BackIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  MicIcon,
  PhoneIcon,
  ReplyIcon,
  SendIcon,
  TrashIcon,
  VerifiedIcon,
} from "./Icons";
import ProductThumb from "./ProductThumb";

const BUYER_REPLIES = ["Is this available?", "What is the best price?", "Can I book a test ride?", "Is EMI available?"];
const SELLER_REPLIES = [
  "Yes, it is available.",
  "Which city are you in?",
  "You are welcome to visit our showroom.",
  `Please call us at ${HEAD_OFFICE.phone}.`,
];

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionCtor = new () => Recognition;

const speechCtor = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export default function ChatView() {
  const { state, actions } = useShop();
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const recognition = useRef<Recognition | null>(null);
  const chat = state.openChat;
  const chatId = chat?.id;
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [state.chatMessages.length]);
  useEffect(() => setVoiceSupported(!!speechCtor()), []);
  useEffect(() => () => recognition.current?.stop(), []);
  useEffect(() => {
    setSelected([]);
    setReplyTo(null);
  }, [chatId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(""), 1800);
    return () => clearTimeout(t);
  }, [copied]);
  if (!chat) return null;

  const toggleVoice = () => {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Ctor = speechCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.continuous = false;
    const before = draft.trim();
    rec.onresult = (e) => {
      const spoken = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (spoken) setDraft([before, spoken].filter(Boolean).join(" ").slice(0, 999));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognition.current = rec;
    setListening(true);
    rec.start();
  };
  const mine = state.user?.uid;
  const viewerIsBuyer = mine === chat.buyerId;
  const product = chat.productId ? state.products.find((p) => p.id === chat.productId) : undefined;
  const order = chat.orderId ? [...state.myOrders, ...state.sellerOrders].find((o) => o.id === chat.orderId) : undefined;
  const orderLines = order ? order.lines.filter((l) => l.sellerId === chat.sellerId) : [];
  const orderNo = chat.orderId.slice(-6).toUpperCase();
  const title = viewerIsBuyer
    ? (product ? sellerLabel(product) : chat.sellerName) || "Devbhoomi Electrics"
    : chat.buyerName || "Customer";
  const subtitle = viewerIsBuyer ? "Verified seller" : chat.orderId ? `Customer · Order #${orderNo}` : "Customer · Product enquiry";
  const buyerPhone = order?.buyerMobile.replace(/[^\d+]/g, "") ?? "";
  const phoneHref = viewerIsBuyer ? HEAD_OFFICE.phoneHref : buyerPhone.length >= 10 ? `tel:${buyerPhone}` : null;
  const firstLive = orderLines[0] ? state.products.find((p) => p.id === orderLines[0].productId) : undefined;
  const send = () => {
    if (!draft.trim()) return;
    actions.sendChat(draft.trim(), replyTo);
    setDraft("");
    setReplyTo(null);
  };
  const nameOf = (senderId?: string) => (senderId === mine ? "You" : title);
  const toggle = (id: string) => {
    if (id.startsWith("local-")) return;
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const picked = state.chatMessages.filter((m) => selected.includes(m.id));
  const single = picked.length === 1 && !picked[0].deleted ? picked[0] : null;
  const copyable = picked.filter((m) => !m.deleted && m.text.trim());
  const deletable = picked.length > 0 && picked.every((m) => m.senderId === mine && !m.deleted);
  const jumpTo = (id?: string) => {
    if (!id) return;
    const el = document.getElementById(`msg-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.animate([{ backgroundColor: "rgba(26,115,232,0.18)" }, { backgroundColor: "transparent" }], { duration: 1200 });
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface-variant md:inset-y-6 md:left-1/2 md:w-[min(42rem,92vw)] md:-translate-x-1/2 md:overflow-hidden md:rounded-2xl md:shadow-2xl md:ring-1 md:ring-black/10">
      <header className="bg-background shadow-sm">
        {selected.length > 0 ? (
          <div className="flex h-[52px] items-center gap-1 px-1.5">
            <button type="button" onClick={() => setSelected([])} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Cancel selection">
              <CloseIcon />
            </button>
            <p className="flex-1 font-semibold">{selected.length} selected</p>
            {single && (
              <IconAction
                label="Reply"
                onClick={() => {
                  setReplyTo(single);
                  setSelected([]);
                }}
              >
                <ReplyIcon />
              </IconAction>
            )}
            {copyable.length > 0 && (
              <IconAction
                label="Copy"
                onClick={() => {
                  navigator.clipboard?.writeText(copyable.map((m) => m.text).join("\n")).catch(() => undefined);
                  setCopied(copyable.length === 1 ? "Message copied" : `${copyable.length} messages copied`);
                  setSelected([]);
                }}
              >
                <CopyIcon />
              </IconAction>
            )}
            {deletable && (
              <IconAction label="Delete" onClick={() => setConfirmDelete(true)}>
                <TrashIcon />
              </IconAction>
            )}
          </div>
        ) : (
        <div className="flex items-center gap-2.5 px-1.5 py-1.5">
          <button type="button" onClick={actions.closeChat} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Back">
            <BackIcon />
          </button>
          <Avatar name={viewerIsBuyer ? "Devbhoomi Electrics" : title} highlight={viewerIsBuyer} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[15px] font-semibold">
              <span className="truncate">{title}</span>
              {viewerIsBuyer && <VerifiedIcon className="size-3.5 shrink-0 text-[#1a73e8]" />}
            </p>
            <p className="truncate text-xs text-muted">{subtitle}</p>
          </div>
          {phoneHref && (
            <a href={phoneHref} className="rounded-full p-2.5 text-primary hover:bg-surface-variant" aria-label="Call">
              <PhoneIcon />
            </a>
          )}
        </div>
        )}

        {chat.productId && (
          <ContextCard imageKey={product?.images[0] ?? "forest"} onView={product ? () => actions.openChatProduct(product.id) : undefined}>
            <p className="truncate text-sm font-semibold">{product?.name ?? chat.productName}</p>
            {product ? (
              <>
                <p className="truncate text-xs text-muted">
                  {[primary(product).label, primary(product).battery].filter(Boolean).join("  ·  ")}
                </p>
                <p className="text-sm">
                  <span className="font-bold">{toInr(primary(product).offerPrice)}</span>
                  {primary(product).mrp > primary(product).offerPrice && (
                    <span className="ml-1.5 text-xs text-muted line-through">{toInr(primary(product).mrp)}</span>
                  )}
                </p>
              </>
            ) : (
              <p className="text-xs text-danger">No longer listed</p>
            )}
          </ContextCard>
        )}

        {orderLines.length > 0 && (
          <ContextCard imageKey={orderLines[0].imageKey} onView={firstLive ? () => actions.openChatProduct(firstLive.id) : undefined}>
            <p className="text-sm font-semibold">Order #{orderNo}</p>
            {orderLines.map((line) => (
              <p key={`${line.productId}-${line.variantLabel}`} className="truncate text-xs text-muted">
                {line.name}
                {line.variantLabel && ` · ${line.variantLabel}`} × {line.qty}
              </p>
            ))}
            <p className="text-sm font-bold">{toInr(orderLines.reduce((s, l) => s + l.offerPrice * l.qty, 0))}</p>
          </ContextCard>
        )}
      </header>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        <p className="mx-auto mb-2 max-w-sm rounded-lg bg-[#fff8e1] px-3 py-1.5 text-center text-[11px] text-muted">
          Messages stay between you and {viewerIsBuyer ? "the seller" : "the customer"}. Never share OTPs or pay outside Devbhoomi Electrics.
        </p>
        {state.chatMessages.length === 0 && (
          <div className="pt-8 text-center">
            <p className="text-[15px] font-semibold">Start the conversation</p>
            <p className="mt-1 text-xs text-muted">
              {viewerIsBuyer ? "Ask about price, availability, test rides or EMI." : "Reply to the customer to help them decide."}
            </p>
          </div>
        )}
        {state.chatMessages.map((m, i) => {
          const prev = state.chatMessages[i - 1];
          const newDay = m.createdAt > 0 && (!prev || !sameDay(prev.createdAt, m.createdAt));
          const grouped = !!prev && prev.senderId === m.senderId && sameDay(prev.createdAt, m.createdAt);
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className="flex justify-center py-2">
                  <span className="rounded-full bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted">{dayLabel(m.createdAt)}</span>
                </div>
              )}
              <Bubble
                message={m}
                own={m.senderId === mine}
                grouped={grouped}
                selected={selected.includes(m.id)}
                selecting={selected.length > 0}
                replyName={nameOf(m.replySenderId)}
                onImage={setViewing}
                onToggle={() => toggle(m.id)}
                onReply={() => setReplyTo(m)}
                onQuote={() => jumpTo(m.replyToId)}
              />
            </Fragment>
          );
        })}
        <div ref={end} />
      </div>

      <footer className="bg-background shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        {replyTo && (
          <div className="mx-3 mt-2.5 flex items-center overflow-hidden rounded-lg bg-surface-variant">
            <span className="w-1 self-stretch bg-primary" />
            <div className="min-w-0 flex-1 px-2.5 py-1.5">
              <p className="text-xs font-semibold text-primary">Replying to {nameOf(replyTo.senderId)}</p>
              <p className="truncate text-xs text-muted">{replyTo.text || "Photo"}</p>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} className="p-2 text-muted hover:text-foreground" aria-label="Cancel reply">
              <CloseIcon className="size-4" />
            </button>
          </div>
        )}
        {!draft && !replyTo && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pt-2.5">
            {(viewerIsBuyer ? BUYER_REPLIES : SELLER_REPLIES).map((reply) => (
              <button
                type="button"
                key={reply}
                onClick={() => setDraft(reply)}
                className="shrink-0 rounded-full border border-primary/40 px-3 py-1 text-xs text-primary hover:bg-primary/5"
              >
                {reply}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-end gap-1.5 p-3 pl-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) actions.sendChatPhoto(file, replyTo);
              setReplyTo(null);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            aria-label="Attach photo"
            className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-variant"
          >
            <AttachIcon />
          </button>
          <div className="relative flex-1">
            <textarea
              rows={1}
              className={`max-h-28 min-h-11 w-full resize-none rounded-3xl bg-surface-variant py-2.5 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${
                voiceSupported ? "pr-11" : "pr-4"
              }`}
              placeholder={listening ? "Listening…" : "Type a message"}
              value={draft}
              maxLength={999}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                aria-label={listening ? "Stop voice typing" : "Voice typing"}
                className={`absolute bottom-1.5 right-1.5 grid size-8 place-items-center rounded-full ${
                  listening ? "animate-pulse bg-danger text-white" : "text-primary hover:bg-black/5"
                }`}
              >
                <MicIcon className="size-[18px]" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary disabled:opacity-40"
          >
            <SendIcon />
          </button>
        </form>
      </footer>

      {copied && (
        <p className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1.5 text-xs text-white">
          {copied}
        </p>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="w-full max-w-sm space-y-3 rounded-2xl bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-semibold">{selected.length === 1 ? "Delete message?" : `Delete ${selected.length} messages?`}</p>
            <p className="text-sm text-muted">This removes the message for everyone in this chat.</p>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn btn-outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn bg-danger text-white"
                onClick={() => {
                  actions.deleteChatMessages(selected);
                  if (replyTo && selected.includes(replyTo.id)) setReplyTo(null);
                  setSelected([]);
                  setConfirmDelete(false);
                }}
              >
                Delete for everyone
              </button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setViewing(null)}>
          <button
            type="button"
            onClick={() => setViewing(null)}
            aria-label="Close"
            className="absolute left-3 top-3 rounded-full p-2 text-white hover:bg-white/10"
          >
            <CloseIcon />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewing} alt="Photo" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}

function Avatar({ name, highlight }: { name: string; highlight: boolean }) {
  const initials = name
    .split(" ")
    .filter((w) => /^[a-z]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
        highlight ? "bg-primary text-on-primary" : "bg-primary/15 text-primary"
      }`}
    >
      {initials || "?"}
    </span>
  );
}

function ContextCard({ imageKey, onView, children }: { imageKey: string; onView?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={!onView}
      onClick={onView}
      className="mx-3 mb-2.5 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-xl bg-surface-variant p-2.5 text-left enabled:hover:bg-black/5"
    >
      <ProductThumb imageKey={imageKey} className="size-14 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-0.5">{children}</div>
      {onView && <span className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary">View</span>}
    </button>
  );
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="rounded-full p-2.5 hover:bg-surface-variant">
      {children}
    </button>
  );
}

function Bubble({
  message,
  own,
  grouped,
  selected,
  selecting,
  replyName,
  onImage,
  onToggle,
  onReply,
  onQuote,
}: {
  message: ChatMessage;
  own: boolean;
  grouped: boolean;
  selected: boolean;
  selecting: boolean;
  replyName: string;
  onImage: (url: string) => void;
  onToggle: () => void;
  onReply: () => void;
  onQuote: () => void;
}) {
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const corner = grouped ? "" : own ? "rounded-tr-sm" : "rounded-tl-sm";
  const image = message.deleted ? "" : message.imageUrl;
  const pending = message.id.startsWith("local-");
  const cancelPress = () => {
    if (press.current) clearTimeout(press.current);
    press.current = null;
  };
  return (
    <div
      id={`msg-${message.id}`}
      className={`group flex items-center gap-1 rounded-lg px-0.5 ${own ? "flex-row-reverse" : ""} ${grouped ? "" : "pt-1"} ${
        selected ? "bg-primary/15" : ""
      } ${selecting ? "cursor-pointer" : ""}`}
      onContextMenu={(e) => {
        if (pending) return;
        e.preventDefault();
        onToggle();
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" || pending) return;
        longPressed.current = false;
        press.current = setTimeout(() => {
          longPressed.current = true;
          onToggle();
        }, 450);
      }}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onClickCapture={(e) => {
        if (longPressed.current) {
          longPressed.current = false;
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        if (selecting) {
          e.stopPropagation();
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div
        className={`min-w-[4.5rem] max-w-[80%] select-text rounded-2xl pb-1.5 ${image ? "px-1 pt-1" : "px-3 pt-2"} ${corner} ${
          own ? "bg-primary text-on-primary" : "bg-background shadow-sm"
        }`}
      >
        {message.replyToId && !message.deleted && (
          <button
            type="button"
            onClick={onQuote}
            className={`mb-1 flex w-full overflow-hidden rounded-lg text-left ${own ? "bg-white/15" : "bg-surface-variant"}`}
          >
            <span className={`w-[3px] shrink-0 ${own ? "bg-white" : "bg-primary"}`} />
            <span className="min-w-0 px-2 py-1">
              <span className={`block text-[11px] font-semibold ${own ? "" : "text-primary"}`}>{replyName}</span>
              <span className={`block truncate text-xs ${own ? "opacity-80" : "text-muted"}`}>{message.replyText || "Message"}</span>
            </span>
          </button>
        )}
        {message.deleted && <p className={`text-[13px] italic ${own ? "opacity-80" : "text-muted"}`}>This message was deleted</p>}
        {image && (
          <button type="button" onClick={() => onImage(image)} className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Photo" className="size-56 rounded-xl object-cover" />
          </button>
        )}
        {message.text && !message.deleted && (
          <p className={`whitespace-pre-wrap break-words text-sm leading-snug ${image ? "px-1.5 pt-1" : ""}`}>{message.text}</p>
        )}
        {message.createdAt > 0 && (
          <p className={`mt-0.5 text-right text-[10px] ${image ? "pr-1.5" : ""} ${own ? "opacity-75" : "text-muted"}`}>
            {timeLabel(message.createdAt)}
          </p>
        )}
      </div>
      {!selecting && !pending && !message.deleted && (
        <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" onClick={onReply} title="Reply" aria-label="Reply" className="rounded-full p-1.5 text-muted hover:bg-background">
            <ReplyIcon className="size-4" />
          </button>
          <button type="button" onClick={onToggle} title="Select" aria-label="Select" className="rounded-full p-1.5 text-muted hover:bg-background">
            <CheckIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function sameDay(a: number, b: number) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function dayLabel(millis: number) {
  const now = Date.now();
  if (sameDay(millis, now)) return "Today";
  if (sameDay(millis, now - 86_400_000)) return "Yesterday";
  return new Date(millis).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function timeLabel(millis: number) {
  return new Date(millis).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}
