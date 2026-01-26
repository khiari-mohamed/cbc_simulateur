import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, File, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import api from '../../lib/api/client';
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 50MB)');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quoteId', quoteId);
    formData.append('type', selectedType);
    uploadMutation.mutate(formData);
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
    </Card>
  );
};
