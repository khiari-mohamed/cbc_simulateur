import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle, XCircle, AlertCircle, Eye, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardBody, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api, { getApiBaseUrl } from '../lib/api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';

export const DocumentsPage = () => {
  const queryClient = useQueryClient();
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; name: string } | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', 'my'],
    queryFn: async () => {
      const { data } = await api.get('/documents/my');
      return data;
    },
  });

  const requiredDocs = [
    { type: 'CIN', label: 'Carte d\'identité nationale' },
    { type: 'CARTE_GRISE', label: 'Carte grise' },
    { type: 'PERMIS', label: 'Permis de conduire' },
    { type: 'VISITE_TECHNIQUE', label: 'Visite technique' },
    { type: 'VIGNETTE', label: 'Vignette' },
    { type: 'RNE', label: 'RNE' },
  ];

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.delete(`/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'my'] });
      toast.success('Document supprimé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const handleView = (docId: string) => {
    setViewingDoc(docId);
  };

  const handleReplace = (docId: string) => {
    document.getElementById(`replace-${docId}`)?.click();
  };

  const handleDelete = (docId: string, docName: string) => {
    setDeletingDoc({ id: docId, name: docName });
  };

  const confirmDelete = () => {
    if (deletingDoc) {
      deleteMutation.mutate(deletingDoc.id);
      setDeletingDoc(null);
    }
  };

  const uploadedTypes = documents?.map((d: any) => d.type) || [];
  const missingDocs = requiredDocs.filter(doc => !uploadedTypes.includes(doc.type));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Mes Documents
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          Gérez vos documents justificatifs
        </p>
      </div>

      {missingDocs.length > 0 && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                Documents manquants ({missingDocs.length})
              </p>
              <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                {missingDocs.map(doc => (
                  <li key={doc.type}>• {doc.label}</li>
                ))}
              </ul>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-3">
                💡 Vous pourrez télécharger ces documents lors de la soumission d'un devis
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Documents téléchargés</CardTitle>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {requiredDocs.find(d => d.type === doc.type)?.label || doc.type}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Téléchargé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {doc.isValidated ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-orange-600" />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {doc.isValidated ? 'Validé' : 'En attente'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(doc.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </Button>
                    <input
                      id={`replace-${doc.id}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReplace(doc.id)}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Remplacer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id, doc.fileName)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                Aucun document téléchargé
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Les documents seront téléchargés lors de la soumission d'un devis
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>ℹ️ Information :</strong> Les documents sont requis lors de la soumission d'un devis.
          Vous pourrez les télécharger à l'étape de confirmation de votre simulation.
        </p>
      </div>

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
                variant="outline"
                onClick={() => setDeletingDoc(null)}
              >
                Annuler
              </Button>
              <Button
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
    </div>
  );
};
