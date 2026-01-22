import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Shield, Percent, Users, Save } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

export const AdminSettingsPage = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const { data: optionalGuaranteesRules } = useQuery({
    queryKey: ['pricing-rules', 'optional'],
    queryFn: async () => {
      const { data } = await api.get('/pricing-rules/optional-guarantees');
      return data;
    },
  });

  const toggle2FAMutation = useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) =>
      api.post('/users/toggle-2fa', { userId, enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('2FA mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const updateReductionMutation = useMutation({
    mutationFn: ({ ruleId, reductionRate }: { ruleId: string; reductionRate: number }) =>
      api.patch(`/pricing-rules/${ruleId}/reduction-rate`, { reductionRate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast.success('Taux de réduction mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings className="w-8 h-8" />
              Paramètres Administrateur
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Configuration système et gestion des paramètres protégés
          </p>
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <strong>Module protégé :</strong> Ces paramètres sont modifiables uniquement par l'administrateur ARS. Toute modification impacte les tarifs légaux et les tarifs internes des compagnies.
            </p>
          </div>
        </div>

        {/* 2FA Management Section */}
        <Card className="mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Gestion de l'authentification à deux facteurs (2FA)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Activer ou désactiver le 2FA pour les utilisateurs
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {users?.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        user.otpEnabled
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {user.otpEnabled ? '2FA Activé' : '2FA Désactivé'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toggle2FAMutation.mutate({
                          userId: user.id,
                          enabled: !user.otpEnabled,
                        })
                      }
                      loading={toggle2FAMutation.isPending}
                    >
                      {user.otpEnabled ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Reduction Rates Management */}
        <Card>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Taux de réduction - Garanties facultatives
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configurer les taux de réduction pour Tous Risques, Dommages Collision, Vol, Incendie
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {optionalGuaranteesRules?.map((rule: any) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {rule.company.name} - {rule.guarantee.nameFr}
                    </p>
                    {rule.convention && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Convention: {rule.convention.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      defaultValue={rule.reductionRate || 100}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value !== rule.reductionRate) {
                          updateReductionMutation.mutate({
                            ruleId: rule.id,
                            reductionRate: value,
                          });
                        }
                      }}
                    />
                    <span className="text-gray-600 dark:text-gray-400">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
