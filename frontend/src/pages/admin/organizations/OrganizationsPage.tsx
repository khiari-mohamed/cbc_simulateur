import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Edit, Trash2, CheckCircle, XCircle, Users, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

export const OrganizationsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', joinKey: '' });
  const [generatedKey, setGeneratedKey] = useState('');

  const generateJoinKey = () => {
    const words = [
      'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
      'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
      'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'Xray', 'Yankee', 'Zulu'
    ];
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-4);
    const key = `${word1}-${word2}-${num}${timestamp}`;
    setFormData({ ...formData, joinKey: key });
    setGeneratedKey(key);
  };

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['client-organizations'],
    queryFn: async () => {
      const { data } = await api.get('/client-organizations');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; code: string; joinKey: string }) => 
      editingOrg ? api.put(`/client-organizations/${editingOrg.id}`, { name: data.name, code: data.code }) : api.post('/client-organizations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-organizations'] });
      toast.success(editingOrg ? 'Organisation modifiée' : 'Organisation créée');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/client-organizations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-organizations'] });
      toast.success('Organisation désactivée');
    },
    onError: () => toast.error('Erreur'),
  });

  const openModal = (org?: any) => {
    if (org) {
      setEditingOrg(org);
      setFormData({ name: org.name, code: org.code, joinKey: '' });
      setGeneratedKey('');
    } else {
      setEditingOrg(null);
      setFormData({ name: '', code: '', joinKey: '' });
      setGeneratedKey('');
      generateJoinKey();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOrg(null);
    setFormData({ name: '', code: '', joinKey: '' });
    setGeneratedKey('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Organisations Clientes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez les organisations clientes (ex: ATB Bank, Entreprise X)
          </p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          <span className="whitespace-nowrap">Nouvelle Organisation</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations?.map((org: any) => (
          <div
            key={org.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{org.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Code: {org.code}</p>
                </div>
              </div>
              {org.isActive ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-gray-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Utilisateurs</p>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {org._count?.users || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Conventions</p>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {org._count?.conventions || 0}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openModal(org)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Modifier
              </Button>
              {org.isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Désactiver cette organisation ?')) {
                      deactivateMutation.mutate(org.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {organizations?.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune organisation
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Créez une organisation cliente pour commencer
          </p>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une organisation
          </Button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingOrg ? 'Modifier l\'organisation' : 'Nouvelle organisation'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Nom de l'organisation *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: ATB Bank"
                required
              />
              <Input
                label="Code *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: ATB"
                required
                disabled={!!editingOrg}
              />
              {!editingOrg && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Clé d'accès (Join Key) *
                    </label>
                    <button
                      type="button"
                      onClick={generateJoinKey}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      🔄 Régénérer
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={formData.joinKey}
                    onChange={(e) => setFormData({ ...formData, joinKey: e.target.value })}
                    placeholder="Clé secrète auto-générée"
                    required
                    readOnly
                  />
                  {generatedKey && (
                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                      <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                        ⚠️ IMPORTANT: Copiez cette clé maintenant!
                      </p>
                      <p className="text-xs text-yellow-800 dark:text-yellow-300">
                        Partagez le <strong>Code: {formData.code || '...'}</strong> et <strong>Clé: {generatedKey}</strong> avec les membres de l'organisation.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {editingOrg && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Le code ne peut pas être modifié
                </p>
              )}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" loading={createMutation.isPending} className="flex-1">
                  {editingOrg ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
