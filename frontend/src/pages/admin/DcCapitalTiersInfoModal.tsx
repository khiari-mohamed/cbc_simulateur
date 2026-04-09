import { useState } from 'react';
import { Info, X, ChevronRight, Settings, Sliders, Car, ShieldCheck, ArrowRight } from 'lucide-react';

export const DcCapitalTiersInfoModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        title="Comment fonctionne la configuration DC ?"
      >
        <Info className="w-4 h-4" />
        <span>Guide de configuration</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-start justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Guide de configuration — Dommages Collision
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Comment les deux sections travaillent ensemble
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-6">

              {/* Intro */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                  <strong>Important :</strong> La garantie Dommages Collision se configure en <strong>deux endroits distincts</strong> dans l'interface d'administration. Ces deux sections ont des rôles différents et doivent toutes les deux être renseignées pour que le système fonctionne correctement.
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Paliers de Capital DC — <span className="font-normal text-gray-500 dark:text-gray-400">Les échelons de choix</span>
                  </h3>
                </div>

                <div className="ml-9 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Cette section définit <strong>la liste des montants proposés au client</strong> dans le menu déroulant lors de la simulation, ainsi que <strong>la façon dont ces montants progressent</strong> d'une valeur à l'autre.
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Les trois champs à renseigner :</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Montant Min :</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400"> le premier montant disponible dans cette tranche. Par exemple, <em>1 000 DT</em>.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Montant Max :</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400"> le dernier montant de cette tranche. Par exemple, <em>10 000 DT</em>.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Pas (Step) :</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400"> l'intervalle entre chaque valeur. Par exemple, <em>1 000 DT</em> signifie que le client verra : 1 000 / 2 000 / 3 000 / … / 10 000.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-2">Exemple concret — LLOYD Assurances</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed mb-2">
                      Quatre tranches sont configurées, chacune avec un pas différent :
                    </p>
                    <div className="space-y-1">
                      {[
                        { range: '1 000 → 10 000 DT', step: 'pas de 1 000 DT', values: '1k, 2k, 3k … 10k' },
                        { range: '10 001 → 20 000 DT', step: 'pas de 5 000 DT', values: '15k, 20k' },
                        { range: '20 001 → 50 000 DT', step: 'pas de 10 000 DT', values: '30k, 40k, 50k' },
                        { range: '50 001 → 100 000 DT', step: 'pas de 25 000 DT', values: '75k, 100k' },
                      ].map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                          <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">{t.range}</span>
                          <ArrowRight className="w-3 h-3 flex-shrink-0" />
                          <span className="text-blue-600 dark:text-blue-400">{t.step}</span>
                          <span className="text-blue-500 dark:text-blue-500 italic">→ {t.values}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                      Le résultat brut : 1k, 2k, 3k … 10k, 15k, 20k, 30k, 40k, 50k, 75k, 100k — avant application des limites.
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider with arrow */}
              <div className="flex items-center justify-center gap-3 py-1">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                  <span>puis</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>

              {/* Section 2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-green-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Gestion de Tarification DC — <span className="font-normal text-gray-500 dark:text-gray-400">Les règles métier</span>
                  </h3>
                </div>

                <div className="ml-9 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Cette section définit les <strong>règles de calcul et les limites</strong> qui s'appliquent en fonction de la valeur du véhicule du client. C'est ici que vous contrôlez jusqu'où peut aller le capital assuré, indépendamment des paliers configurés ci-dessus.
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Les paramètres clés :</p>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Capital Max % VV :</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400"> le pourcentage maximum de la valeur vénale du véhicule que le client peut choisir comme capital. Si vous mettez <em>50 %</em>, un véhicule valant 80 000 DT ne pourra pas être assuré pour plus de 40 000 DT en DC.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Plafond Absolu :</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400"> le maximum autorisé en toutes circonstances, même si 50 % du véhicule dépasse ce montant. Par exemple, <em>100 000 DT</em> : même pour un véhicule très cher, le capital DC ne dépassera jamais 100 000 DT.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Prime de Base, Franchise, Taux progressifs :</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400"> les paramètres utilisés par le moteur de calcul pour produire la prime finale du devis.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How they combine */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-purple-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Comment les deux sections se combinent
                  </h3>
                </div>

                <div className="ml-9 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Lorsqu'un client ouvre le menu déroulant du capital DC dans une simulation, le système effectue automatiquement les étapes suivantes :
                  </p>

                  <div className="space-y-2">
                    {[
                      {
                        icon: <Sliders className="w-4 h-4 text-blue-500" />,
                        label: 'Étape 1',
                        color: 'blue',
                        text: 'Le système génère toutes les valeurs disponibles à partir des paliers configurés (Montant Min → Max avec le Pas défini).',
                      },
                      {
                        icon: <Car className="w-4 h-4 text-orange-500" />,
                        label: 'Étape 2',
                        color: 'orange',
                        text: 'Il récupère la valeur vénale du véhicule saisie par le client dans la simulation.',
                      },
                      {
                        icon: <ShieldCheck className="w-4 h-4 text-green-500" />,
                        label: 'Étape 3',
                        color: 'green',
                        text: 'Il calcule le plafond effectif : le minimum entre (Valeur Vénale × Capital Max %) et le Plafond Absolu.',
                      },
                      {
                        icon: <Info className="w-4 h-4 text-purple-500" />,
                        label: 'Étape 4',
                        color: 'purple',
                        text: 'Il filtre la liste des paliers pour ne garder que les valeurs inférieures ou égales à ce plafond effectif. Le client ne voit que les choix valides.',
                      },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
                          {step.icon}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{step.label} — </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{step.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Concrete example box */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                    <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wide mb-3">Exemple complet — Véhicule à 80 000 DT avec LLOYD</p>
                    <div className="space-y-1.5 text-sm text-green-800 dark:text-green-200">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <span>Paliers génèrent : 1k, 2k … 10k, 15k, 20k, 30k, 40k, 50k, 75k, 100k</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <span>Valeur vénale du client = <strong>80 000 DT</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <span>Plafond = min(80 000 × 50%, 100 000) = <strong>40 000 DT</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                        <span>Le client voit uniquement : <strong>1k, 2k … 10k, 15k, 20k, 30k, 40k</strong> ✅</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key reminder */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
                <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wide mb-2">⚠ À retenir pour la configuration</p>
                <ul className="space-y-1.5">
                  {[
                    'Les Paliers DC définissent les intervalles de progression (les "échelons") — sans eux, aucun choix n\'apparaît dans la simulation.',
                    'La Gestion de Tarification DC définit les limites métier (le "plafond") — sans elle, tous les échelons s\'affichent sans tenir compte de la valeur du véhicule.',
                    'Les deux doivent être configurées pour la même compagnie et le même type d\'usage afin que le système puisse les relier automatiquement.',
                    'Le moteur de calcul du devis utilise lui aussi les paramètres de la Gestion de Tarification : la prime affiché au client est donc toujours cohérente avec les choix proposés.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200">
                      <ChevronRight className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Compris, fermer ce guide
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};