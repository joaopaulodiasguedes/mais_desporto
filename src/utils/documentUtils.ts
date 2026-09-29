/**
 * Utilitários para abertura e download de documentos originais (PDFs, imagens e ficheiros).
 * Suporta URLs web (http/https), Blob URLs e Data URLs em base64 (convertendo para Blob ObjectURL
 * para contornar o bloqueio de navegação a data: URLs em navegadores modernos).
 */

export const openOriginalDocument = (url: string, fileName?: string): boolean => {
  if (!url || !url.trim()) {
    console.warn('openOriginalDocument: URL vazia fornecida.');
    return false;
  }

  const cleanUrl = url.trim();

  // Tratamento específico para ficheiros em base64 (data:application/pdf;base64,...)
  if (cleanUrl.startsWith('data:')) {
    try {
      const parts = cleanUrl.split(',');
      if (parts.length >= 2) {
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        const newTab = window.open(blobUrl, '_blank', 'noopener,noreferrer');
        if (!newTab) {
          // Fallback se o navegador ou iframe bloquear window.open
          const a = document.createElement('a');
          a.href = blobUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          if (fileName) {
            a.download = fileName;
          }
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        // Limpa a URL do Blob após 2 minutos
        setTimeout(() => {
          try {
            URL.revokeObjectURL(blobUrl);
          } catch {
            // ignore
          }
        }, 120000);

        return true;
      }
    } catch (err) {
      console.error('Erro ao converter data URL em Blob para abertura direta:', err);
    }
  }

  // URLs web normais (http, https, blob)
  try {
    const newTab = window.open(cleanUrl, '_blank', 'noopener,noreferrer');
    if (!newTab) {
      const a = document.createElement('a');
      a.href = cleanUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    return true;
  } catch (err) {
    console.error('Erro ao abrir documento original:', err);
    const a = document.createElement('a');
    a.href = cleanUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }
};

export const downloadDocument = (url: string, fileName: string = 'documento.pdf') => {
  if (!url) return;

  if (url.startsWith('data:')) {
    try {
      const parts = url.split(',');
      if (parts.length >= 2) {
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const byteCharacters = atob(parts[1]);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        return;
      }
    } catch (err) {
      console.error('Erro ao descarregar documento base64:', err);
    }
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
