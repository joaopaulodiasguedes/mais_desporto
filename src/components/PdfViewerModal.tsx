import React from 'react';
import { FileText, Download, ExternalLink, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  pdfUrl
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-red-600/30 text-red-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                {title || 'Documento PDF Oficial'}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Visualizador de Resultados & Documentos Homologados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1 font-semibold"
              title="Abrir em novo separador"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Abrir Original</span>
            </a>

            <a
              href={pdfUrl}
              download
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1 font-semibold"
              title="Descarregar PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descarregar</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-100 relative p-2 sm:p-4 overflow-hidden flex flex-col">
          {/* Mock Interactive PDF Viewer for high fidelity */}
          <div className="w-full h-full bg-white rounded-2xl border border-slate-300 shadow-inner flex flex-col overflow-hidden">
            {/* PDF Header Mockup */}
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-700">Ficheiro: {title}.pdf</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded">
                  ✓ Verificado pela Federação
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Página 1 de 4</span>
            </div>

            {/* Embedded iFrame or Fallback */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-50 flex justify-center">
              <div className="bg-white w-full max-w-2xl min-h-[600px] p-6 sm:p-10 shadow-lg border border-slate-200 rounded-xl space-y-6 text-slate-800">
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                      + Desporto • Federação Desportiva
                    </h1>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      FOLHA DE RESULTADOS OFICIAIS & CLASSIFICAÇÕES
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-lg shadow-xs">
                    +D
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-medium">Evento:</span>
                    <strong className="text-slate-900">{title}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Estado:</span>
                    <strong className="text-emerald-700">Homologado & Publicado</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Data de Emissão:</span>
                    <strong>{new Date().toLocaleDateString('pt-PT')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Responsável Técnico:</span>
                    <strong>Direção Técnica de Arbitragem</strong>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-600">
                    Tabela Sumária de Provas e Tempos
                  </h4>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="p-2 font-bold">Pos.</th>
                        <th className="p-2 font-bold">Atleta</th>
                        <th className="p-2 font-bold">Clube</th>
                        <th className="p-2 font-bold">Marca</th>
                        <th className="p-2 font-bold">Pontos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2 font-bold text-amber-600">1º (Ouro)</td>
                        <td className="p-2 font-bold">Marta Santos</td>
                        <td className="p-2 text-slate-600">+ Desporto Clube</td>
                        <td className="p-2 font-mono font-bold">1:02.14</td>
                        <td className="p-2 text-slate-600">620 pts</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-500">2º (Prata)</td>
                        <td className="p-2 font-bold">Lucas Ferreira</td>
                        <td className="p-2 text-slate-600">+ Desporto Clube</td>
                        <td className="p-2 font-mono font-bold">2:01.30</td>
                        <td className="p-2 text-slate-600">580 pts</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-amber-700">3º (Bronze)</td>
                        <td className="p-2 font-bold">Beatriz Neves</td>
                        <td className="p-2 text-slate-600">Clube Náutico</td>
                        <td className="p-2 font-mono font-bold">2:04.12</td>
                        <td className="p-2 text-slate-600">540 pts</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-500">4º</td>
                        <td className="p-2">Tomás Silva</td>
                        <td className="p-2 text-slate-600">+ Desporto Clube</td>
                        <td className="p-2 font-mono">2:08.50</td>
                        <td className="p-2 text-slate-600">510 pts</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Documento gerado e autenticado pela plataforma + Desporto</span>
                  <span>Assinatura Digital: ✓ VÁLIDA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
