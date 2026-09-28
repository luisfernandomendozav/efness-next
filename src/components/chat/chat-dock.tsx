"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  FileText,
  MessageCircle,
  Paperclip,
  Send,
} from "lucide-react";
import { useT } from "@/i18n/use-t";
import type { ChatContact, ChatMessage } from "@/server/chat";
import {
  markChatReadAction,
  sendChatFileAction,
  sendChatMessageAction,
} from "@/server/chat-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Chat estilo Facebook, colapsado en la esquina inferior derecha (feedback
// presentación 2026-09-26, lámina 10): lista de aliados con su última
// conversación, historial al abrir y envío de texto y archivos. Refresca
// por polling (el legacy usaba Pusher); la presencia online/offline quedó
// pendiente, igual que en el legacy.

const CONTACTS_POLL_MS = 15000;
const MESSAGES_POLL_MS = 4000;

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function MessageBubble({ message, t }: { message: ChatMessage; t: (k: string) => string }) {
  return (
    <div className={cn("flex", message.mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
          message.mine
            ? "rounded-br-sm bg-[#dfffea] text-[#1d2747]"
            : "rounded-bl-sm bg-muted",
        )}
      >
        {message.type === "image" ? (
          <a href={message.content} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.content}
              alt={t("Image")}
              className="max-h-40 rounded-md"
            />
          </a>
        ) : message.type === "document" ? (
          <a
            href={message.content}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 underline"
          >
            <FileText className="h-4 w-4 shrink-0" />
            {t("Document")}
          </a>
        ) : (
          <span className="whitespace-pre-wrap break-words">
            {message.content}
          </span>
        )}
        <div className="mt-0.5 text-right text-[10px] text-muted-foreground">
          {new Date(message.sentAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

export function ChatDock() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [active, setActive] = useState<ChatContact | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalUnread = contacts.reduce((sum, c) => sum + c.unread, 0);

  const refreshContacts = useCallback(() => {
    fetch("/api/chat/contacts", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { contacts: ChatContact[] } | null) => {
        if (data) setContacts(data.contacts);
      })
      // Sin conexión: el siguiente poll reintenta.
      .catch(() => {});
  }, []);

  // Los no leídos se ven aun con el dock cerrado.
  useEffect(() => {
    refreshContacts();
    const handle = setInterval(refreshContacts, CONTACTS_POLL_MS);
    return () => clearInterval(handle);
  }, [refreshContacts]);

  // Historial + mensajes nuevos de la conversación abierta.
  useEffect(() => {
    if (!conversationId) return;
    let lastId = 0;
    let cancelled = false;

    const poll = async () => {
      try {
        const query = lastId ? `&after=${lastId}` : "";
        const res = await fetch(
          `/api/chat/messages?conversationId=${conversationId}${query}`,
          { cache: "no-store" },
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { messages: ChatMessage[] };
        if (data.messages.length === 0) return;
        lastId = data.messages[data.messages.length - 1].id;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...data.messages.filter((m) => !seen.has(m.id))];
        });
        markChatReadAction(conversationId);
      } catch {
        // Reintenta en el siguiente poll.
      }
    };

    poll();
    const handle = setInterval(poll, MESSAGES_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, active]);

  const openContact = (contact: ChatContact) => {
    setActive(contact);
    setMessages([]);
    setConversationId(contact.conversationId);
    if (contact.conversationId) markChatReadAction(contact.conversationId);
    setContacts((prev) =>
      prev.map((c) =>
        c.userId === contact.userId ? { ...c, unread: 0 } : c,
      ),
    );
  };

  const closeConversation = () => {
    setActive(null);
    setConversationId(null);
    setMessages([]);
    refreshContacts();
  };

  const send = async () => {
    if (!active || !text.trim() || sending) return;
    setSending(true);
    try {
      const result = await sendChatMessageAction(active.userId, text);
      if ("message" in result) {
        setText("");
        setConversationId(result.conversationId);
        setMessages((prev) =>
          prev.some((m) => m.id === result.message.id)
            ? prev
            : [...prev, result.message],
        );
      }
    } finally {
      setSending(false);
    }
  };

  const sendFile = async (file: File) => {
    if (!active || sending) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await sendChatFileAction(active.userId, formData);
      if ("message" in result) {
        setConversationId(result.conversationId);
        setMessages((prev) =>
          prev.some((m) => m.id === result.message.id)
            ? prev
            : [...prev, result.message],
        );
      }
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-[#1d2747] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="h-4 w-4" />
        {t("Chat")}
        {totalUnread > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f8285a] px-1 text-xs">
            {totalUnread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col overflow-hidden rounded-lg border bg-background shadow-xl">
      <div className="flex items-center justify-between bg-[#1d2747] px-3 py-2 text-white">
        <div className="flex min-w-0 items-center gap-2">
          {active && (
            <button
              type="button"
              onClick={closeConversation}
              className="rounded p-0.5 hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <span className="truncate text-sm font-semibold">
            {active ? active.name : t("Chat")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded p-0.5 hover:bg-white/10"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {active === null ? (
        <div className="max-h-96 overflow-y-auto">
          {contacts.map((contact) => (
            <button
              key={contact.userId}
              type="button"
              onClick={() => openContact(contact)}
              className="flex w-full items-center gap-3 border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-muted"
            >
              <Avatar className="h-9 w-9 shrink-0">
                {contact.avatar && (
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                )}
                <AvatarFallback>{initialsOf(contact.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {contact.name}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {contact.lastMessage
                    ? contact.lastMessage.type === "image"
                      ? `📷 ${t("Image")}`
                      : contact.lastMessage.type === "document"
                        ? `📄 ${t("Document")}`
                        : contact.lastMessage.content
                    : (contact.companyName ?? "")}
                </div>
              </div>
              {contact.unread > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#f8285a] px-1 text-xs text-white">
                  {contact.unread}
                </span>
              )}
            </button>
          ))}
          {contacts.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("Connect with allies to start chatting.")}
            </p>
          )}
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex h-80 flex-col gap-2 overflow-y-auto bg-muted/30 p-3"
          >
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} t={t} />
            ))}
            {messages.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("No messages yet. Say hello!")}
              </p>
            )}
          </div>
          <form
            className="flex items-center gap-1.5 border-t p-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) sendFile(file);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              disabled={sending}
              onClick={() => fileRef.current?.click()}
              title={t("Attach file")}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("Type a message")}
              className="h-8 flex-1"
              maxLength={5000}
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              disabled={sending || !text.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
