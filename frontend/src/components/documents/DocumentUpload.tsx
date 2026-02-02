import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, File, CheckCircle, XCircle, Loader2, AlertCircle, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import api, { getApiBaseUrl } from '../../lib/api/client';
import toast from 'react-hot-toast';

interface DocumentUploadProps {
  quoteId: string;
  readonly?: boolean;
}

// Fetch required document types from backend (authoritative)
const useRequiredDocTypes = () => {
  const { data } = useQuery({
    queryKey: ['documents', 'required-types'],
    queryFn: async () => {
      const { data } = await api.get('/documents/required-types');
      return data as { type: string; label: string; required: boolean }[];
    },
  });
  return data || [];
};

export const DocumentUpload = ({ quoteId, readonly = false }: DocumentUploadProps) => {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [customerType, setCustomerType] = useState<'PARTICULIER' | 'SOCIETE' | null>(null);
  const [documentTypes, setDocumentTypes] = useState<{ value: string; label: string; required: boolean }[]>([]);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; name: string } | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', quoteId],
    queryFn: async () => {
      const { data } = await api.get(`/documents/quote/${quoteId}`);
      return data;
    },
  });

  // Fetch quote to determine customer type
  const { data: quote } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const { data } = await api.get(`/quotes/${quoteId}`);
      return data;
    },
    enabled: !!quoteId,
  });

  const requiredTypes = useRequiredDocTypes();

  // Determine available document types (no hardcoding, backend-driven)
  useEffect(() => {
    if (quote) {
      // Current backend does not expose customer type; keep neutral list from backend
      setCustomerType(null);
      const mapped = requiredTypes.map((t) => ({ value: t.type, label: t.label, required: t.required }));
      setDocumentTypes(mapped);
      if (mapped.length > 0) setSelectedType(mapped[0].value);
    }
  }, [quote, requiredTypes]);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', quoteId] });
      toast.success('Document téléchargé avec succès');
      setUploading(false);
    },
    onError: () => {
      toast.error('Erreur lors du téléchargement');
      setUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docType?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 50MB)');
      e.target.value = ''; // Reset input
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quoteId', quoteId);
    formData.append('type', docType || selectedType);
    uploadMutation.mutate(formData);
    e.target.value = ''; // Reset input after upload
  };

  const handleView = (docId: string) => {
    setViewingDoc(docId);
  };

  const handleReplace = (docId: string) => {
    document.getElementById(`replace-${docId}`)?.click();
  };

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.delete(`/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', quoteId] });
      toast.success('Document supprimé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const handleDelete = (docId: string, docName: string) => {
    setDeletingDoc({ id: docId, name: docName });
  };

  const confirmDelete = () => {
    if (deletingDoc) {
      deleteMutation.mutate(deletingDoc.id);
      setDeletingDoc(null);
    }
  };

  const getStatusIcon = (isValidated: boolean) => {
    return isValidated ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-orange-600" />
    );
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Documents justificatifs
        </h3>
        {customerType && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>
              Documents requis pour {customerType === 'SOCIETE' ? 'une entreprise' : 'un particulier'}
            </span>
          </div>
        )}
      </div>

      {!readonly && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de document
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                    {type.required && ' *'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <Button 
                type="button" 
                disabled={uploading} 
                onClick={() => document.getElementById('file-upload')?.click()}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Uploader
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Formats acceptés: PDF, JPG, PNG (max 50MB)
          </p>
        </div>
      )}

      {/* Required documents checklist */}
      {!readonly && documentTypes.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-3">
            Documents obligatoires:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {documentTypes
              .filter((t) => t.required)
              .map((type) => {
                const isUploaded = documents?.some((doc: any) => doc.type === type.value);
                return (
                  <div key={type.value} className="flex items-center gap-2">
                    {isUploaded ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm text-amber-900 dark:text-amber-200">
                      {type.label}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc: any) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {documentTypes.find((t) => t.value === doc.type)?.label || doc.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(doc.isValidated)}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {doc.isValidated ? 'Validé' : 'En attente'}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(doc.id)}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Voir
                </Button>
                {!readonly && (
                  <>
                    <input
                      id={`replace-${doc.id}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, doc.type)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleReplace(doc.id)}
                      disabled={uploading}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Remplacer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id, doc.fileName)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun document téléchargé</p>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setViewingDoc(null)}>
          <div className="relative w-11/12 h-5/6 bg-white dark:bg-gray-800 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aperçu du document</h3>
              <button
                onClick={() => setViewingDoc(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="w-full h-full p-4">
              <iframe
                src={`${getApiBaseUrl()}/documents/${viewingDoc}/view?token=${localStorage.getItem('access_token')}`}
                className="w-full h-full border-0 rounded"
                title="Document viewer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setDeletingDoc(null)}>
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supprimer le document</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer <span className="font-semibold">{deletingDoc.name}</span> ?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingDoc(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
