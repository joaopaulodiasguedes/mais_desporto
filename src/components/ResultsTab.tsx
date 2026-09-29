import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Trophy,
  Plus,
  FileText,
  Calendar,
  MapPin,
  Trash2,
  Edit2,
  X,
  Check,
  Search,
  Eye,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import { CompetitionResult } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { openOriginalDocument } from '../utils/documentUtils';

interface ResultsTabProps {
  onOpenPdf: (title: string, url: string) => void;
}

export const ResultsTab: React.FC<ResultsTabProps> = ({ onOpenPdf }) => {
  const { results, addResult, updateResult, deleteResult, hasPermission, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<CompetitionResult | null>(null);
  const [resultToDelete, setResultToDelete] = useState<CompetitionResult | null>(null);

  // Permission check: coaches can add/edit/delete
  const canManage = hasPermission('canAddResults') || currentUser.role === 'treinador';

  // Form State (Simple & direct)
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('2026-08-15');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPdfUrl, setFormPdfUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  const [formPdfTitle, setFormPdfTitle] = useState('Classificacoes_Oficiais.pdf');

  const handleOpenAdd = () => {
    setEditingResult(null);
    setFormTitle('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormLocation('Complexo Municipal');
    setFormDescription('');
    setFormPdfUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    setFormPdfTitle('Resultados_Oficiais.pdf');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: CompetitionResult) => {
    setEditingResult(res);
    setFormTitle(res.title);
    setFormDate(res.competitionDate);
    setFormLocation(res.location);
    setFormDescription(res.summary);
    setFormPdfUrl(res.pdfUrl);
    setFormPdfTitle(res.pdfTitle);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formPdfUrl) return;

    if (editingResult) {
      updateResult(editingResult.id, {
        title: formTitle,
        competitionDate: formDate,
        location: formLocation,
        summary: formDescription,
        pdfUrl: formPdfUrl,
        pdfTitle: formPdfTitle || 'Resultados_Oficiais.pdf'
      });
    } else {
      addResult({
        title: formTitle,
        competitionDate: formDate,
        modality: 'Geral',
        category: 'Geral',
        location: formLocation,
        pdfUrl: formPdfUrl,
        pdfTitle: formPdfTitle || 'Resultados_Oficiais.pdf',
        pdfFileSize: '1.2 MB',
        summary: formDescription,
        podium: [],
        highlights: [],
        publishedByCoachName: currentUser.name || 'Treinador'
      });
    }

    setIsModalOpen(false);
  };

  const filteredResults = results.filter((res) => {
    const q = searchQuery.toLowerCase();
    return (
      res.title.toLowerCase().includes(q) ||
      res.location.toLowerCase().includes(q) ||
      res.summary.toLowerCase().includes(q) ||
      res.competitionDate.includes(q)
    );
  }).sort((a, b) => new Date(b.competitionDate).getTime() - new Date(a.competitionDate).getTime());

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Resultados de Competições
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Consulta rápida com data, local, descrição e documentos oficiais em PDF
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por data, local ou prova..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          {/* Add Result Button */}
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Adicionar Resultados</span>
            </button>
          )}
        </div>
      </div>

      {/* Simple Results List */}
      <div className="space-y-3">
        {filteredResults.map((res) => {
          const dateObj = new Date(res.competitionDate);
          const formattedDate = !isNaN(dateObj.getTime())
            ? dateObj.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
            : res.competitionDate;

          return (
            <div
              key={res.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Left Info: Data, Local, Descrição */}
              <div className="space-y-2 flex-1 min-w-0">
                {/* Meta Header: Data & Local */}
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  {/* Data */}
                  <span className="inline-flex items-center gap-1.5 font-extrabold text-slate-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>{formattedDate}</span>
                  </span>

                  {/* Local */}
                  {res.location && (
                    <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{res.location}</span>
                    </span>
                  )}
                </div>

                {/* Descrição / Título */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {res.title}
                  </h3>
                  {res.summary && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                      {res.summary}
                    </p>
                  )}
                </div>

                {/* PDF File Info indicator */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono pt-0.5">
                  <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="truncate">{res.pdfTitle || 'Classificacoes_Oficiais.pdf'}</span>
                </div>
              </div>

              {/* Right: Actions (Ver PDF, Download, Gestão) */}
              <div className="flex items-center justify-between md:justify-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
               

                {/* Ver PDF Original */}
                <button
                  type="button"
                  onClick={() => openOriginalDocument(res.pdfUrl, res.pdfTitle || `${res.title}.pdf`)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Abrir PDF original em novo separador"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ver PDF</span>
                  <ExternalLink className="w-3 h-3 text-blue-200" />
                </button>

                {/* Coach Edit & Delete */}
                {canManage && (
                  <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(res)}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                      title="Editar resultados"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResultToDelete(res);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar resultados"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredResults.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-base">Sem resultados encontrados</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nenhum registo corresponde à pesquisa efetuada.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deleting Result */}
      <ConfirmDeleteModal
        isOpen={resultToDelete !== null}
        onClose={() => setResultToDelete(null)}
        onConfirm={() => {
          if (resultToDelete) {
            deleteResult(resultToDelete.id);
            setResultToDelete(null);
          }
        }}
        title="Eliminar Resultados"
        itemTitle={resultToDelete?.title}
        description="Tem a certeza de que deseja eliminar definitivamente esta publicação de resultados? O ficheiro PDF associado deixará de estar acessível na lista."
        confirmText="Sim, Eliminar"
      />

      {/* Add / Edit Result Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-500" />
                {editingResult ? 'Editar Resultados' : 'Adicionar Resultados'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título da Competição / Prova *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-medium"
                  placeholder="Ex: Torneio Regional de Abertura"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Local</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-medium"
                    placeholder="Ex: Guimarães"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Descrição / Resumo dos Resultados</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-medium"
                  placeholder="Resumo das prestações, recordes pessoais batidos, classificações..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Link do Ficheiro PDF (URL) *</label>
                <input
                  type="url"
                  required
                  value={formPdfUrl}
                  onChange={(e) => setFormPdfUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-medium"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Ficheiro PDF</label>
                <input
                  type="text"
                  value={formPdfTitle}
                  onChange={(e) => setFormPdfTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-medium"
                  placeholder="Classificacoes_Oficiais.pdf"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                {editingResult ? (
                  <button
                    type="button"
                    onClick={() => {
                      const toDelete = editingResult;
                      setIsModalOpen(false);
                      setResultToDelete(toDelete);
                    }}
                    className="px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Eliminar este resultado"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-extrabold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {editingResult ? 'Guardar Alterações' : 'Guardar Resultados'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
