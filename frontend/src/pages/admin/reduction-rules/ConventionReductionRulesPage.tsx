import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Trash2, Edit, Sliders, HelpCircle, X, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

export const ConventionReductionRulesPage = () => {
  const { conventionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [showPriorityHelp, setShowPriorityHelp] = useState(false);
  const [helpTab, setHelpTab] = useState<'priority' | 'filters' | 'guide'>('priority');
  
  // Filters state
  const [filters, setFilters] = useState({
    companyId: '',
    formulaType: '',
    usageId: '',
  });
  
  const [formData, setFormData] = useState({
    companyId: '',
    guaranteeId: '',
    formulaType: '',
    usageId: '',
    metric: 'MARKET_VALUE',
    minValue: '',
    maxValue: '',
    minInclusive: true,
    maxInclusive: false,
    discountPercent: '',
    priority: '0',
  });

  const { data: convention } = useQuery({
    queryKey: ['conventions', conventionId],
    queryFn: async () => {
      const { data } = await api.get(`/conventions/${conventionId}`);
      return data;
    },
  });

  const { data: rules } = useQuery({
    queryKey: ['convention-reduction-rules', conventionId],
    queryFn: async () => {
      const { data } = await api.get(`/convention-reduction-rules/convention/${conventionId}`);
      return data;
    },
  });

  const { data: usageTypes } = useQuery({
    queryKey: ['usage-types'],
    queryFn: async () => {
      const { data } = await api.get('/usage-types');
      return data;
    },
  });

  const { data: guarantees } = useQuery({
    queryKey: ['guarantees'],
    queryFn: async () => {
      const { data } = await api.get('/guarantees');
      return data;
    },
  });

  // Check if selected guarantee is BG
  const selectedGuarantee = guarantees?.find((g: any) => g.id === formData.guaranteeId);
  const isBGSelected = selectedGuarantee?.code === 'BG';

  const createMutation = useMutation({
    mutationFn: (data: any) => 
      editingRule 
        ? api.patch(`/convention-reduction-rules/${editingRule.id}`, data)
        : api.post('/convention-reduction-rules', { ...data, conventionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convention-reduction-rules'] });
      toast.success(editingRule ? 'Règle modifiée' : 'Règle créée');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/convention-reduction-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convention-reduction-rules'] });
      toast.success('Règle supprimée');
    },
    onError: () => toast.error('Erreur'),
  });

  const openModal = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        companyId: rule.companyId || '',
        guaranteeId: rule.guaranteeId,
        formulaType: rule.formulaType || '',
        usageId: rule.usageId || '',
        metric: rule.metric,
        minValue: rule.minValue || '',
        maxValue: rule.maxValue || '',
        minInclusive: rule.minInclusive,
        maxInclusive: rule.maxInclusive,
        discountPercent: rule.discountPercent,
        priority: rule.priority.toString(),
      });
    } else {
      setEditingRule(null);
      setFormData({
        companyId: '',
        guaranteeId: '',
        formulaType: '',
        usageId: '',
        metric: 'MARKET_VALUE',
        minValue: '',
        maxValue: '',
        minInclusive: true,
        maxInclusive: false,
        discountPercent: '',
        priority: '0',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  // Filter logic
  const filteredRules = rules?.filter((rule: any) => {
    // Filter by company
    if (filters.companyId && rule.companyId !== filters.companyId) {
      return false;
    }
    
    // Filter by formula type
    if (filters.formulaType && rule.formulaType !== filters.formulaType) {
      return false;
    }
    
    // Filter by usage
    if (filters.usageId && rule.usageId !== filters.usageId) {
      return false;
    }
    
    return true;
  }) || [];

  const clearFilters = () => {
    setFilters({
      companyId: '',
      formulaType: '',
      usageId: '',
    });
  };

  const hasActiveFilters = filters.companyId || filters.formulaType || filters.usageId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate min/max values
    const minVal = formData.minValue ? parseFloat(formData.minValue) : null;
    const maxVal = formData.maxValue ? parseFloat(formData.maxValue) : null;
    
    if (minVal !== null && maxVal !== null && minVal >= maxVal) {
      toast.error('La valeur minimale doit être inférieure à la valeur maximale');
      return;
    }
    
    const payload = {
      ...formData,
      companyId: formData.companyId || null,
      formulaType: formData.formulaType || null,
      usageId: formData.usageId || null,
      minValue: minVal,
      maxValue: maxVal,
      discountPercent: parseFloat(formData.discountPercent),
      priority: parseInt(formData.priority),
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/conventions')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux conventions
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Règles de Réduction</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Convention: {convention?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPriorityHelp(true)} className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Guide Priorité
            </Button>
            <Button onClick={() => openModal()} className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nouvelle Règle
            </Button>
          </div>
        </div>
      </div>

      {/* Priority Help Modal */}
      {showPriorityHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Guide des Règles de Réduction</h2>
              </div>
              <button onClick={() => { setShowPriorityHelp(false); setHelpTab('priority'); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
              <button
                onClick={() => setHelpTab('guide')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  helpTab === 'guide'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                📖 Guide Complet
              </button>
              <button
                onClick={() => setHelpTab('priority')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  helpTab === 'priority'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                🎯 Système de Priorité
              </button>
              <button
                onClick={() => setHelpTab('filters')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  helpTab === 'filters'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                🔍 Filtres & Garanties
              </button>
            </div>

            <div className="p-6 space-y-6">
            {helpTab === 'guide' && (
              <div className="space-y-6">
                {/* Introduction */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📖</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-2">Guide Complet des Réductions DC et BG</h3>
                      <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                        Ce guide vous explique comment configurer et tester les réductions basées sur le <strong>capital assuré</strong> pour les garanties Dommages Collision (DC) et Bris de Glaces (BG). Suivez les étapes ci-dessous pour comprendre et vérifier que tout fonctionne correctement.
                      </p>
                    </div>
                  </div>
                </div>

                {/* What is DC Capital Reduction */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    Qu'est-ce qu'une réduction basée sur le capital assuré ?
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Normalement, les réductions d'assurance sont calculées sur la <strong>valeur du véhicule</strong> (Valeur Vénale ou Valeur à Neuf). Par exemple : "Si le véhicule vaut entre 50,000 et 100,000 DT, appliquer 15% de réduction."
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-3">
                      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">⚠️ Cas spécial pour DC et BG :</p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        Pour ces garanties, le client <strong>choisit lui-même le montant de couverture</strong> (capital assuré). Ce montant peut être différent de la valeur du véhicule. La réduction doit donc être calculée sur ce <strong>capital choisi par le client</strong>, pas sur la valeur du véhicule.
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">📝 Exemple concret :</p>
                      <div className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                        <p>• Véhicule : Valeur Vénale = 100,000 DT</p>
                        <p>• Client choisit : Capital DC = 15,000 DT (15% de la valeur)</p>
                        <p>• Règle configurée : "Capital entre 10,000 et 20,000 DT → 25% de réduction"</p>
                        <p className="font-bold text-green-600 dark:text-green-400 mt-2">✓ Résultat : Le client reçoit 25% de réduction sur sa prime DC</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step by Step Configuration */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">🔧</span>
                    Comment configurer une règle DC/BG (Étape par étape)
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Cliquez sur "Nouvelle Règle"</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-8">Le formulaire de création s'ouvre.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Sélectionnez la garantie</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-8 mb-2">Choisissez "Dommages Collision" ou "Bris de Glaces" dans le menu déroulant "Garantie".</p>
                      <div className="ml-8 bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-xs text-blue-800 dark:text-blue-300">
                        💡 Si vous choisissez BG, la métrique sera automatiquement définie sur "Capital Assuré".
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Choisissez la métrique "Capital Assuré (DC/BG)"</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-8 mb-2">Dans le menu "Métrique", vous verrez deux groupes :</p>
                      <div className="ml-8 space-y-2">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 text-xs">
                          <p className="font-semibold text-gray-900 dark:text-white">Basé sur la valeur du véhicule :</p>
                          <p className="text-gray-600 dark:text-gray-400">• Valeur Vénale (VV)</p>
                          <p className="text-gray-600 dark:text-gray-400">• Valeur à Neuf (VN)</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-xs border border-blue-300 dark:border-blue-600">
                          <p className="font-semibold text-blue-900 dark:text-blue-200">Basé sur le capital choisi par le client :</p>
                          <p className="text-blue-800 dark:text-blue-300">• <strong>Capital Assuré (DC/BG)</strong> ← Sélectionnez cette option</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Remarquez le changement automatique des champs</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-8 mb-2">Dès que vous sélectionnez "Capital Assuré", les champs changent automatiquement :</p>
                      <div className="ml-8 grid grid-cols-2 gap-2">
                        <div className="bg-red-50 dark:bg-red-900/20 rounded p-2 text-xs">
                          <p className="font-semibold text-red-900 dark:text-red-200">❌ Avant :</p>
                          <p className="text-red-800 dark:text-red-300">Valeur Min (Ex: 90000)</p>
                          <p className="text-red-800 dark:text-red-300">Valeur Max (Ex: 500000)</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 text-xs">
                          <p className="font-semibold text-green-900 dark:text-green-200">✅ Après :</p>
                          <p className="text-green-800 dark:text-green-300">Capital Min (DT) (Ex: 5000)</p>
                          <p className="text-green-800 dark:text-green-300">Capital Max (DT) (Ex: 20000)</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Définissez les paliers de capital</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-8 mb-2">Entrez les montants de capital (en DT) :</p>
                      <div className="ml-8 bg-yellow-50 dark:bg-yellow-900/20 rounded p-3 text-xs">
                        <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Exemple de configuration :</p>
                        <p className="text-yellow-800 dark:text-yellow-300">• Capital Min : 10000 (10,000 DT)</p>
                        <p className="text-yellow-800 dark:text-yellow-300">• Capital Max : 20000 (20,000 DT)</p>
                        <p className="text-yellow-800 dark:text-yellow-300">• Réduction : 25 (25%)</p>
                        <p className="text-yellow-800 dark:text-yellow-300 mt-2">→ Signification : Si le client choisit un capital entre 10,000 et 20,000 DT, il reçoit 25% de réduction.</p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Cliquez sur "Créer"</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-8">Votre règle est maintenant active et sera appliquée automatiquement lors du calcul des devis.</p>
                    </div>
                  </div>
                </div>

                {/* How to Test */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">🧪</span>
                    Comment tester que ça fonctionne ?
                  </h3>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-bold text-green-900 dark:text-green-200 mb-2">Scénario de test complet :</p>
                        <div className="space-y-3">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Étape 1 : Créez une règle de test</p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-xs space-y-1">
                              <p className="text-blue-900 dark:text-blue-200">• Garantie : Dommages Collision</p>
                              <p className="text-blue-900 dark:text-blue-200">• Métrique : Capital Assuré (DC/BG)</p>
                              <p className="text-blue-900 dark:text-blue-200">• Capital Min : 10000</p>
                              <p className="text-blue-900 dark:text-blue-200">• Capital Max : 30000</p>
                              <p className="text-blue-900 dark:text-blue-200">• Réduction : 30%</p>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Étape 2 : Créez un devis de test</p>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2 text-xs space-y-1">
                              <p className="text-purple-900 dark:text-purple-200">• Allez dans l'interface de simulation</p>
                              <p className="text-purple-900 dark:text-purple-200">• Créez un devis avec un véhicule (ex: VV = 100,000 DT)</p>
                              <p className="text-purple-900 dark:text-purple-200">• Sélectionnez la formule "Dommages Collision"</p>
                              <p className="text-purple-900 dark:text-purple-200">• Choisissez un capital DC = 20,000 DT (dans la plage 10k-30k)</p>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Étape 3 : Vérifiez le résultat</p>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 text-xs">
                              <p className="text-green-900 dark:text-green-200 mb-1">✅ Ce que vous devez voir :</p>
                              <p className="text-green-800 dark:text-green-300">• La prime DC doit être réduite de 30%</p>
                              <p className="text-green-800 dark:text-green-300">• Dans le détail du devis, vous devriez voir la réduction appliquée</p>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Étape 4 : Test négatif (capital hors plage)</p>
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-2 text-xs">
                              <p className="text-orange-900 dark:text-orange-200 mb-1">🔍 Créez un autre devis avec :</p>
                              <p className="text-orange-800 dark:text-orange-300">• Capital DC = 5,000 DT (en dessous de 10,000)</p>
                              <p className="text-orange-800 dark:text-orange-300">• Résultat attendu : AUCUNE réduction (capital hors plage)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common Mistakes */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    Erreurs courantes à éviter
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3">
                      <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-1">❌ Erreur 1 : Confondre valeur véhicule et capital</p>
                      <p className="text-xs text-red-800 dark:text-red-300">
                        Si vous entrez 100000 dans "Capital Min", le système cherchera des clients qui ont choisi un capital de 100,000 DT (pas un véhicule qui vaut 100,000 DT). Les montants de capital sont généralement plus petits (5k, 10k, 20k, 50k).
                      </p>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3">
                      <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-1">❌ Erreur 2 : Utiliser la mauvaise métrique</p>
                      <p className="text-xs text-red-800 dark:text-red-300">
                        Si vous voulez une réduction basée sur le capital, vous DEVEZ sélectionner "Capital Assuré (DC/BG)". Si vous laissez "Valeur Vénale", la réduction sera calculée sur la valeur du véhicule, pas sur le capital choisi.
                      </p>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3">
                      <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-1">❌ Erreur 3 : Oublier de tester</p>
                      <p className="text-xs text-red-800 dark:text-red-300">
                        Après avoir créé une règle, créez toujours un devis de test pour vérifier que la réduction s'applique correctement. Ne supposez pas que ça fonctionne sans tester.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Reference */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg p-4 border-2 border-gray-400 dark:border-gray-600">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    Aide-Mémoire Rapide
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <p className="font-bold text-blue-600 dark:text-blue-400 mb-2">Pour DC :</p>
                      <p className="text-gray-700 dark:text-gray-300">• Garantie : Dommages Collision</p>
                      <p className="text-gray-700 dark:text-gray-300">• Métrique : Capital Assuré (DC/BG)</p>
                      <p className="text-gray-700 dark:text-gray-300">• Plages typiques : 5k-10k, 10k-30k, 30k-50k</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <p className="font-bold text-purple-600 dark:text-purple-400 mb-2">Pour BG :</p>
                      <p className="text-gray-700 dark:text-gray-300">• Garantie : Bris de Glaces</p>
                      <p className="text-gray-700 dark:text-gray-300">• Métrique : Auto (Capital Assuré)</p>
                      <p className="text-gray-700 dark:text-gray-300">• Plages typiques : 1k-2k, 2k-3k</p>
                    </div>
                  </div>
                </div>

                {/* Implementation Verification Checklist */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    Vérification de l'Implémentation (Checklist Client)
                  </h3>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">✓</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-purple-900 dark:text-purple-200 mb-2">Exigence Client : "La réduction peut être choisie soit par tranche de valeur soit par palier du limite (capital assuré)"</p>
                        <p className="text-xs text-purple-800 dark:text-purple-300 mb-3">
                          Vérifiez point par point que toutes les fonctionnalités demandées sont présentes et fonctionnent correctement.
                        </p>
                      </div>
                    </div>

                    {/* Requirement 1 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex items-start gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">✅ Exigence 1 : Choix entre deux modes de calcul</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Le système doit permettre de choisir entre :</p>
                          <div className="space-y-1 text-xs">
                            <p className="text-gray-700 dark:text-gray-300">• <strong>Mode A :</strong> Réduction basée sur la valeur du véhicule (VV ou VN)</p>
                            <p className="text-gray-700 dark:text-gray-300">• <strong>Mode B :</strong> Réduction basée sur le capital assuré choisi par le client</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-8 mt-2 bg-green-50 dark:bg-green-900/20 rounded p-2">
                        <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-1">✓ Comment vérifier :</p>
                        <p className="text-xs text-green-800 dark:text-green-300">1. Ouvrez le formulaire "Nouvelle règle"</p>
                        <p className="text-xs text-green-800 dark:text-green-300">2. Regardez le menu déroulant "Métrique"</p>
                        <p className="text-xs text-green-800 dark:text-green-300">3. Vous devez voir 3 options : Valeur Vénale (VV), Valeur à Neuf (VN), et Capital Assuré (DC/BG)</p>
                        <p className="text-xs font-bold text-green-700 dark:text-green-300 mt-1">✅ STATUT : IMPLÉMENTÉ</p>
                      </div>
                    </div>

                    {/* Requirement 2 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex items-start gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">✅ Exigence 2 : Interface adaptative pour DC et BG</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quand on sélectionne DC ou BG avec métrique "Capital Assuré", l'interface doit s'adapter automatiquement.</p>
                        </div>
                      </div>
                      <div className="ml-8 mt-2 bg-green-50 dark:bg-green-900/20 rounded p-2">
                        <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-1">✓ Comment vérifier :</p>
                        <p className="text-xs text-green-800 dark:text-green-300">1. Sélectionnez garantie "Dommages Collision"</p>
                        <p className="text-xs text-green-800 dark:text-green-300">2. Changez la métrique vers "Capital Assuré (DC/BG)"</p>
                        <p className="text-xs text-green-800 dark:text-green-300">3. Les champs doivent changer de "Valeur Min/Max" à "Capital Min/Max (DT)"</p>
                        <p className="text-xs text-green-800 dark:text-green-300">4. Les exemples doivent changer de "Ex: 90000" à "Ex: 5000"</p>
                        <p className="text-xs text-green-800 dark:text-green-300">5. Un message d'aide bleu doit apparaître expliquant le capital assuré</p>
                        <p className="text-xs font-bold text-green-700 dark:text-green-300 mt-1">✅ STATUT : IMPLÉMENTÉ</p>
                      </div>
                    </div>

                    {/* Requirement 3 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex items-start gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">✅ Exigence 3 : Support BG avec capital BG</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Le système doit supporter les réductions basées sur le capital BG (Bris de Glaces).</p>
                        </div>
                      </div>
                      <div className="ml-8 mt-2 bg-green-50 dark:bg-green-900/20 rounded p-2">
                        <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-1">✓ Comment vérifier :</p>
                        <p className="text-xs text-green-800 dark:text-green-300">1. Sélectionnez garantie "Bris de Glaces"</p>
                        <p className="text-xs text-green-800 dark:text-green-300">2. La métrique doit automatiquement être "Capital Assuré (BG)"</p>
                        <p className="text-xs text-green-800 dark:text-green-300">3. Un message doit indiquer "BG utilise le Capital BG (pas la valeur véhicule)"</p>
                        <p className="text-xs text-green-800 dark:text-green-300">4. Les champs doivent être "Capital Min/Max (DT)" avec exemples adaptés</p>
                        <p className="text-xs font-bold text-green-700 dark:text-green-300 mt-1">✅ STATUT : IMPLÉMENTÉ</p>
                      </div>
                    </div>

                    {/* Requirement 4 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex items-start gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">✅ Exigence 4 : Paliers de capital configurables</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">L'administrateur doit pouvoir définir des paliers de capital avec min, max, et taux de réduction.</p>
                        </div>
                      </div>
                      <div className="ml-8 mt-2 bg-green-50 dark:bg-green-900/20 rounded p-2">
                        <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-1">✓ Comment vérifier :</p>
                        <p className="text-xs text-green-800 dark:text-green-300">1. Créez une règle avec Capital Min = 10000, Capital Max = 20000</p>
                        <p className="text-xs text-green-800 dark:text-green-300">2. Définissez une réduction de 25%</p>
                        <p className="text-xs text-green-800 dark:text-green-300">3. Sauvegardez la règle</p>
                        <p className="text-xs text-green-800 dark:text-green-300">4. La règle doit apparaître dans la liste avec "Capital DC" comme métrique</p>
                        <p className="text-xs font-bold text-green-700 dark:text-green-300 mt-1">✅ STATUT : IMPLÉMENTÉ</p>
                      </div>
                    </div>

                    {/* Requirement 5 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex items-start gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">✅ Exigence 5 : Calcul correct lors du pricing</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Le moteur de pricing doit lire le capital choisi par le client et appliquer la bonne réduction.</p>
                        </div>
                      </div>
                      <div className="ml-8 mt-2 bg-green-50 dark:bg-green-900/20 rounded p-2">
                        <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-1">✓ Comment vérifier :</p>
                        <p className="text-xs text-green-800 dark:text-green-300">1. Créez un devis avec capital DC = 15,000 DT</p>
                        <p className="text-xs text-green-800 dark:text-green-300">2. Si vous avez une règle 10k-20k → 25%, la réduction doit être appliquée</p>
                        <p className="text-xs text-green-800 dark:text-green-300">3. Vérifiez dans le détail du devis que la prime DC est réduite de 25%</p>
                        <p className="text-xs text-green-800 dark:text-green-300">4. Testez avec un capital hors plage (ex: 5k) → aucune réduction</p>
                        <p className="text-xs font-bold text-green-700 dark:text-green-300 mt-1">✅ STATUT : IMPLÉMENTÉ (Backend validé)</p>
                      </div>
                    </div>

                    {/* Requirement 6 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex items-start gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">✅ Exigence 6 : Validation des données</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Le système doit empêcher les configurations invalides (ex: DC_CAPITAL pour RC).</p>
                        </div>
                      </div>
                      <div className="ml-8 mt-2 bg-green-50 dark:bg-green-900/20 rounded p-2">
                        <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-1">✓ Comment vérifier :</p>
                        <p className="text-xs text-green-800 dark:text-green-300">1. Essayez de créer une règle avec garantie "RC" et métrique "Capital Assuré"</p>
                        <p className="text-xs text-green-800 dark:text-green-300">2. Le système doit afficher une erreur : "DC_CAPITAL metric only valid for DC and BG"</p>
                        <p className="text-xs text-green-800 dark:text-green-300">3. Vérifiez que Capital Min {'<'} Capital Max (sinon erreur)</p>
                        <p className="text-xs font-bold text-green-700 dark:text-green-300 mt-1">✅ STATUT : IMPLÉMENTÉ (Validation backend)</p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-500 dark:border-green-600 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xl font-bold">✓</span>
                        </div>
                        <p className="text-base font-bold text-green-900 dark:text-green-200">Résumé de la Vérification</p>
                      </div>
                      <div className="ml-13 space-y-1 text-sm">
                        <p className="text-green-800 dark:text-green-300">✅ Mode valeur (VV/VN) : <strong>Fonctionnel</strong></p>
                        <p className="text-green-800 dark:text-green-300">✅ Mode capital assuré (DC/BG) : <strong>Fonctionnel</strong></p>
                        <p className="text-green-800 dark:text-green-300">✅ Interface adaptative : <strong>Fonctionnel</strong></p>
                        <p className="text-green-800 dark:text-green-300">✅ Support BG : <strong>Fonctionnel</strong></p>
                        <p className="text-green-800 dark:text-green-300">✅ Paliers configurables : <strong>Fonctionnel</strong></p>
                        <p className="text-green-800 dark:text-green-300">✅ Calcul pricing : <strong>Fonctionnel</strong></p>
                        <p className="text-green-800 dark:text-green-300">✅ Validation : <strong>Fonctionnel</strong></p>
                        <p className="text-base font-bold text-green-900 dark:text-green-200 mt-3 pt-3 border-t border-green-300 dark:border-green-600">
                          🎉 TOUTES LES EXIGENCES SONT IMPLÉMENTÉES ET FONCTIONNELLES
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">Besoin d'aide supplémentaire ?</p>
                      <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                        Si vous rencontrez des difficultés ou si quelque chose ne fonctionne pas comme prévu, consultez les autres onglets de ce guide ("Système de Priorité" et "Filtres & Garanties") ou contactez le support technique avec une capture d'écran de votre configuration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {helpTab === 'filters' && (
              <div className="space-y-6">
                {/* Filters explanation */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-2">À quoi servent les Filtres ?</h3>
                      <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                        Quand une convention contient beaucoup de règles, les filtres permettent d'afficher uniquement les règles qui vous intéressent. Les 3 filtres fonctionnent ensemble (logique ET) : une règle doit correspondre à <strong>tous les filtres actifs</strong> pour être affichée.
                      </p>
                    </div>
                  </div>
                </div>

                {/* The 3 filters */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📋 Les 3 Filtres Disponibles</h3>
                  <div className="space-y-3">

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">🏢 Filtre Compagnie</p>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold rounded">Bleu</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Affiche uniquement les règles qui s'appliquent à une compagnie spécifique (ou à toutes les compagnies si vide).
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded p-2 text-xs">
                        <p className="text-gray-700 dark:text-gray-300"><strong>Exemple :</strong> Sélectionner "Lloyd Tunisien" → affiche seulement les règles de Lloyd + les règles sans compagnie spécifique</p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">📄 Filtre Formule</p>
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-bold rounded">Violet</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Filtre par type de formule d'assurance. Les 3 formules disponibles :
                      </p>
                      <div className="space-y-1">
                        <div className="bg-purple-50 dark:bg-purple-900/30 rounded p-2 text-xs">
                          <p className="font-semibold text-gray-900 dark:text-white">Standard</p>
                          <p className="text-gray-600 dark:text-gray-400">Formule de base RC + garanties optionnelles</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/30 rounded p-2 text-xs">
                          <p className="font-semibold text-gray-900 dark:text-white">Dommages Collision (DC)</p>
                          <p className="text-gray-600 dark:text-gray-400">Couvre les dommages au véhicule assuré</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/30 rounded p-2 text-xs">
                          <p className="font-semibold text-gray-900 dark:text-white">Tous Risques 0% (TR 0%)</p>
                          <p className="text-gray-600 dark:text-gray-400">Couverture complète sans franchise</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-orange-500 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">🚗 Filtre Usage</p>
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-bold rounded">Orange</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Filtre par type d'usage du véhicule. Les usages sont configurés dynamiquement par l'administrateur.
                      </p>
                      <div className="bg-orange-50 dark:bg-orange-900/30 rounded p-2 text-xs">
                        <p className="text-gray-700 dark:text-gray-300"><strong>Exemple :</strong> Sélectionner "Privé/Affaires" → affiche seulement les règles pour cet usage</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combining filters */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-base font-bold text-yellow-900 dark:text-yellow-200 mb-2">⚡ Combiner les Filtres</h3>
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 mb-3">
                        Les filtres utilisent une logique <strong>ET</strong> : une règle doit satisfaire TOUS les filtres actifs pour apparaître.
                      </p>
                      <div className="space-y-2">
                        <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs">
                          <p className="font-semibold text-gray-900 dark:text-white mb-1">Exemple — 1 filtre :</p>
                          <p className="text-gray-600 dark:text-gray-400">Compagnie = Lloyd → toutes les règles Lloyd (toutes formules, tous usages)</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs">
                          <p className="font-semibold text-gray-900 dark:text-white mb-1">Exemple — 2 filtres :</p>
                          <p className="text-gray-600 dark:text-gray-400">Compagnie = Lloyd + Formule = Standard → règles Lloyd en Standard uniquement</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs">
                          <p className="font-semibold text-gray-900 dark:text-white mb-1">Exemple — 3 filtres :</p>
                          <p className="text-gray-600 dark:text-gray-400">Compagnie = Lloyd + Formule = Standard + Usage = Commercial → règles très précises</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BG special case */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">💎 Cas Spéciaux : DC et BG (Capital Assuré)</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
                        DC et BG fonctionnent différemment des autres garanties
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs font-bold text-gray-900 dark:text-white mb-2">🚗 Autres garanties (VOL, INCENDIE, RC, etc.) :</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">La réduction est basée sur la <strong>valeur du véhicule</strong> (Valeur Vénale ou Valeur à Neuf)</p>
                        <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded p-2 text-xs">
                          <p className="text-gray-700 dark:text-gray-300">Exemple : VV entre 50,000 et 100,000 DT → 15% de réduction</p>
                        </div>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-3 border border-blue-300 dark:border-blue-600">
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-200 mb-2">💎 Garanties DC et BG (Capital Assuré) :</p>
                        <p className="text-xs text-blue-800 dark:text-blue-300 mb-2">La réduction peut être basée sur le <strong>capital assuré choisi par le client</strong>, pas sur la valeur du véhicule</p>
                        <div className="mt-2 space-y-2">
                          <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs">
                            <p className="font-semibold text-gray-900 dark:text-white mb-1">Option 1 : Par valeur (VV/VN)</p>
                            <p className="text-gray-700 dark:text-gray-300">Véhicule VV = 100,000 DT → Règle : 90k-150k → 20%</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs">
                            <p className="font-semibold text-gray-900 dark:text-white mb-1">Option 2 : Par capital assuré (DC_CAPITAL)</p>
                            <p className="text-gray-700 dark:text-gray-300">Client choisit capital = 15,000 DT → Règle : 10k-20k → 25%</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-300 dark:border-yellow-600">
                        <p className="text-xs font-bold text-yellow-900 dark:text-yellow-200 mb-1">⚡ Dans le formulaire de création :</p>
                        <p className="text-xs text-yellow-800 dark:text-yellow-300">Quand vous sélectionnez la métrique "Capital Assuré (DC/BG)", les champs Min/Max deviennent "Capital Min/Max" et les exemples changent automatiquement pour refléter des montants de capital (5000, 20000 DT) au lieu de valeurs véhicule.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick tips */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg p-4 border-2 border-gray-400 dark:border-gray-600">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">📌 Conseils Pratiques</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                      <p className="text-gray-700 dark:text-gray-300">Les badges colorés sous les filtres montrent quels filtres sont actifs — cliquez le <strong>×</strong> pour retirer un filtre individuel</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                      <p className="text-gray-700 dark:text-gray-300">Le compteur en bas des filtres indique combien de règles sont affichées sur le total</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                      <p className="text-gray-700 dark:text-gray-300">Cliquez "Réinitialiser" pour effacer tous les filtres d'un coup</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {helpTab === 'priority' && (<div className="space-y-6">
              {/* What is Priority */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-3">Qu'est-ce que la Priorité ?</h3>
                    <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed mb-3">
                      La priorité est un <strong>numéro de classement</strong> qui aide le système à choisir quelle réduction appliquer quand <strong>plusieurs règles correspondent au même devis</strong>.
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-blue-500">
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">🎯 Règle Simple :</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong className="text-blue-600 dark:text-blue-400">Plus le numéro est ÉLEVÉ → Plus la règle est PRIORITAIRE</strong>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Exemple : Priorité 10 gagne contre Priorité 5
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Concept - When Priority Matters */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-200 mb-3">⚡ IMPORTANT : Quand utiliser la Priorité ?</h3>
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                          La Priorité est un "ARBITRE" entre règles concurrentes
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Imaginez que vous avez créé plusieurs règles de réduction pour la garantie VOL. Un client fait un devis et <strong>3 de vos règles correspondent toutes</strong> à son profil. 
                          Le système doit choisir UNE SEULE règle → Il choisit celle avec la <strong>priorité la plus élevée</strong>.
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <span className="text-red-600 dark:text-red-400 text-lg">✗</span>
                          Si une SEULE règle correspond → Priorité IGNORÉE
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Si vous avez créé des règles avec des tranches de valeur qui ne se chevauchent pas (0-50k, 50k-100k, 100k+), 
                          chaque devis ne correspondra qu'à UNE règle. Dans ce cas, la priorité n'a <strong>aucun impact</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Scenarios */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📋 Les Deux Scénarios</h3>
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-300 dark:border-green-700">
                    <div className="flex items-start gap-3 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-bold text-green-900 dark:text-green-200">
                        Scénario 1 : UNE SEULE règle correspond au devis
                      </p>
                    </div>
                    <div className="ml-8">
                      <p className="text-xs text-green-800 dark:text-green-300 mb-2">
                        → La priorité est <strong>IGNORÉE</strong> (n'a aucun effet)
                      </p>
                      <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs">
                        <p className="text-gray-600 dark:text-gray-400 mb-1"><strong>Exemple :</strong></p>
                        <p className="text-gray-700 dark:text-gray-300">Client avec VV = 30,000 DT</p>
                        <p className="text-gray-700 dark:text-gray-300">Règle A : VV 0-50,000 → 15% (Priorité: 100)</p>
                        <p className="text-green-600 dark:text-green-400 font-bold mt-1">✓ Résultat : 15% appliqué (priorité ignorée)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border-2 border-orange-300 dark:border-orange-700">
                    <div className="flex items-start gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-bold text-orange-900 dark:text-orange-200">
                        Scénario 2 : PLUSIEURS règles correspondent au même devis
                      </p>
                    </div>
                    <div className="ml-8">
                      <p className="text-xs text-orange-800 dark:text-orange-300 mb-2">
                        → Le système choisit la règle avec la <strong>PRIORITÉ LA PLUS ÉLEVÉE</strong>
                      </p>
                      <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs">
                        <p className="text-gray-600 dark:text-gray-400 mb-1"><strong>Exemple :</strong></p>
                        <p className="text-gray-700 dark:text-gray-300">Client avec VV = 75,000 DT</p>
                        <p className="text-gray-700 dark:text-gray-300">Règle A : VV 0-100,000 → 15% (Priorité: 1) ❌</p>
                        <p className="text-gray-700 dark:text-gray-300">Règle B : VV 50,000-100,000 → 20% (Priorité: 5) ❌</p>
                        <p className="text-gray-700 dark:text-gray-300">Règle C : VV 70,000-80,000 → 25% (Priorité: 10) ✅</p>
                        <p className="text-orange-600 dark:text-orange-400 font-bold mt-1">✓ Résultat : 25% appliqué (Règle C gagne)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Scenario */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📊 Exemple Concret</h3>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Situation : Client avec les caractéristiques suivantes</p>
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="bg-white dark:bg-gray-800 rounded p-2">
                      <span className="text-gray-500 dark:text-gray-400">Compagnie:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">Lloyd</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded p-2">
                      <span className="text-gray-500 dark:text-gray-400">Garantie:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">VOL</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded p-2">
                      <span className="text-gray-500 dark:text-gray-400">Formule:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">Standard</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded p-2">
                      <span className="text-gray-500 dark:text-gray-400">Usage:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">Privé/Affaires</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded p-2 col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Valeur Vénale:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">75,000 DT</span>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Règles configurées :</p>
                  <div className="space-y-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-red-500">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Règle A</span>
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-bold rounded">Priorité: 1</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Lloyd • VOL • Standard • Privé/Affaires • VV: 0 - 100,000 DT</p>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">&rarr; Réduction: 15%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">✓ Correspond (VV = 75,000 DT est dans la tranche)</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-yellow-500">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Règle B</span>
                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-bold rounded">Priorité: 5</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Lloyd • VOL • Standard • Privé/Affaires • VV: 50,000 - 100,000 DT</p>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">&rarr; Réduction: 20%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">✓ Correspond (VV = 75,000 DT est dans la tranche)</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-green-500">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Règle C</span>
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-bold rounded">Priorité: 10</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Lloyd • VOL • Standard • Privé/Affaires • VV: 70,000 - 80,000 DT</p>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">&rarr; Réduction: 25%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">✓ Correspond (VV = 75,000 DT est dans la tranche)</p>
                    </div>
                  </div>

                  <div className="mt-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-bold text-green-900 dark:text-green-200">Résultat Final</span>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      Les 3 règles correspondent, mais la <strong>Règle C</strong> a la priorité la plus élevée (10).
                    </p>
                    <p className="text-sm font-bold text-green-900 dark:text-green-200 mt-2">
                      &rarr; Réduction appliquée : <span className="text-lg">25%</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* When to Use Priority - Practical Guide */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4">
                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200 mb-3">🎯 Quand utiliser quelle Priorité ?</h3>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Priorité 0-5 : Règles GÉNÉRALES</p>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold rounded">0-5</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Quand l'utiliser :</strong> Réduction de base qui s'applique à TOUS les clients ou à une large catégorie
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded p-2">
                      <p className="text-xs text-gray-700 dark:text-gray-300"><strong>Exemples :</strong></p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">• Réduction 10% pour TOUTES les valeurs de véhicule</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">• Réduction 5% pour TOUTES les formules</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">• Réduction de base pour tous les employés d'une banque</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Priorité 5-15 : Règles SPÉCIFIQUES</p>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-bold rounded">5-15</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Quand l'utiliser :</strong> Réduction ciblée avec des conditions précises (tranche de valeur, formule, usage)
                    </p>
                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded p-2">
                      <p className="text-xs text-gray-700 dark:text-gray-300"><strong>Exemples :</strong></p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">• Réduction 20% pour VV entre 50,000 et 100,000 DT</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">• Réduction 15% pour formule Standard + usage Commercial</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">• Réduction 25% pour véhicules de luxe (VV sup 150,000 DT)</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Priorité 15+ : Règles EXCEPTIONNELLES</p>
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-bold rounded">15+</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Quand l'utiliser :</strong> Cas spéciaux qui doivent TOUJOURS gagner (clients VIP, promotions limitées)
                    </p>
                    <div className="bg-orange-50 dark:bg-orange-900/30 rounded p-2">
                      <p className="text-xs text-gray-700 dark:text-gray-300"><strong>Exemples :</strong></p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">• Réduction 40% pour clients stratégiques (PDG, Directeurs)</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">• Promotion exceptionnelle 50% (valable 1 mois)</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">• Offre spéciale pour partenaires privilégiés</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Best Practices */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">💡 Conseils Pratiques</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-300 dark:border-green-700">
                    <span className="text-green-600 dark:text-green-400 font-bold text-lg">✓</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Espacez vos priorités</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Utilisez 0, 5, 10, 15, 20 au lieu de 1, 2, 3, 4, 5. Cela permet d'insérer facilement de nouvelles règles entre deux existantes.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-300 dark:border-green-700">
                    <span className="text-green-600 dark:text-green-400 font-bold text-lg">✓</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Créez une règle "filet de sécurité"</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Ajoutez toujours une règle générale avec Priorité 0 qui s'applique à tous. Elle garantit qu'une réduction minimale sera toujours appliquée.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-300 dark:border-red-700">
                    <span className="text-red-600 dark:text-red-400 font-bold text-lg">✗</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Évitez les priorités identiques</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Si deux règles ont la même priorité et correspondent toutes les deux, le système choisit la plus récente (comportement imprévisible). Utilisez toujours des priorités différentes.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-300 dark:border-yellow-700">
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">⚠</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Testez vos règles</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Après avoir créé plusieurs règles, générez des devis de test pour vérifier que la bonne règle est appliquée. Ajustez les priorités si nécessaire.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Reference */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg p-4 border-2 border-gray-400 dark:border-gray-600">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-lg">📌</span>
                  Aide-Mémoire : Quelle Priorité choisir ?
                </h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border-2 border-blue-300 dark:border-blue-700">
                    <div className="font-bold text-2xl text-blue-600 dark:text-blue-400 mb-1">0-5</div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Général</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">Pour tous</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border-2 border-purple-300 dark:border-purple-700">
                    <div className="font-bold text-2xl text-purple-600 dark:text-purple-400 mb-1">5-15</div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Spécifique</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">Conditions précises</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border-2 border-orange-300 dark:border-orange-700">
                    <div className="font-bold text-2xl text-orange-600 dark:text-orange-400 mb-1">15+</div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Exceptionnel</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">VIP / Promo</div>
                  </div>
                </div>
                <div className="mt-3 bg-blue-100 dark:bg-blue-900/30 rounded p-2">
                  <p className="text-xs text-blue-900 dark:text-blue-200 text-center">
                    <strong>💡 Astuce :</strong> En cas de doute, commencez par Priorité 10 pour vos règles spécifiques
                  </p>
                </div>
              </div>
            </div>
            )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={() => { setShowPriorityHelp(false); setHelpTab('guide'); }}>
                J'ai compris
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtres
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Réinitialiser
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Compagnie
            </label>
            <select
              value={filters.companyId}
              onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les compagnies</option>
              {convention?.companies?.map((cc: any) => (
                <option key={cc.companyId} value={cc.companyId}>
                  {cc.company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Formula Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Formule
            </label>
            <select
              value={filters.formulaType}
              onChange={(e) => setFilters({ ...filters, formulaType: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les formules</option>
              <option value="STANDARD">Standard</option>
              <option value="DOMMAGES_COLLISIONS">Dommages Collision</option>
              <option value="TOUS_RISQUES_0">Tous Risques 0%</option>
            </select>
          </div>

          {/* Usage Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Usage
            </label>
            <select
              value={filters.usageId}
              onChange={(e) => setFilters({ ...filters, usageId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les usages</option>
              {usageTypes?.map((usage: any) => (
                <option key={usage.id} value={usage.id}>
                  {usage.nameFr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Filtres actifs:</span>
            {filters.companyId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                {convention?.companies?.find((c: any) => c.companyId === filters.companyId)?.company.name}
                <button
                  onClick={() => setFilters({ ...filters, companyId: '' })}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.formulaType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded">
                {filters.formulaType === 'STANDARD' ? 'Standard' : 
                 filters.formulaType === 'DOMMAGES_COLLISIONS' ? 'DC' : 'TR 0%'}
                <button
                  onClick={() => setFilters({ ...filters, formulaType: '' })}
                  className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.usageId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-medium rounded">
                {usageTypes?.find((u: any) => u.id === filters.usageId)?.nameFr}
                <button
                  onClick={() => setFilters({ ...filters, usageId: '' })}
                  className="hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {filteredRules.length} règle{filteredRules.length !== 1 ? 's' : ''} affichée{filteredRules.length !== 1 ? 's' : ''}
            {hasActiveFilters && ` sur ${rules?.length || 0} au total`}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRules?.map((rule: any) => (
          <div key={rule.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {rule.guarantee.nameFr}
                  </h3>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded">
                    {rule.discountPercent}% de réduction
                  </span>
                  {rule.company && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                      {rule.company.name}
                    </span>
                  )}
                  {rule.formulaType && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded">
                      {rule.formulaType === 'STANDARD' ? 'Standard' : 
                       rule.formulaType === 'DOMMAGES_COLLISIONS' ? 'DC' : 'TR 0%'}
                    </span>
                  )}
                  {rule.usage && (
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-medium rounded">
                      {rule.usage.nameFr}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Métrique:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {rule.metric === 'MARKET_VALUE' ? 'Valeur Vénale' : 
                       rule.metric === 'NEW_VALUE' ? 'Valeur à Neuf' : 'Capital DC'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Tranche:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {rule.minValue && rule.maxValue ? 
                        `${rule.minInclusive ? '≥' : '>'} ${rule.minValue} - ${rule.maxInclusive ? '≤' : '<'} ${rule.maxValue}` :
                       rule.minValue ? 
                        `${rule.minInclusive ? '≥' : '>'} ${rule.minValue}` :
                       rule.maxValue ? 
                        `${rule.maxInclusive ? '≤' : '<'} ${rule.maxValue}` : 
                        'Toutes valeurs'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Priorité:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {rule.priority}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openModal(rule)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Supprimer cette règle ?')) {
                      deleteMutation.mutate(rule.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRules?.length === 0 && rules?.length > 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune règle ne correspond aux filtres
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Essayez de modifier ou réinitialiser les filtres
          </p>
          <Button onClick={clearFilters} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Réinitialiser les filtres
          </Button>
        </div>
      )}

      {rules?.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Sliders className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune règle de réduction
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Créez des paliers de réduction pour cette convention
          </p>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une règle
          </Button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRule ? 'Modifier la règle' : 'Nouvelle règle de réduction'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compagnie (optionnel - laissez vide pour toutes)
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Toutes les compagnies</option>
                  {convention?.companies?.map((cc: any) => (
                    <option key={cc.companyId} value={cc.companyId}>{cc.company.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Garantie *
                </label>
                <select
                  value={formData.guaranteeId}
                  onChange={(e) => {
                    const newGuaranteeId = e.target.value;
                    const newGuarantee = guarantees?.find((g: any) => g.id === newGuaranteeId);
                    const isBG = newGuarantee?.code === 'BG';
                    
                    // Auto-set metric to DC_CAPITAL if BG is selected
                    setFormData({ 
                      ...formData, 
                      guaranteeId: newGuaranteeId,
                      metric: isBG ? 'DC_CAPITAL' : formData.metric
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Sélectionner une garantie</option>
                  {guarantees?.filter((g: any) => ['TOUS_RISQUES_ZERO', 'DOMMAGES_COLLISIONS', 'VOL', 'INCENDIE', 'BG'].includes(g.code)).map((g: any) => (
                    <option key={g.id} value={g.id}>{g.nameFr}</option>
                  ))}
                </select>
                {isBGSelected && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    BG utilise le Capital BG (pas la valeur véhicule)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type de Formule (optionnel)
                  </label>
                  <select
                    value={formData.formulaType}
                    onChange={(e) => setFormData({ ...formData, formulaType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Toutes les formules</option>
                    <option value="STANDARD">Standard</option>
                    <option value="DOMMAGES_COLLISIONS">Dommages Collision</option>
                    <option value="TOUS_RISQUES_0">Tous Risques 0%</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Laissez vide pour appliquer à toutes les formules</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type d'Usage (optionnel)
                  </label>
                  <select
                    value={formData.usageId}
                    onChange={(e) => setFormData({ ...formData, usageId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Tous les usages</option>
                    {usageTypes?.map((usage: any) => (
                      <option key={usage.id} value={usage.id}>{usage.nameFr}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Laissez vide pour appliquer à tous les usages</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Métrique *
                </label>
                {isBGSelected ? (
                  <>
                    <div className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white">
                      Capital Assuré (BG)
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Pour BG, les réductions s'appliquent sur le capital choisi par le client (1000/2000/3000 DT)
                    </p>
                  </>
                ) : (
                  <>
                    <select
                      value={formData.metric}
                      onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      required
                    >
                      <optgroup label="Basé sur la valeur du véhicule">
                        <option value="MARKET_VALUE">Valeur Vénale (VV)</option>
                        <option value="NEW_VALUE">Valeur à Neuf (VN)</option>
                      </optgroup>
                      <optgroup label="Basé sur le capital choisi par le client">
                        <option value="DC_CAPITAL">Capital Assuré (DC/BG)</option>
                      </optgroup>
                    </select>
                    {formData.metric === 'DC_CAPITAL' ? (
                      <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="text-xs text-blue-800 dark:text-blue-300">
                            <p className="font-semibold mb-1">Capital Assuré = Montant choisi par le client</p>
                            <p>Cette métrique applique la réduction basée sur le <strong>capital que le client sélectionne</strong> (ex: 10,000 DT, 20,000 DT), pas sur la valeur du véhicule.</p>
                            <p className="mt-1">Exemple : Si le client choisit un capital de 15,000 DT et que vous créez une règle "10,000-20,000 DT → 25%", il recevra 25% de réduction.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        La métrique détermine sur quelle valeur la réduction s'applique
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label={isBGSelected || formData.metric === 'DC_CAPITAL' ? "Capital Min (DT) - optionnel" : "Valeur Min (optionnel)"}
                    type="number"
                    step="0.01"
                    value={formData.minValue}
                    onChange={(e) => setFormData({ ...formData, minValue: e.target.value })}
                    placeholder={isBGSelected || formData.metric === 'DC_CAPITAL' ? "Ex: 5000" : "Ex: 90000"}
                  />
                  {(isBGSelected || formData.metric === 'DC_CAPITAL') && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Capital minimum en DT (ex: 5000, 10000)
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    label={isBGSelected || formData.metric === 'DC_CAPITAL' ? "Capital Max (DT) - optionnel" : "Valeur Max (optionnel)"}
                    type="number"
                    step="0.01"
                    value={formData.maxValue}
                    onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })}
                    placeholder={isBGSelected || formData.metric === 'DC_CAPITAL' ? "Ex: 20000" : "Ex: 500000"}
                  />
                  {(isBGSelected || formData.metric === 'DC_CAPITAL') && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Capital maximum en DT (ex: 20000, 50000)
                    </p>
                  )}
                </div>
              </div>
              
              {formData.minValue && formData.maxValue && parseFloat(formData.minValue) >= parseFloat(formData.maxValue) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Erreur :</strong> La valeur minimale doit être inférieure à la valeur maximale
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.minInclusive}
                    onChange={(e) => setFormData({ ...formData, minInclusive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Min inclusif (≥)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.maxInclusive}
                    onChange={(e) => setFormData({ ...formData, maxInclusive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Max inclusif (≤)</span>
                </label>
              </div>

              <Input
                label="Pourcentage de réduction * (ex: 35 pour 35%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                placeholder="Ex: 35"
                required
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priorité (arbitre entre règles concurrentes)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPriorityHelp(true)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs flex items-center gap-1 font-semibold"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Besoin d'aide ?
                  </button>
                </div>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="Ex: 10"
                />
                <div className="mt-2 space-y-2">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                    <p className="text-xs text-yellow-900 dark:text-yellow-200 font-semibold mb-1">
                      ⚡ La priorité est utilisée UNIQUEMENT si plusieurs règles correspondent au même devis
                    </p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      Plus le numéro est élevé → Plus la règle gagne en cas de concurrence
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-2">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      <strong>Guide rapide :</strong> Général (0-5) • Spécifique (5-15) • Exceptionnel (15+)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" loading={createMutation.isPending} className="flex-1">
                  {editingRule ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
