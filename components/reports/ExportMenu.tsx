"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { PlanFeatures } from "@/lib/plan/features";

type Props = { auditId: string; features: PlanFeatures };

export function ExportMenu({ auditId, features }: Props) {
  const downloadPdf = () => {
    window.open(`/api/audits/${auditId}/pdf`, "_blank");
  };

  const downloadCsv = (type: string) => {
    window.open(`/api/audits/${auditId}/export?type=${type}`, "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Download className="mr-1 h-4 w-4" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadPdf}>
          Download PDF
        </DropdownMenuItem>
        {features.canExportCsv && (
          <>
            <DropdownMenuItem onClick={() => downloadCsv("keywords")}>
              Export Keywords (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadCsv("issues")}>
              Export Issues (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadCsv("geo")}>
              Export GEO Data (CSV)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
