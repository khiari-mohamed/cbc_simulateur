import { useQuery } from '@tanstack/react-query';
import { FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardBody, CardTitle } from '../components/ui/Card';
import api from '../lib/api/client';

export const DocumentsPage = () => {
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
    { type: 'VISITE_TECHNIQUE', label: 'Visite technique' },
    { type: 'VIGNETTE', label: 'Vignette' },
  ];

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
            <div className="space-y-3">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {doc.fileName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {requiredDocs.find(d => d.type === doc.type)?.label || doc.type}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Téléchargé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.isValidated ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Validé
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-orange-600" />
                        <span className="text-sm text-orange-600 dark:text-orange-400">
                          En attente
                        </span>
                      </>
                    )}
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
    </div>
  );
};
