import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Shield, Table, Calculator, FileSpreadsheet, HelpCircle, X, CheckCircle, Package, Calendar } from 'lucide-react';
import { RcTableGrid } from '../../components/admin/pricing/RcTableGrid';
import { GuaranteesConfig } from '../../components/admin/pricing/GuaranteesConfig';
import { DcConfigTab } from './formulas/DcConfigTab';
import { GuaranteeBundlingsTab } from './formulas/GuaranteeBundlingsTab';
import { GuaranteeAvailabilityTab } from './formulas/GuaranteeAvailabilityTab';
import { DcCapitalTiersPage } from './DcCapitalTiersPage';
import { FormulaEligibilityPage } from './FormulaEligibilityPage';
import { Button } from '../../components/ui/Button';

export const PricingManagementPage = () => {
  const [activeTab, setActiveTab] = useState('rc-table');
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Gestion de Tarification
            </h1>
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              MODULE ADMIN
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Configuration complète des tarifs et formules - Interface simplifiée type Excel
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHelpModal(true)}
          className="flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Guide de Vérification
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-6 scrollbar-hide">
          <TabsList className="inline-flex w-max md:grid md:w-full md:grid-cols-7">
            <TabsTrigger value="rc-table" className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              <span className="whitespace-nowrap">Tableau RC</span>
            </TabsTrigger>
            <TabsTrigger value="guarantees" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="whitespace-nowrap">Garanties</span>
            </TabsTrigger>
            <TabsTrigger value="dc-config" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="whitespace-nowrap">Dommages Collision</span>
            </TabsTrigger>
            <TabsTrigger value="dc-capitals" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="whitespace-nowrap">Paliers DC</span>
            </TabsTrigger>
            <TabsTrigger value="bundlings" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="whitespace-nowrap">Garanties Groupées</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="whitespace-nowrap">Disponibilité</span>
            </TabsTrigger>
            <TabsTrigger value="age-eligibility" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="whitespace-nowrap">Âge Éligibilité</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rc-table">
          <RcTableGrid />
        </TabsContent>

        <TabsContent value="guarantees">
          <GuaranteesConfig />
        </TabsContent>

        <TabsContent value="dc-config">
          <DcConfigTab />
        </TabsContent>

        <TabsContent value="dc-capitals">
          <DcCapitalTiersPage />
        </TabsContent>

        <TabsContent value="bundlings">
          <GuaranteeBundlingsTab />
        </TabsContent>

        <TabsContent value="availability">
          <GuaranteeAvailabilityTab />
        </TabsContent>

        <TabsContent value="age-eligibility">
          <FormulaEligibilityPage />
        </TabsContent>
      </Tabs>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Guide de Vérification des Garanties Spécifiques
                </h2>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Introduction */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  📋 Objectif de ce Guide
                </h3>
                <p className="text-blue-800 dark:text-blue-300 text-sm">
                  Ce guide vous permet de vérifier que les garanties spécifiques pour Al Baraka (AMANA) sont correctement configurées selon vos exigences.
                </p>
              </div>

              {/* Requirements Summary */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  ✅ Vos Exigences
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>1.</strong> Défense et recours <strong>gratuite</strong> avec la formule Tous Risques pour Al Baraka
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>2.</strong> Catastrophes naturelles et Dommages suite émeutes <strong>uniquement avec Tous Risques</strong> pour Al Baraka
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>3.</strong> Incendie suite émeutes <strong>NON accordée</strong> pour Al Baraka (uniquement Lloyd)
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>4.</strong> Rubrique "Appliquer à" disponible dans l'interface (champ "Type de Formule")
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Steps */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  🧭 Comment Accéder aux Garanties
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                      1
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      Cliquez sur l'onglet <strong>"Garanties"</strong> ci-dessus
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                      2
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      Sélectionnez <strong>"Assurances Amana"</strong> dans le menu déroulant "Compagnie"
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                      3
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      Cliquez sur chaque garantie pour voir ses règles
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Checklist */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  ✓ Liste de Vérification
                </h3>

                {/* Test 1 */}
                <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded">
                  <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                    ✅ TEST 1 : Défense et Recours
                  </h4>
                  <div className="text-sm text-green-800 dark:text-green-300 space-y-2">
                    <p><strong>Cherchez :</strong> La carte "Défense et Recours"</p>
                    <p><strong>Vérifiez :</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Badge affiche "1 règle" ou "2 règles"</li>
                      <li>Cliquez pour développer</li>
                      <li>Doit afficher : <strong>Formule: TOUS_RISQUES_0</strong></li>
                      <li>Doit afficher : <strong>Prime fixe: 0.00 DT</strong> (gratuit)</li>
                    </ul>
                  </div>
                </div>

                {/* Test 2 */}
                <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded">
                  <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                    ✅ TEST 2 : Catastrophes Naturelles
                  </h4>
                  <div className="text-sm text-green-800 dark:text-green-300 space-y-2">
                    <p><strong>Cherchez :</strong> "Extension Catastrophes Naturelles"</p>
                    <p><strong>Vérifiez :</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Badge affiche "1 règle"</li>
                      <li>Cliquez pour développer</li>
                      <li>Doit afficher : <strong>Formule: TOUS_RISQUES_0</strong></li>
                      <li>Doit afficher : <strong>Prime fixe: 40.00 DT</strong></li>
                    </ul>
                  </div>
                </div>

                {/* Test 3 - CRITICAL */}
                <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                    🎯 TEST 3 : Dommages suite émeutes (CRITIQUE)
                  </h4>
                  <div className="text-sm text-yellow-800 dark:text-yellow-300 space-y-2">
                    <p><strong>Cherchez :</strong> "Dommages suite émeutes"</p>
                    <p><strong>Vérifiez :</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Badge affiche "1 règle"</li>
                      <li>Cliquez pour développer</li>
                      <li><strong className="text-yellow-900 dark:text-yellow-200">IMPORTANT :</strong> Doit afficher <strong>Formule: TOUS_RISQUES_0</strong></li>
                      <li>Doit afficher : <strong>Prime fixe: 30.00 DT</strong></li>
                    </ul>
                    <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-950 rounded">
                      <p className="font-semibold">❌ Si le champ "Formule" est vide ou absent :</p>
                      <p className="text-xs">La configuration est incorrecte. Contactez le support technique.</p>
                    </div>
                  </div>
                </div>

                {/* Test 4 */}
                <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded">
                  <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                    ✅ TEST 4 : Incendie suite émeutes (AMANA)
                  </h4>
                  <div className="text-sm text-green-800 dark:text-green-300 space-y-2">
                    <p><strong>Cherchez :</strong> "Incendie suite émeutes"</p>
                    <p><strong>Vérifiez :</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Badge affiche <strong>"0 règle"</strong></li>
                      <li>Cliquez pour développer</li>
                      <li>Doit afficher : <strong>"Aucune règle configurée"</strong></li>
                    </ul>
                    <p className="text-xs mt-2">✓ Cette garantie ne doit PAS exister pour Al Baraka</p>
                  </div>
                </div>

                {/* Test 5 */}
                <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    ✅ TEST 5 : Incendie suite émeutes (LLOYD)
                  </h4>
                  <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                    <p><strong>Action :</strong> Changez la compagnie pour <strong>"Lloyd Tunisien"</strong></p>
                    <p><strong>Cherchez :</strong> "Incendie suite émeutes"</p>
                    <p><strong>Vérifiez :</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Badge affiche "1 règle"</li>
                      <li>Cliquez pour développer</li>
                      <li>Le champ "Formule" doit être <strong>vide</strong> (disponible pour toutes les formules)</li>
                      <li>Doit afficher : <strong>Prime fixe: 15.00 DT</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Visual Diagram */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  📊 Schéma Visuel
                </h3>
                <div className="font-mono text-xs bg-white dark:bg-gray-950 p-4 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <pre className="text-gray-700 dark:text-gray-300">{`
┌─────────────────────────────────────────────────────────────┐
│                    GARANTIES AL BARAKA                      │
└─────────────────────────────────────────────────────────────┘

✅ CORRECT - Dommages suite émeutes doit ressembler à :

┌─────────────────────────────────────────────────────────┐
│ ▼ Dommages suite émeutes              [1 règle]        │
├─────────────────────────────────────────────────────────┤
│ Formule: TOUS_RISQUES_0              ← IMPORTANT !     │
│ Prime fixe: 30.00 DT                                    │
│                                                         │
│ [Modifier] [Supprimer]                                  │
└─────────────────────────────────────────────────────────┘

❌ INCORRECT - Si vous voyez :

┌─────────────────────────────────────────────────────────┐
│ ▼ Dommages suite émeutes              [1 règle]        │
├─────────────────────────────────────────────────────────┤
│ Prime fixe: 30.00 DT                 ← Pas de Formule! │
│                                                         │
│ [Modifier] [Supprimer]                                  │
└─────────────────────────────────────────────────────────┘
                  `}</pre>
                </div>
              </div>

              {/* Summary Table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-900 p-4">
                  📋 Tableau Récapitulatif
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Garantie</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Compagnie</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Formule</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Prime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr className="bg-white dark:bg-gray-900">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Défense et Recours</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">AMANA</td>
                        <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">TOUS_RISQUES_0</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">0 DT</td>
                      </tr>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Catastrophes Naturelles</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">AMANA</td>
                        <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">TOUS_RISQUES_0</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">40 DT</td>
                      </tr>
                      <tr className="bg-yellow-50 dark:bg-yellow-900/20">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Dommages suite émeutes</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">AMANA</td>
                        <td className="px-4 py-3 font-semibold text-yellow-600 dark:text-yellow-400">TOUS_RISQUES_0</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">30 DT</td>
                      </tr>
                      <tr className="bg-white dark:bg-gray-900">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Incendie suite émeutes</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">AMANA</td>
                        <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400">NON DISPONIBLE</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">-</td>
                      </tr>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Incendie suite émeutes</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">LLOYD</td>
                        <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">TOUTES</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">15 DT</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Success Criteria */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
                  🎯 Critère de Succès
                </h3>
                <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                  <strong>TOUS les 5 tests doivent être RÉUSSIS</strong> pour confirmer que la configuration est correcte à 100%.
                </p>
                <div className="bg-white dark:bg-gray-900 rounded p-3 text-sm">
                  <p className="text-gray-700 dark:text-gray-300 mb-2">Si tous les tests passent :</p>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    <span>✅ Configuration 100% Conforme</span>
                  </div>
                </div>
              </div>

              {/* What does it mean section */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-3">
                  💡 Que Signifie "Formule: TOUS_RISQUES_0" ?
                </h3>
                <div className="text-sm text-purple-800 dark:text-purple-300 space-y-3">
                  <p>
                    Quand vous voyez <strong>"Formule: TOUS_RISQUES_0"</strong> affiché sur une garantie, cela signifie que :
                  </p>
                  <div className="bg-white dark:bg-gray-900 rounded p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
                      <p className="text-gray-700 dark:text-gray-300">
                        Cette garantie est <strong>réservée uniquement</strong> aux clients qui choisissent la formule "Tous Risques 0%"
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
                      <p className="text-gray-700 dark:text-gray-300">
                        Les clients avec d'autres formules (Standard, Dommages Collision) <strong>ne peuvent pas</strong> bénéficier de cette garantie
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
                      <p className="text-gray-700 dark:text-gray-300">
                        C'est exactement ce que vous avez demandé : certaines garanties exclusives à la formule Tous Risques
                      </p>
                    </div>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-950 rounded p-3 mt-3">
                    <p className="font-semibold text-purple-900 dark:text-purple-200 mb-1">Exemple concret :</p>
                    <p className="text-xs text-purple-800 dark:text-purple-300">
                      Si un client d'Al Baraka veut la garantie "Dommages suite émeutes", il DOIT obligatoirement souscrire à la formule "Tous Risques 0%". 
                      S'il choisit une autre formule, cette garantie ne sera pas disponible pour lui.
                    </p>
                  </div>
                </div>
              </div>

              {/* Where to find "Appliquer à" section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
                  🎯 Où Trouver la Rubrique "Appliquer à" (Type de Formule)
                </h3>
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-4">
                  <p className="font-semibold">
                    La rubrique "Appliquer à" que vous avez demandée existe sous le nom <strong>"Type de formule"</strong> et se trouve à 2 endroits :
                  </p>

                  {/* Location 1 */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📍</span>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Emplacement 1 : Vue Résumé</h4>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                      Quand vous développez une garantie dans la liste, vous voyez :
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-950 p-2 rounded font-mono text-xs">
                      <pre className="text-gray-700 dark:text-gray-300">{`┌─────────────────────────────────────┐
│ ▼ Dommages suite émeutes [1 règle] │
├─────────────────────────────────────┤
│ Formule: TOUS_RISQUES_0  ← ICI !   │
│ Prime fixe: 30.00 DT                │
│ [Modifier] [Supprimer]              │
└─────────────────────────────────────┘`}</pre>
                    </div>
                  </div>

                  {/* Location 2 */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border-l-4 border-indigo-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📍</span>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Emplacement 2 : Formulaire de Modification</h4>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                      Quand vous cliquez sur "Modifier" ou "Ajouter", vous voyez un champ :
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-950 p-2 rounded font-mono text-xs mb-2">
                      <pre className="text-gray-700 dark:text-gray-300">{`Type de formule          ← ICI !
┌─────────────────────────┐
│ Tous Risques 0%    ▼    │
└─────────────────────────┘`}</pre>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded">
                      <p className="text-xs text-blue-800 dark:text-blue-300">
                        <strong>Options disponibles :</strong>
                      </p>
                      <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                        <li>• <strong>Toutes</strong> (vide) → Garantie pour TOUTES les formules</li>
                        <li>• <strong>Tous Risques 0%</strong> → Garantie UNIQUEMENT pour TR 0%</li>
                      </ul>
                    </div>
                  </div>

                  {/* How to access */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-300 dark:border-green-700 rounded p-3">
                    <p className="font-semibold text-green-900 dark:text-green-200 mb-2">🔍 Comment y accéder :</p>
                    <ol className="text-xs text-green-800 dark:text-green-300 space-y-1 list-decimal list-inside">
                      <li>Allez dans l'onglet <strong>"Garanties"</strong></li>
                      <li>Sélectionnez une compagnie (ex: Assurances Amana)</li>
                      <li>Cliquez sur une garantie pour la développer</li>
                      <li>Cliquez sur <strong>"Modifier"</strong> pour voir le formulaire</li>
                      <li>Cherchez le champ <strong>"Type de formule"</strong></li>
                    </ol>
                  </div>

                  {/* Available for all */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 dark:text-yellow-400 text-lg">✨</span>
                      <div className="flex-1">
                        <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">Disponible pour TOUTES les garanties !</p>
                        <p className="text-xs text-yellow-800 dark:text-yellow-300">
                          Le champ "Type de formule" est maintenant disponible pour toutes les garanties (VOL, INCENDIE, CAS, ASSISTANCE, etc.), 
                          vous donnant une flexibilité totale pour configurer vos règles de tarification selon vos besoins.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty vs Seeded Database */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
                  🗄️ Base de Données Vide vs Base de Données avec Exemples
                </h3>
                <div className="text-sm text-indigo-800 dark:text-indigo-300 space-y-3">
                  <p className="font-semibold">Votre système peut fonctionner de deux façons :</p>
                  
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-900 rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                          1
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">Base de Données VIDE (nouveau démarrage)</p>
                      </div>
                      <ul className="list-disc list-inside ml-8 space-y-1 text-gray-700 dark:text-gray-300">
                        <li>Aucune garantie n'est configurée au départ</li>
                        <li>Tous les tests afficheront "0 règle" et "Aucune règle configurée"</li>
                        <li>Vous devez créer manuellement chaque garantie via le bouton "Ajouter"</li>
                        <li><strong>C'est normal</strong> si vous démarrez un nouveau projet</li>
                      </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                          2
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">Base de Données avec EXEMPLES (données de test)</p>
                      </div>
                      <ul className="list-disc list-inside ml-8 space-y-1 text-gray-700 dark:text-gray-300">
                        <li>Des garanties d'exemple sont déjà créées automatiquement</li>
                        <li>Les 5 tests de ce guide devraient tous passer avec succès</li>
                        <li>C'est ce qui est utilisé pour la démonstration et les tests</li>
                        <li><strong>C'est ce que vous voyez actuellement</strong> si les tests passent</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-100 dark:bg-indigo-950 rounded p-3 mt-3">
                    <p className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1">Comment savoir dans quel cas vous êtes ?</p>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300">
                      Allez dans l'onglet "Garanties" et regardez les badges. Si vous voyez des chiffres ("1 règle", "2 règles"), 
                      vous avez des données d'exemple. Si tout affiche "0 règle", votre base est vide.
                    </p>
                  </div>
                </div>
              </div>

              {/* How to modify section */}
              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-200 mb-3">
                  ✏️ Comment Modifier ou Ajouter des Garanties
                </h3>
                <div className="text-sm text-teal-800 dark:text-teal-300 space-y-3">
                  <p>Vous pouvez facilement gérer vos garanties directement depuis l'interface :</p>
                  
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-900 rounded p-3">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">➕ Pour AJOUTER une nouvelle règle :</p>
                      <ol className="list-decimal list-inside ml-4 space-y-1 text-gray-700 dark:text-gray-300">
                        <li>Cliquez sur la garantie souhaitée</li>
                        <li>Cliquez sur le bouton "Ajouter" en haut à droite</li>
                        <li>Remplissez le formulaire (Compagnie, Type de formule, Prime, etc.)</li>
                        <li>Cliquez sur "Enregistrer"</li>
                      </ol>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded p-3">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">✏️ Pour MODIFIER une règle existante :</p>
                      <ol className="list-decimal list-inside ml-4 space-y-1 text-gray-700 dark:text-gray-300">
                        <li>Cliquez sur la garantie pour la développer</li>
                        <li>Cliquez sur le bouton "Modifier" de la règle</li>
                        <li>Modifiez les champs souhaités</li>
                        <li>Cliquez sur "Enregistrer"</li>
                      </ol>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded p-3">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">🗑️ Pour SUPPRIMER une règle :</p>
                      <ol className="list-decimal list-inside ml-4 space-y-1 text-gray-700 dark:text-gray-300">
                        <li>Cliquez sur la garantie pour la développer</li>
                        <li>Cliquez sur le bouton "Supprimer" de la règle</li>
                        <li>Confirmez la suppression</li>
                      </ol>
                    </div>
                  </div>

                  <div className="bg-teal-100 dark:bg-teal-950 rounded p-3 mt-3">
                    <p className="font-semibold text-teal-900 dark:text-teal-200 mb-1">💡 Astuce importante :</p>
                    <p className="text-xs text-teal-800 dark:text-teal-300">
                      Le champ "Type de Formule" est la rubrique "Appliquer à" que vous avez demandée. 
                      Si vous le laissez vide, la garantie sera disponible pour TOUTES les formules. 
                      Si vous sélectionnez "Tous Risques 0%", elle sera réservée uniquement à cette formule.
                    </p>
                  </div>
                </div>
              </div>

              {/* Troubleshooting - Simplified for non-technical */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-3">
                  ⚠️ Que Faire Si Quelque Chose Ne Fonctionne Pas
                </h3>
                <div className="text-sm text-red-800 dark:text-red-300 space-y-3">
                  <div className="bg-white dark:bg-gray-900 rounded p-3">
                    <p className="font-semibold text-red-900 dark:text-red-200 mb-2">❌ Problème : Le TEST 3 échoue (pas de "TOUS_RISQUES_0" affiché)</p>
                    <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Ce que cela signifie :</strong></p>
                    <p className="text-gray-700 dark:text-gray-300 text-xs mb-2">
                      La garantie "Dommages suite émeutes" n'est pas correctement configurée pour être exclusive à la formule Tous Risques.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Solution simple :</strong></p>
                    <ol className="list-decimal list-inside ml-4 space-y-1 text-gray-700 dark:text-gray-300 text-xs">
                      <li>Cliquez sur "Dommages suite émeutes" pour développer</li>
                      <li>Cliquez sur "Modifier" sur la règle existante</li>
                      <li>Dans le champ "Type de formule", sélectionnez "Tous Risques 0%"</li>
                      <li>Cliquez sur "Enregistrer"</li>
                      <li>Rafraîchissez la page et vérifiez à nouveau</li>
                    </ol>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded p-3">
                    <p className="font-semibold text-red-900 dark:text-red-200 mb-2">❌ Problème : Aucune garantie n'apparaît (tout affiche "0 règle")</p>
                    <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Ce que cela signifie :</strong></p>
                    <p className="text-gray-700 dark:text-gray-300 text-xs mb-2">
                      Votre base de données est vide. C'est normal si vous démarrez un nouveau projet.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Solution :</strong></p>
                    <p className="text-gray-700 dark:text-gray-300 text-xs">
                      Vous devez créer manuellement les garanties en cliquant sur "Ajouter" pour chaque garantie, 
                      OU demander à votre équipe technique d'initialiser la base avec des données d'exemple.
                    </p>
                  </div>

                  <div className="bg-red-100 dark:bg-red-950 rounded p-3 mt-3">
                    <p className="font-semibold text-red-900 dark:text-red-200 mb-1">🆘 Besoin d'aide technique ?</p>
                    <p className="text-xs text-red-800 dark:text-red-300">
                      Si les solutions ci-dessus ne fonctionnent pas, contactez votre équipe technique et mentionnez : 
                      "Problème avec la configuration des garanties spécifiques Al Baraka - TEST 3 échoue". 
                      Ils sauront quoi faire.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
              <Button
                onClick={() => setShowHelpModal(false)}
                className="w-full"
              >
                J'ai compris - Fermer le guide
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingManagementPage;
