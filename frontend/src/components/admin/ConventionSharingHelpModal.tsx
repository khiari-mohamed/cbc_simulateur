import { X, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';

interface ConventionSharingHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConventionSharingHelpModal = ({ isOpen, onClose }: ConventionSharingHelpModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Guide d'Utilisation - Partage de Conventions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tout ce que vous devez savoir sur le partage de conventions
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Qu'est-ce que c'est */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                1
              </span>
              Qu'est-ce que le Partage de Conventions ?
            </h3>
            <div className="ml-10 space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Le partage de conventions vous permet de <strong>donner accès à vos conventions</strong> à d'autres organisations, 
                sans avoir à recréer toutes les règles et tarifs.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>💡 Exemple Simple :</strong> Vous avez créé la convention "ATB_CNV" avec des tarifs spéciaux. 
                  Au lieu de recréer la même convention pour l'organisation "BTK", vous la partagez simplement avec eux. 
                  Ils bénéficient des mêmes tarifs instantanément !
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Concepts Clés */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                2
              </span>
              Concepts Clés
            </h3>
            <div className="ml-10 space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                    👑
                  </span>
                  Organisation Propriétaire
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  C'est l'organisation qui a créé la convention. Elle garde le contrôle total et peut partager ou retirer l'accès à tout moment.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                    ✓
                  </span>
                  Organisations Partagées
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Les autres organisations qui ont reçu l'accès. Elles peuvent utiliser la convention mais ne peuvent pas la modifier.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                    1
                  </span>
                  Convention Unique
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Important :</strong> Il n'y a qu'UNE SEULE convention. Pas de copie, pas de duplication. 
                  Si vous modifiez les règles, tous les utilisateurs voient les mêmes changements.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Comment Partager */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                3
              </span>
              Comment Partager une Convention
            </h3>
            <div className="ml-10 space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Trouvez votre convention</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dans la liste des conventions, repérez celle que vous voulez partager
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Cliquez sur "Partager"</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Le bouton se trouve sur la carte de la convention
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Sélectionnez les organisations</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cochez les organisations avec lesquelles vous voulez partager
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Confirmez</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cliquez sur "Partager avec X org(s)" et c'est fait !
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Comment Retirer */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                4
              </span>
              Comment Retirer une Organisation
            </h3>
            <div className="ml-10 space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Ouvrez le partage</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cliquez sur "Partager" sur la convention
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Trouvez l'organisation</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dans la section "Organisations avec accès"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Cliquez sur l'icône de suppression</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Confirmez et l'organisation perd l'accès immédiatement
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Questions Fréquentes */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                ?
              </span>
              Questions Fréquentes
            </h3>
            <div className="ml-10 space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Q: Si je modifie la convention, les organisations partagées voient les changements ?
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  R: Oui ! Il n'y a qu'une seule convention. Toute modification est visible par tous immédiatement.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Q: Puis-je partager avec l'organisation propriétaire ?
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  R: Non, ce n'est pas nécessaire. L'organisation propriétaire a déjà accès automatiquement.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Q: Combien d'organisations puis-je ajouter ?
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  R: Il n'y a pas de limite. Vous pouvez partager avec autant d'organisations que nécessaire.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Q: Que se passe-t-il si je supprime la convention ?
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  R: La convention est supprimée pour tout le monde. Toutes les organisations partagées perdent l'accès automatiquement.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Points Importants */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 text-sm font-bold">
                ⚠️
              </span>
              Points Importants
            </h3>
            <div className="ml-10 space-y-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">✅ À Faire</p>
                <ul className="text-sm text-green-800 dark:text-green-300 space-y-1 list-disc list-inside">
                  <li>Vérifier la convention avant de partager</li>
                  <li>Informer les organisations qu'elles ont accès</li>
                  <li>Surveiller régulièrement qui a accès</li>
                  <li>Retirer les accès inutiles</li>
                </ul>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-2">❌ À Éviter</p>
                <ul className="text-sm text-red-800 dark:text-red-300 space-y-1 list-disc list-inside">
                  <li>Partager sans réfléchir avec toutes les organisations</li>
                  <li>Oublier de retirer l'accès quand ce n'est plus nécessaire</li>
                  <li>Modifier sans prévenir les organisations partagées</li>
                  <li>Confondre partage et création de nouvelle convention</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 7: Cas d'Usage */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                💼
              </span>
              Cas d'Usage Pratiques
            </h3>
            <div className="ml-10 space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  📌 Clients Particuliers
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Vous avez des clients individuels qui ne font pas partie de votre organisation principale.
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  → Créez "Client Particulier" et partagez votre convention avec eux
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  📌 Organisations Partenaires
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Vous travaillez avec plusieurs partenaires et voulez leur offrir les mêmes conditions.
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  → Partagez une convention avec tous les partenaires en même temps
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  📌 Accès Temporaire
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Vous lancez un programme pilote pour 3 mois avec une organisation.
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  → Partagez maintenant, retirez l'accès après 3 mois en un clic
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Communication et Notifications */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold">
                📧
              </span>
              Communication avec les Organisations
            </h3>
            <div className="ml-10 space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">
                  📢 Bonnes Pratiques de Communication
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Avant de partager
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Informez l'organisation par email ou téléphone qu'elle va recevoir l'accès. 
                        Expliquez-leur comment utiliser la convention et donnez-leur le code d'accès si nécessaire.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Après avoir partagé
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Envoyez un email de confirmation avec les détails de la convention partagée. 
                        Incluez les contacts pour le support si nécessaire.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Avant de modifier
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong className="text-orange-600 dark:text-orange-400">Important !</strong> Si vous modifiez une convention partagée, 
                        prévenez TOUTES les organisations partagées. Les changements sont instantanés pour tous.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Avant de retirer l'accès
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Informez l'organisation quelques jours à l'avance. Cela évite les surprises et maintient de bonnes relations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  Rappel Important
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Le système ne notifie PAS automatiquement les organisations. C'est à vous de les informer par email, 
                  téléphone ou tout autre moyen de communication.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Audit et Traçabilité */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                📋
              </span>
              Audit et Traçabilité
            </h3>
            <div className="ml-10 space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
                  🔍 Toutes vos actions sont enregistrées
                </h4>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Le système garde une trace complète de toutes les opérations de partage :
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Qui</strong> a partagé la convention
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Quand</strong> elle a été partagée (date et heure exactes)
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Avec quelle organisation</strong> elle a été partagée
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Qui</strong> a retiré l'accès
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Quand</strong> l'accès a été retiré
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  📊 Comment consulter l'historique
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Pour voir l'historique complet des partages :
                </p>
                <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Allez dans le menu "Audit" ou "Logs d'audit"</li>
                  <li>Filtrez par action : "CONVENTION_SHARED" ou "CONVENTION_UNSHARED"</li>
                  <li>Vous verrez tous les détails de chaque opération</li>
                </ol>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-2 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  Pourquoi c'est important ?
                </p>
                <ul className="text-sm text-green-800 dark:text-green-300 space-y-1 list-disc list-inside">
                  <li>Conformité et sécurité</li>
                  <li>Résolution de problèmes ("Qui a partagé cette convention ?")</li>
                  <li>Suivi des accès pour les audits internes</li>
                  <li>Transparence totale sur les opérations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 10: Cas Particuliers et Limitations */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm font-bold">
                ⚙️
              </span>
              Cas Particuliers et Limitations
            </h3>
            <div className="ml-10 space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  🚫 Organisations Inactives
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Vous ne pouvez partager qu'avec des organisations <strong>actives</strong>.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm text-gray-600 dark:text-gray-400">
                  <p className="mb-1"><strong>Que faire si l'organisation n'apparaît pas ?</strong></p>
                  <p>1. Vérifiez que l'organisation existe dans le système</p>
                  <p>2. Vérifiez qu'elle est marquée comme "Active"</p>
                  <p>3. Si elle est inactive, réactivez-la d'abord</p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  📦 Partage Multiple
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Actuellement, vous devez partager chaque convention <strong>individuellement</strong>.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-sm text-blue-800 dark:text-blue-300">
                  <p className="mb-1"><strong>💡 Astuce :</strong></p>
                  <p>Si vous devez partager plusieurs conventions avec la même organisation, 
                  faites-le une par une. Cela vous permet de garder le contrôle et d'éviter les erreurs.</p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  ⏰ Accès Temporaire
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Le système ne gère pas automatiquement les dates d'expiration.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-3 text-sm text-yellow-800 dark:text-yellow-300">
                  <p className="mb-1"><strong>⚠️ Important :</strong></p>
                  <p>Si vous voulez donner un accès temporaire (ex: 3 mois), vous devez :</p>
                  <p>1. Noter la date de fin dans votre calendrier</p>
                  <p>2. Retirer manuellement l'accès à cette date</p>
                  <p>3. Le système ne le fera pas automatiquement</p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  🔄 Modifications en Cascade
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Toute modification de la convention affecte <strong>immédiatement</strong> toutes les organisations.
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 rounded p-3 text-sm text-red-800 dark:text-red-300">
                  <p className="mb-1"><strong>⚠️ Attention :</strong></p>
                  <p>Si vous changez un tarif de 100 DT à 150 DT, TOUTES les organisations partagées 
                  verront 150 DT instantanément. Il n'y a pas de "version" ou de "copie" séparée.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <Button
            type="button"
            onClick={onClose}
            className="px-6"
          >
            J'ai compris
          </Button>
        </div>
      </div>
    </div>
  );
};
