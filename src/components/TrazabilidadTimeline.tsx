import React, { useEffect, useState } from "react";
import { Product, TraceabilityStage } from "../types";
import { 
  ShieldCheck, 
  HelpCircle, 
  RefreshCw, 
  FileText, 
  ChevronRight, 
  Lock, 
  QrCode, 
  Globe, 
  User, 
  Compass,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface TrazabilidadTimelineProps {
  product: Product;
  onClose: () => void;
}

export default function TrazabilidadTimeline({ product, onClose }: TrazabilidadTimelineProps) {
  const [stages, setStages] = useState<TraceabilityStage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [scanTab, setScanTab] = useState<"trazabilidad" | "blockchain" | "manualQr">("trazabilidad");

  useEffect(() => {
    fetchStages();
  }, [product]);

  const fetchStages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/traceability`);
      if (res.ok) {
        const data = await res.json();
        setStages(data);
      }
    } catch (err) {
      console.error("Error reading traceability", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLedger = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/traceability/verify/${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
      }
    } catch (err) {
      console.error("Ledger audit error", err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div 
      id="trazabilidad-panel"
      className="bg-white rounded-3xl border border-[#E6E2DA] shadow-sm p-6"
    >
      <div className="flex justify-between items-start border-b border-[#E6E2DA] pb-4 mb-4">
        <div>
          <span className="text-[10px] font-mono bg-[#FAF8F5] border border-[#E6E2DA] text-[#6B665F] px-2.5 py-1 rounded-full uppercase tracking-widest font-bold">
            CÓDIGO DE TRAZA: {product.traceCode}
          </span>
          <h2 className="text-xl font-serif font-bold text-[#2D2D2A] mt-2">Ficha de Confianza & Origen</h2>
          <p className="text-xs text-[#6B665F] mt-0.5">Trazabilidad inmutable desde la comunidad de <span className="font-semibold text-[#5A6A42]">{product.community}</span></p>
        </div>
        <button 
          onClick={onClose}
          className="text-[#6B665F] hover:text-[#2D2D2A] p-1.5 rounded-xl hover:bg-[#FAF8F5] text-xs font-bold font-mono tracking-widest uppercase"
        >
          ✕ Cerrar
        </button>
      </div>

      {/* Tabs for scanning layout */}
      <div className="flex border border-[#E6E2DA] mb-4 bg-[#FAF8F5] p-1 rounded-xl">
        <button
          onClick={() => setScanTab("trazabilidad")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors ${
            scanTab === "trazabilidad" 
            ? "bg-white text-[#2D2D2A] border border-[#E6E2DA] shadow-xs" 
            : "text-[#8A847C] hover:text-[#2D2D2A]"
          }`}
        >
          Historial Social
        </button>
        <button
          onClick={() => setScanTab("blockchain")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors ${
            scanTab === "blockchain" 
            ? "bg-white text-[#5A6A42] border border-[#E6E2DA] shadow-xs" 
            : "text-[#8A847C] hover:text-[#2D2D2A]"
          }`}
        >
          Ledger Blockchain
        </button>
        <button
          onClick={() => setScanTab("manualQr")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors ${
            scanTab === "manualQr" 
            ? "bg-white text-[#C2845D] border border-[#E6E2DA] shadow-xs" 
            : "text-[#8A847C] hover:text-[#2D2D2A]"
          }`}
        >
          Sello Físico QR
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center flex-col gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#5A6A42]" />
          <p className="text-[#6B665F] text-xs font-mono uppercase tracking-widest">Leyendo registro comunal en blockchain...</p>
        </div>
      ) : (
        <>
          {scanTab === "trazabilidad" && (
            <div>
              {/* Trust Card Summary */}
              <div className="bg-[#FAF8F5] border border-[#E6E2DA] rounded-2xl p-4 mb-6 text-xs text-[#3D3A35]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#8A847C] block text-[9px] uppercase tracking-wider font-mono">Elaborado por</span>
                    <span className="font-bold text-[#2D2D2A] text-sm">{product.producerName}</span>
                  </div>
                  <div>
                    <span className="text-[#8A847C] block text-[9px] uppercase tracking-wider font-mono">Comunidad Ancestral</span>
                    <span className="font-bold text-[#2D2D2A] text-sm">{product.community}</span>
                  </div>
                  <div>
                    <span className="text-[#8A847C] block text-[9px] uppercase tracking-wider font-mono">Grupo Respaldo</span>
                    <span className="font-bold text-[#3D3A35] line-clamp-1">{product.cooperativeName}</span>
                  </div>
                  <div>
                    <span className="text-[#8A847C] block text-[9px] uppercase tracking-wider font-mono">Tiempo de Confección</span>
                    <span className="font-bold text-[#5A6A42]">{product.craftHours} horas</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E6E2DA]">
                  <span className="text-[#8A847C] block text-[9px] uppercase tracking-wider font-mono mb-1.5">Materiales & Materia Prima Utilizados</span>
                  <div className="flex flex-wrap gap-1">
                    {product.materials.map((mat, i) => (
                      <span key={i} className="bg-white px-2.5 py-0.5 rounded-md border border-[#E6E2DA] text-[#6B665F] text-[10px] font-medium">
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>

                {product.associatedResources && product.associatedResources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#E6E2DA]">
                    <span className="text-[#8A847C] block text-[9px] uppercase tracking-wider font-mono mb-1.5">Shared Community Tools & Machinery Used</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.associatedResources.map((res, i) => (
                        <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium flex items-center gap-1">
                          🛠️ {res}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Social Timeline list */}
              <div className="relative border-l border-[#E6E2DA] ml-3 pl-5 space-y-6">
                {stages.map((stg, i) => {
                  let indicatorColor = "bg-[#FAF8F5] border-[#8A847C]";
                  if (stg.stage_key === "registration") indicatorColor = "bg-[#FAF8F5] border-[#C2845D]";
                  if (stg.stage_key === "validation") indicatorColor = "bg-[#FAF8F5] border-[#5A6A42]";
                  if (stg.stage_key === "sold") indicatorColor = "bg-[#5A6A42] border-[#5A6A42]";

                  return (
                    <div key={stg.id} className="relative group">
                      {/* Anchor Timeline bullet matching theme linetwork */}
                      <span className={`absolute -left-[27px] top-[3px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${indicatorColor} group-hover:scale-125 transition-transform z-10`}></span>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-[#2D2D2A] text-sm">{stg.stage_label}</h4>
                          <span className="text-[10px] text-[#8A847C] font-mono bg-[#FAF8F5] border border-[#E6E2DA] px-2 py-0.5 rounded-md">
                            {stg.date}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B665F] mt-1 leading-relaxed">
                          {stg.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#8A847C] mt-2 font-mono uppercase tracking-wider">
                          <User className="w-3.5 h-3.5 text-[#5A6A42]" />
                          <span>Responsable: {stg.responsible}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {scanTab === "blockchain" && (
            <div className="space-y-4">
              <div className="bg-[#2D2D2A] text-[#FAF8F5] rounded-2xl p-4 font-mono text-[10px] leading-relaxed shadow-sm border border-[#E6E2DA] overflow-hidden">
                <div className="flex items-center justify-between text-[#FAF8F5] border-b border-[#FAF8F5]/10 pb-2 mb-3">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider font-bold text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-[#C2845D]" />
                    CRIPTOLOGÍA EXTREMA JÑATJO
                  </span>
                  <span className="text-[8px] bg-[#5A6A42] text-white px-2 py-0.5 rounded-full font-bold">
                    INMUTABLE
                  </span>
                </div>
                
                {stages.map((stg, i) => (
                  <div key={stg.id} className="mb-3 border-b border-[#FAF8F5]/5 pb-2 last:border-b-0 last:pb-0 overflow-x-auto">
                    <div className="flex justify-between font-bold text-white text-[11px]">
                      <span>BLOQUE #{i} [{stg.stage_key.toUpperCase()}]</span>
                      <span className="text-[#C2845D]">{stg.date}</span>
                    </div>
                    <div className="text-stone-300 mt-1">Autoridad: {stg.responsible}</div>
                    <div className="text-stone-400 font-mono text-[9px] bg-black/20 p-1.5 rounded-md mt-1 break-all">
                      <span className="text-[#C2845D] font-bold">PREV_HASH:</span> {stg.hash_previous}
                    </div>
                    <div className="text-[#FAF8F5] font-mono text-[9px] bg-black/35 p-1.5 rounded-md mt-1 break-all border-l border-[#5A6A42]">
                      <span className="text-[#5A6A42] font-bold">ACTUAL_HASH:</span> {stg.hash_actual}
                    </div>
                  </div>
                ))}
              </div>

              {/* Verify Action Module */}
              <div className="bg-[#FAF8F5] border border-[#E6E2DA] rounded-2xl p-5 flex flex-col items-center">
                <div className="text-center max-w-sm mb-4">
                  <h4 className="text-xs font-serif font-bold text-[#2D2D2A] uppercase tracking-wider">Auditar Libro de Contabilidad</h4>
                  <p className="text-xs text-[#6B665F] mt-1.5 leading-relaxed">
                    Comprueba mediante criptografía que la cadena de hash no haya sufrido alteraciones desde su creación original.
                  </p>
                </div>

                <button
                  id="audit-blockchain-btn"
                  onClick={handleVerifyLedger}
                  disabled={verifying}
                  className="w-full sm:w-auto px-6 py-3 bg-[#2D2D2A] hover:bg-[#5A6A42] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {verifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{verifying ? "RECONCILIANDO COPIAS..." : "Iniciar Auditoria de Origen"}</span>
                </button>

                {verificationResult && (
                  <div className={`mt-4 w-full p-4 rounded-xl border flex gap-3 text-xs ${
                    verificationResult.verifiedIsValid 
                    ? "bg-[#FAF8F5] border-[#5A6A42] text-[#3D3A35]" 
                    : "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    {verificationResult.verifiedIsValid ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-[#5A6A42] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-serif font-bold text-base text-[#2D2D2A]">✓ Cadena Válida e Incorruptible</p>
                          <p className="text-[11px] mt-1 text-[#6B665F]">
                            Se ha auditado el enlace secuencial de hashes. La firma digital de la cooperativa <span className="font-semibold text-[#5A6A42]">{product.cooperativeName}</span> permanece intacta y protegida contra falsificaciones.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-[#C2845D] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-serif font-bold">Error de Validación Criptográfica</p>
                          <p className="text-[11px] mt-1">
                            El hash calculado no concuerda. Este producto podría haber sido alterado fuera del protocolo de comercio justo estatal.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {scanTab === "manualQr" && (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="bg-[#FAF8F5] border border-[#E6E2DA] p-5 rounded-3xl flex flex-col items-center shadow-sm max-w-xs">
                {/* SVG Mock of QR Code generated for this specific product traceability */}
                <div className="w-40 h-40 bg-white p-3.5 border border-[#E6E2DA] rounded-2xl flex items-center justify-center relative shadow-inner">
                  <div className="text-[#2D2D2A]">
                    <QrCode className="w-full h-full stroke-[1.1]" />
                  </div>
                  {/* Decorative logo in middle of QR */}
                  <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-[#5A6A42] text-white text-[9px] font-bold flex items-center justify-center shadow-md font-mono border-2 border-white">
                    JÑATJO
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[9px] text-[#8A847C] font-mono uppercase tracking-widest block font-bold">Código Único de Autenticidad</span>
                  <span className="font-serif font-bold text-[#2D2D2A] text-sm mt-0.5 block">{product.traceCode}</span>
                </div>
              </div>

              <div className="max-w-md mt-6 px-1">
                <p className="text-xs font-serif font-bold text-[#2D2D2A]">Certificado Físico Sello Jñatjo</p>
                <p className="text-xs text-[#6B665F] mt-1.5 leading-relaxed">
                  Cada prenda o pieza despachada cuenta con un cordel tradicional de hilaza e hilo de algodón teñido que encierra un colgante con este QR o chip NFC integrado. Al escanearlo, el software valida los hashes directamente contra esta bitácora inmutable.
                </p>

                {/* Cultural element: Mazahua phrases in elegant earth container */}
                <div className="mt-5 p-4 bg-[#FAF8F5] border border-[#E6E2DA] rounded-2xl text-left">
                  <h5 className="text-xs font-serif font-bold text-[#2D2D2A] mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
                    <Globe className="w-4 h-4 text-[#5A6A42]" />
                    Glosario Tradicional impreso en el Empaque:
                  </h5>
                  <div className="space-y-2">
                    <p className="text-xs text-[#3D3A35] leading-relaxed">
                      <span className="font-bold text-[#5A6A42] font-mono block text-[11px] mb-0.5">“Kjimi!”</span>
                      Saludo tradicional mazahua que significa: <span className="italic text-[#6B665F]">¡Hola! / Que Dios te guarde.</span>
                    </p>
                    <p className="text-xs text-[#3D3A35] leading-relaxed pt-2 border-t border-[#E6E2DA]/50">
                      <span className="font-bold text-[#C2845D] font-mono block text-[11px] mb-0.5">“Po r'a pjös'ïgui”</span>
                      Agradecimiento comunitario: <span className="italic text-[#6B665F]">Muchas gracias por tu apoyo justo que impulsa a nuestro pueblo.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

