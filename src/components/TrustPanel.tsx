import React from "react";
import { BadgeCheck, Fingerprint, Wallet } from "lucide-react";

interface TrustPanelProps {
  balance: number;
  productCount: number;
}

export default function TrustPanel({ balance, productCount }: TrustPanelProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-[#E6E2DA] bg-white p-4 text-xs shadow-xs">
      <div className="flex items-center gap-3 rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] p-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5A6A42]/10 text-[#5A6A42]">
          <BadgeCheck className="h-4 w-4" />
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-widest text-[#8A847C] font-bold block leading-none">Productos</span>
          <span className="font-bold text-[#2D2D2A] text-xs font-mono">{productCount} verificados</span>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] p-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C2845D]/10 text-[#C2845D]">
          <Wallet className="h-4 w-4" />
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-widest text-[#8A847C] font-bold block leading-none">Fondo Comunal</span>
          <span className="font-bold text-[#2D2D2A] text-xs font-mono">${balance.toLocaleString("es-MX")} MXN</span>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] p-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2D2D2A]/10 text-[#2D2D2A]">
          <Fingerprint className="h-4 w-4" />
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-widest text-[#8A847C] font-bold block leading-none">Trazabilidad</span>
          <span className="font-bold text-[#2D2D2A] text-xs">QR y NFC Activo</span>
        </div>
      </div>
    </div>
  );
}
