"use client";

import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { cn, waLink } from "@/lib/utils";

// Enlaces de contacto para las tablas del admin. Cortan la propagación del clic para no abrir
// el detalle de la fila al usarlos.

const LINK = "text-link inline-flex max-w-full items-center gap-1 rounded-chip underline-offset-4 hover:underline";

export function MailLink({ email, className }: { email: string | null | undefined; className?: string }) {
  if (!email) return null;
  return (
    <a href={`mailto:${email}`} onClick={(e) => e.stopPropagation()} className={cn(LINK, className)}>
      <Mail className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
      <span className="truncate">{email}</span>
    </a>
  );
}

export function WhatsAppLink({
  phone,
  label,
  className,
}: {
  phone: string | null | undefined;
  label?: string;
  className?: string;
}) {
  const href = waLink(phone);
  if (!href) return phone ? <span className={className}>{phone}</span> : null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(LINK, className)}
      aria-label={`Abrir WhatsApp con ${phone}`}
    >
      <MessageCircle className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
      <span className="truncate tabular-nums">{label ?? phone}</span>
    </a>
  );
}

export function OutLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(LINK, className)}
    >
      <span className="truncate">{children}</span>
      <ArrowUpRight className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
    </a>
  );
}
