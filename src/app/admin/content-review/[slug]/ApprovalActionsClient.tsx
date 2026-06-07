"use client";

import { Button } from "@/components/ui/button";
import { ApprovalItem } from "@/data/demo";
import { Check, X } from "lucide-react";

export function ApprovalActionsClient({ item }: { item: ApprovalItem }) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      <Button className="gap-2" onClick={() => { /* TODO: wire approve action */ }}>
        <Check className="w-4 h-4" /> Phê duyệt & xuất bản
      </Button>
      <Button variant="outline" className="gap-2" onClick={() => { /* TODO: wire reject action */ }}>
        <X className="w-4 h-4" /> Từ chối
      </Button>
    </div>
  );
}
