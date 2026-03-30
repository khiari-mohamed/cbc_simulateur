**Objet :** Implémentation du « Fractionnement de la prime » – Paiement semestriel  
**Date :** 26 mars 2026  
**À :** Client / Chef de projet  
**De :** Équipe technique  

---

## 1. Introduction

Conformément à votre demande, nous avons intégré l’option de **fractionnement de la prime** (paiement semestriel) dans le simulateur de devis.  
Désormais, l’utilisateur peut choisir entre deux modes de paiement :

- **Annuel** – paiement annuel (comportement par défaut, inchangé)
- **Semestriel** – paiement semestriel (selon les règles spécifiées)

L’implémentation est **non intrusive et entièrement rétrocompatible** : elle n’affecte ni l’administration, ni les données historiques, ni les formules de tarification existantes.

---

## 2. Emplacement de la sélection

Un nouveau champ **« Fractionnement de la prime »** a été ajouté **juste après le choix de la compagnie**, dans l’étape de sélection des garanties.  
L’utilisateur voit deux options claires :

- **Annuel** – prime annuelle complète  
- **Semestriel** – prime semestrielle (chaque garantie est divisée par deux, les frais et taxes sont recalculés)

*[Captures d’écran disponibles sur demande]*

---

## 3. Logique métier – Calcul semestriel

Lorsque l’utilisateur sélectionne **Semestriel**, le système applique les règles suivantes (conformément au cahier des charges) :

1. **Chaque prime de garantie est divisée par deux**  
   - Par exemple :  
     - Responsabilité civile (RC) : 100 000 DT → 50 000 DT  
     - Vol (VOL) : 20 000 DT → 10 000 DT  
     - Et ainsi de suite pour toutes les garanties sélectionnées.

2. **La prime nette totale (`primeNette`)** est recalculée comme la somme des primes de garanties divisées par deux.

3. **La prime nette de la RC (`primeRC`)** est également recalculée à partir de la garantie RC après division.

4. **Les taxes** sont recalculées selon la formule existante **sur la base des valeurs semestrielles** :  
   - Taxe à 12 % sur (`primeNette` + `frais`)  
   - Taxe à 2 % sur (`primeRC` + `frais`)

5. **Les frais et contributions restent inchangés** :  
   - Frais de dossier (`frais`)  
   - FPAC, FSSR, FGA  
   - Ces montants sont appliqués intégralement (non divisés)

6. **Le total à payer** est calculé comme suit :  
   ```
   totalAPayer = primeNette + frais + taxes + fpac + fssr + fg
   ```

7. **Le mode par défaut est toujours `Annuel`**, garantissant l’absence de régression pour les simulations et devis existants.

---

## 4. Expérience utilisateur

- Le choix de fractionnement est **enregistré avec la simulation** et apparaît dans le récapitulatif.  
- Les cartes de devis indiquent clairement si le montant affiché correspond à **« TTC / an »** ou **« TTC / semestre »**, supprimant toute ambiguïté.  
- La sélection persiste lors de la navigation entre les étapes (changement de formule, sélection de garanties, changement de compagnie, etc.).

---

## 5. Impact sur les données existantes et l’administration

- **Aucune modification** du schéma de base de données.  
- **Aucune modification** des écrans d’administration ou des paramètres configurables.  
- **Aucune modification** des formules de tarification métier – seule une transformation post‑calcul est appliquée pour le mode semestriel.  
- Tous les devis et simulations annuels existants restent exactement dans leur état d’origine.

---

## 6. Vérification et conformité

La fonctionnalité a été testée par rapport aux exigences initiales :

| Exigence | Statut |
|----------|--------|
| Ajout du champ de sélection après le choix de la compagnie | ✅ Implémenté |
| Division par deux de la prime nette de chaque garantie | ✅ Implémenté |
| Conservation des frais / FPAC / FSSR / FGA | ✅ Implémenté |
| Recalcul des taxes selon la formule existante | ✅ Implémenté |
| Mode par défaut annuel | ✅ Implémenté |
| Affichage correct (TTC / an, TTC / semestre) | ✅ Implémenté |
| Non‑régression sur le flux annuel | ✅ Vérifié |

Tous les calculs ont été validés avec des données réelles ; les résultats correspondent parfaitement à la logique métier attendue.

---

## 7. Comment vérifier la fonctionnalité (procédure de test)

Pour valider l’implémentation, vous pouvez suivre les étapes ci‑dessous :

### Étape 1 – Créer une nouvelle simulation
- Accédez au simulateur de devis  
- Saisissez les informations du véhicule et du conducteur

### Étape 2 – Choisir une compagnie
- Sélectionnez une compagnie dans l’étape « Garanties »  
- Le champ « Fractionnement de la prime » apparaît immédiatement après

### Étape 3 – Sélectionner « Semestriel »
- Choisissez l’option **Semestriel**  
- Conservez les autres paramètres inchangés

### Étape 4 – Observer le devis
- Le montant total s’affiche automatiquement  
- Le récapitulatif indique **« TTC / semestre »**

### Étape 5 – Comparer avec le mode annuel
- Repassez en **Annuel**  
- Le total s’actualise et indique **« TTC / an »**  
- La somme annuelle doit être approximativement le double de la partie nette semestrielle (avant application des frais et taxes)

---

## 8. Exemple concret (illustratif)

Supposons qu’une simulation annuelle donne les primes nettes suivantes :

- RC : 100 000 DT  
- VOL : 20 000 DT  
- Autres garanties : 10 000 DT  
- **Prime nette totale annuelle** = 130 000 DT

En mode **Semestriel**, les primes nettes deviennent :

- RC : 50 000 DT  
- VOL : 10 000 DT  
- Autres : 5 000 DT  
- **Prime nette totale semestrielle** = 65 000 DT

Les frais de dossier, FPAC, FSSR, FGA restent intacts ; les taxes sont recalculées sur 65 000 DT + frais.  
Le total affiché correspond alors à **« TTC / semestre »**.

---

## 9. Prochaines étapes

Le module semestriel est **prêt pour la production** et peut être déployé dès que vous le souhaitez.  

Si d’autres extensions sont prévues (notamment un module de gestion et de paiement des termes), nous serons ravis de les intégrer dès que les spécifications seront disponibles.

---

## 10. Conclusion

L’extension « Fractionnement de la prime » a été implémentée conformément à 100 % du cahier des charges fonctionnel. Elle s’intègre parfaitement dans l’application existante, sans en perturber le fonctionnement, et est prête à être utilisée.

Nous restons à votre disposition pour toute démonstration ou pour répondre à vos éventuelles questions.

**Cordialement,**  
L’équipe technique