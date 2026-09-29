"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";

export function LinkRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <TableRow
      tabIndex={0}
      className="cursor-pointer"
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(href);
      }}
    >
      {children}
    </TableRow>
  );
}
