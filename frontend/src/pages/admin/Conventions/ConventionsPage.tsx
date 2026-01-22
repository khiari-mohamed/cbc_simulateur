import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Edit, Trash2, Users, CheckCircle, XCircle, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConventionModal } from '../../../components/admin/ConventionModal';
import { AssignUsersModal } from '../../../components/admin/AssignUsersModal';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';
import type { Convention } from '../../../types';

export const ConventionsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingConvention, setEditingConvention] = useState<Convention | null>(null);
  const [selectedConvention, setSelectedConvention] = useState<Convention | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const queryClient = useQueryClient();

  const { data: conventions, isLoading } = useQuery({
    queryKey: ['conventions', includeInactive],
    queryFn: async () => {
      const { data } = await api.get(`/conventions?includeInactive=${includeInactive}`);
      return data as Convention[];
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/conventions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      toast.success('Convention désactivée');
    },
    onError: () => toast.error('Erreur lors de la désactivation'),
  });

  const handleEdit = (convention: Convention) => {
    setEditingConvention(convention);
    setIsModalOpen(true);
  };

  const handleAssignUsers = (convention: Convention) => {
    setSelectedConvention(convention);
    setIsAssignModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingConvention(null);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedConvention(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conventions</h1>
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              MODULE PROTÉGÉ
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gérez les conventions spécifiques par compagnie
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle Convention
        </Button>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Afficher les conventions inactives
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {conventions?.map((convention) => (
          <div
            key={convention.id}
            className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 ${
              convention.isActive ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 dark:border-red-900'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{convention.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{convention.company.name}</p>
                </div>
              </div>
              {convention.isActive ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Utilisateurs</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {convention._count?.users || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Simulations</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {convention._count?.simulations || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Règles</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {convention._count?.pricingRules || 0}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAssignUsers(convention)}
                className="flex-1"
              >
                <Users className="w-3 h-3 mr-1" />
                Utilisateurs
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(convention)}
              >
                <Edit className="w-3 h-3" />
              </Button>
              {convention.isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deactivateMutation.mutate(convention.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {conventions?.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune convention
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Créez une convention pour associer des utilisateurs à des compagnies
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une convention
          </Button>
        </div>
      )}

      <ConventionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        convention={editingConvention}
      />

      <AssignUsersModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        convention={selectedConvention}
      />
    </div>
  );
};
