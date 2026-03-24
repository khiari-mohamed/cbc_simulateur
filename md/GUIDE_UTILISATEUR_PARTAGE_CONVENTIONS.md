# Guide Utilisateur - Partage de Conventions

## 📖 Guide Complet pour Administrateurs

---

## 🎯 Qu'est-ce que le Partage de Conventions ?

### Concept Simple

Imaginez que vous avez créé une convention avec des tarifs et des garanties spécifiques pour votre organisation "ATB". Maintenant, vous voulez que d'autres organisations (comme "BTK" ou "Client Particulier") puissent également bénéficier de cette même convention, **sans avoir à tout recréer**.

Le partage de conventions vous permet de faire exactement cela !

---

## 🔑 Concepts Clés à Comprendre

### 1. Organisation Propriétaire

**C'est quoi ?**
- L'organisation qui a créé la convention en premier
- Elle garde toujours le contrôle total
- Elle peut partager ou retirer l'accès à tout moment

**Exemple :**
- Vous créez la convention "ATB_CNV" pour votre organisation "ATB"
- "ATB" est l'organisation propriétaire
- "ATB" apparaît avec un badge bleu dans le système

### 2. Organisations Partagées

**C'est quoi ?**
- Les autres organisations qui ont reçu l'accès à votre convention
- Elles peuvent utiliser la convention mais ne peuvent pas la modifier
- Elles voient les mêmes tarifs, garanties et règles

**Exemple :**
- Vous partagez "ATB_CNV" avec "BTK"
- Les utilisateurs de "BTK" peuvent maintenant créer des simulations avec "ATB_CNV"
- "BTK" apparaît avec un badge vert dans le système

### 3. Convention Unique

**Important à comprendre :**
- Il n'y a qu'**UNE SEULE** convention "ATB_CNV"
- Pas de copie, pas de duplication
- Si vous modifiez les règles, tous les utilisateurs (ATB et BTK) voient les mêmes changements
- C'est comme partager un document Google Drive : tout le monde voit la même version

---

## 📋 Pourquoi Utiliser le Partage ?

### Cas d'Usage 1 : Clients Particuliers

**Situation :**
Vous avez des clients individuels qui ne font pas partie de votre organisation principale, mais vous voulez leur offrir les mêmes avantages.

**Solution :**
1. Créez une organisation "Client Particulier"
2. Partagez votre convention avec cette organisation
3. Donnez le code d'accès aux clients
4. Ils rejoignent "Client Particulier" et bénéficient de votre convention

**Avantage :**
- Pas besoin de recréer toutes les règles
- Un seul endroit pour gérer les tarifs
- Facile d'ajouter ou retirer l'accès

### Cas d'Usage 2 : Organisations Partenaires

**Situation :**
Vous travaillez avec plusieurs organisations partenaires (BTK, Partenaire A, Partenaire B) et vous voulez leur offrir les mêmes conditions.

**Solution :**
1. Créez une convention pour votre organisation
2. Partagez-la avec toutes les organisations partenaires
3. Chaque partenaire peut l'utiliser immédiatement

**Avantage :**
- Gestion centralisée
- Cohérence des tarifs entre partenaires
- Mise à jour instantanée pour tous

### Cas d'Usage 3 : Accès Temporaire

**Situation :**
Vous lancez un programme pilote avec une organisation pour 3 mois.

**Solution :**
1. Partagez votre convention avec l'organisation pilote
2. Après 3 mois, retirez l'accès en un clic
3. L'organisation n'a plus accès à la convention

**Avantage :**
- Contrôle total sur qui a accès
- Facile d'activer et désactiver
- Pas de contrat compliqué

---

## 🚀 Comment Partager une Convention (Étape par Étape)

### Étape 1 : Accéder à la Page Conventions

1. Connectez-vous en tant qu'administrateur
2. Allez dans le menu "Conventions"
3. Vous verrez la liste de toutes vos conventions

**Ce que vous voyez :**
```
┌─────────────────────────────────────┐
│ ATB_CNV                             │
│ ATB                                 │
│ Active                              │
│                                     │
│ Compagnies: 2                       │
│ Règles: 0                           │
│ Orgs: 0  ← Nombre d'organisations   │
│                                     │
│ [Partager] [Paliers] [✏️] [🗑️]     │
└─────────────────────────────────────┘
```

### Étape 2 : Cliquer sur "Partager"

1. Trouvez la convention que vous voulez partager (ex: ATB_CNV)
2. Cliquez sur le bouton **"Partager"**
3. Une fenêtre s'ouvre

**Ce que vous voyez :**
```
┌─────────────────────────────────────────────┐
│ Partager la convention                      │
│ ATB_CNV                                     │
│                                             │
│ 🔵 Organisation propriétaire                │
│    ATB                                      │
│    Cette organisation est le propriétaire   │
│    principal de la convention               │
│                                             │
│ Ajouter des organisations                   │
│ ☐ BTK (Code: BTK)                          │
│ ☐ Client Particulier (Code: CLIENT_PART)   │
│                                             │
│ 0 organisation(s) sélectionnée(s)          │
│                                             │
│ [Fermer] [Partager avec ...]               │
└─────────────────────────────────────────────┘
```

### Étape 3 : Sélectionner les Organisations

1. Cochez les organisations avec lesquelles vous voulez partager
2. Vous pouvez en sélectionner plusieurs
3. Le compteur se met à jour automatiquement

**Exemple :**
```
☑ BTK (Code: BTK)
☑ Client Particulier (Code: CLIENT_PART)

2 organisation(s) sélectionnée(s)
```

### Étape 4 : Confirmer le Partage

1. Cliquez sur **"Partager avec 2 org(s)"**
2. Un message de succès apparaît : ✅ "Convention partagée avec succès"
3. La fenêtre se ferme automatiquement

### Étape 5 : Vérifier le Partage

Retournez à la liste des conventions. Vous verrez maintenant :

```
┌─────────────────────────────────────┐
│ ATB_CNV                             │
│ ATB                                 │
│ Active                              │
│                                     │
│ 🟢 Partagée avec 2 org(s)           │
│    BTK, Client Particulier          │
│                                     │
│ Compagnies: 2                       │
│ Règles: 0                           │
│ Orgs: 2  ← Mis à jour !             │
│                                     │
│ [Partager] [Paliers] [✏️] [🗑️]     │
└─────────────────────────────────────┘
```

---

## 🗑️ Comment Retirer une Organisation (Étape par Étape)

### Étape 1 : Ouvrir le Partage

1. Cliquez sur **"Partager"** sur la convention
2. La fenêtre s'ouvre

### Étape 2 : Voir les Organisations Partagées

Vous verrez maintenant une nouvelle section :

```
┌─────────────────────────────────────────────┐
│ 🟢 Organisations avec accès (2)             │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 🏢 BTK                              │    │
│ │ Code: BTK                           │    │
│ │ Partagé le 22/03/2026              │    │
│ │                          [🗑️ Retirer]│    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 🏢 Client Particulier               │    │
│ │ Code: CLIENT_PART                   │    │
│ │ Partagé le 22/03/2026              │    │
│ │                          [🗑️ Retirer]│    │
│ └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Étape 3 : Retirer une Organisation

1. Cliquez sur l'icône **🗑️ Retirer** à côté de l'organisation
2. Une confirmation apparaît : "Êtes-vous sûr de vouloir retirer cette organisation ?"
3. Cliquez sur **"Oui"** pour confirmer
4. Message de succès : ✅ "Organisation retirée avec succès"

### Étape 4 : Résultat

- L'organisation disparaît de la liste "Organisations avec accès"
- Elle réapparaît dans "Ajouter des organisations" (vous pouvez la repartager plus tard)
- Les utilisateurs de cette organisation ne peuvent plus accéder à la convention

---

## ❓ Questions Fréquentes

### Q1 : Que se passe-t-il quand je partage une convention ?

**Réponse :**
- Les utilisateurs de l'organisation partagée voient la convention dans leur liste
- Ils peuvent créer des simulations avec cette convention
- Ils bénéficient des mêmes tarifs et garanties que votre organisation
- Ils **NE PEUVENT PAS** modifier la convention (seul le propriétaire peut)

### Q2 : Si je modifie la convention, est-ce que les organisations partagées voient les changements ?

**Réponse :**
Oui ! C'est l'avantage principal :
- Il n'y a qu'une seule convention
- Toute modification est visible par tous immédiatement
- Pas besoin de mettre à jour plusieurs copies

**Exemple :**
1. Vous modifiez le taux de réduction de 10% à 15%
2. Instantanément, ATB et BTK voient 15%
3. Pas de synchronisation manuelle nécessaire

### Q3 : Puis-je partager avec l'organisation propriétaire ?

**Réponse :**
Non, ce n'est pas nécessaire :
- L'organisation propriétaire a déjà accès automatiquement
- Elle n'apparaît pas dans la liste des organisations disponibles
- C'est pour éviter la confusion

### Q4 : Puis-je partager avec une organisation inactive ?

**Réponse :**
Non, pour des raisons de sécurité :
- Seules les organisations actives apparaissent dans la liste
- Si une organisation est désactivée, elle perd automatiquement l'accès
- Vous devez réactiver l'organisation d'abord

### Q5 : Combien d'organisations puis-je ajouter ?

**Réponse :**
- Il n'y a pas de limite technique
- Vous pouvez partager avec autant d'organisations que nécessaire
- Le système affiche les 3 premières + un compteur (ex: "BTK, ATB, Org3 +2")

### Q6 : Que se passe-t-il si je supprime la convention ?

**Réponse :**
- La convention est supprimée pour tout le monde
- Toutes les organisations partagées perdent l'accès
- Les partages sont automatiquement nettoyés
- Aucune action manuelle nécessaire

### Q7 : Que se passe-t-il si je supprime une organisation ?

**Réponse :**
- L'organisation est supprimée du système
- Tous ses partages sont automatiquement retirés
- Les autres organisations gardent leur accès
- La convention continue de fonctionner normalement

### Q8 : Un utilisateur d'une organisation partagée peut-il voir qui d'autre a accès ?

**Réponse :**
Non :
- Les utilisateurs normaux voient seulement les conventions disponibles
- Ils ne voient pas la liste des organisations partagées
- Seuls les administrateurs voient ces informations

### Q9 : Puis-je partager plusieurs conventions en même temps ?

**Réponse :**
Actuellement non :
- Vous devez partager chaque convention individuellement
- Cliquez sur "Partager" pour chaque convention
- C'est pour éviter les erreurs et garder le contrôle

### Q10 : Comment savoir quelles conventions sont partagées ?

**Réponse :**
Plusieurs indicateurs :
- Badge vert "Partagée avec X org(s)" sur la carte
- Compteur "Orgs: X" dans les statistiques
- Liste détaillée quand vous cliquez sur "Partager"

---

## ⚠️ Points Importants à Retenir

### ✅ À Faire

1. **Vérifier avant de partager**
   - Assurez-vous que la convention est correctement configurée
   - Vérifiez les tarifs et garanties
   - Testez avec votre propre organisation d'abord

2. **Communiquer avec les organisations**
   - Informez-les qu'elles ont accès à la convention
   - Expliquez-leur comment l'utiliser
   - Donnez-leur le code d'accès si nécessaire

3. **Surveiller l'utilisation**
   - Vérifiez régulièrement qui a accès
   - Retirez les organisations qui n'en ont plus besoin
   - Gardez la liste à jour

4. **Documenter vos partages**
   - Notez pourquoi vous avez partagé avec chaque organisation
   - Gardez une trace des dates
   - Facilitez la gestion future

### ❌ À Éviter

1. **Ne pas partager sans réfléchir**
   - Ne partagez pas avec toutes les organisations "au cas où"
   - Partagez uniquement avec celles qui en ont vraiment besoin
   - Gardez le contrôle sur vos conventions

2. **Ne pas oublier de retirer l'accès**
   - Si une organisation n'a plus besoin d'accès, retirez-la
   - Ne laissez pas des accès inutiles
   - Sécurité et clarté avant tout

3. **Ne pas modifier sans prévenir**
   - Si vous modifiez une convention partagée, prévenez les organisations
   - Elles verront les changements immédiatement
   - Évitez les surprises

4. **Ne pas confondre avec la création**
   - Le partage n'est PAS la même chose que créer une nouvelle convention
   - Une convention partagée reste unique
   - Tous voient les mêmes données

---

## 🎓 Scénarios Pratiques

### Scénario 1 : Lancement d'un Programme Partenaire

**Contexte :**
Vous lancez un programme avec 3 organisations partenaires (BTK, Partenaire A, Partenaire B).

**Étapes :**
1. Créez la convention "Programme Partenaire 2026"
2. Configurez tous les tarifs et garanties
3. Testez avec votre organisation
4. Cliquez sur "Partager"
5. Sélectionnez BTK, Partenaire A, Partenaire B
6. Cliquez sur "Partager avec 3 org(s)"
7. Informez les partenaires par email

**Résultat :**
- Les 3 partenaires ont accès immédiatement
- Ils peuvent créer des simulations
- Vous gérez tout depuis un seul endroit

### Scénario 2 : Client Particulier Temporaire

**Contexte :**
Un client particulier veut bénéficier de votre convention pour 6 mois.

**Étapes :**
1. Créez l'organisation "Client Particulier - Mars 2026"
2. Partagez votre convention avec cette organisation
3. Donnez le code d'accès au client
4. Le client rejoint l'organisation et utilise la convention
5. Après 6 mois, cliquez sur "Partager"
6. Cliquez sur 🗑️ à côté de "Client Particulier - Mars 2026"
7. Confirmez le retrait

**Résultat :**
- Le client a eu accès pendant 6 mois
- Après retrait, il ne peut plus utiliser la convention
- Aucune trace ne reste dans le système

### Scénario 3 : Mise à Jour de Tarifs

**Contexte :**
Vous devez augmenter les tarifs de 5% pour tous.

**Étapes :**
1. Allez dans la convention partagée
2. Modifiez les tarifs (+5%)
3. Sauvegardez
4. Envoyez un email aux organisations partagées pour les informer

**Résultat :**
- Tous voient les nouveaux tarifs immédiatement
- Pas besoin de mettre à jour plusieurs conventions
- Cohérence garantie

---

## 📊 Comprendre les Indicateurs

### Sur la Carte de Convention

```
┌─────────────────────────────────────┐
│ ATB_CNV                             │
│ ATB                                 │
│ Active                              │
│                                     │
│ 🟢 Partagée avec 2 org(s)           │ ← Badge vert = partagée
│    BTK, Client Particulier          │ ← Noms des organisations
│                                     │
│ Compagnies: 2                       │ ← Nombre de compagnies
│ Règles: 0                           │ ← Nombre de règles de réduction
│ Orgs: 2                             │ ← Nombre d'organisations partagées
│                                     │
│ [Partager] [Paliers] [✏️] [🗑️]     │
└─────────────────────────────────────┘
```

**Légende :**
- **Badge bleu** = Organisation propriétaire
- **Badge vert** = Organisations partagées
- **Orgs: X** = Nombre total d'organisations avec accès (hors propriétaire)

### Dans la Fenêtre de Partage

```
🔵 Organisation propriétaire
   → Celle qui a créé la convention
   → Ne peut pas être retirée
   → A tous les droits

🟢 Organisations avec accès
   → Celles qui ont reçu l'accès
   → Peuvent être retirées
   → Peuvent utiliser mais pas modifier

⚪ Ajouter des organisations
   → Celles qui n'ont pas encore accès
   → Peuvent être ajoutées
   → Organisations actives uniquement
```

---

## 🔐 Sécurité et Contrôle

### Qui Peut Partager ?

**Seuls les administrateurs (ADMINISTRATEUR_ARS) peuvent :**
- Partager des conventions
- Retirer des organisations
- Voir la liste des partages

**Les utilisateurs normaux ne peuvent pas :**
- Voir qui a accès aux conventions
- Partager ou retirer des organisations
- Modifier les paramètres de partage

### Traçabilité

**Chaque action est enregistrée :**
- Qui a partagé la convention
- Quand elle a été partagée
- Avec quelle organisation
- Qui a retiré l'accès
- Quand l'accès a été retiré

**Vous pouvez consulter l'historique dans les logs d'audit.**

### Protection des Données

**Le système garantit :**
- Seules les organisations autorisées ont accès
- Les modifications sont instantanées pour tous
- Les suppressions sont automatiques et propres
- Aucune donnée orpheline ne reste

---

## 💡 Conseils d'Expert

### 1. Nommage Clair

**Mauvais :**
- "Conv1"
- "Test"
- "Nouvelle"

**Bon :**
- "ATB_CNV_2026"
- "Programme Partenaire BTK"
- "Client Particulier - Tarif Réduit"

### 2. Organisation Logique

**Créez des organisations par catégorie :**
- "Clients Particuliers"
- "Partenaires Commerciaux"
- "Programme Pilote"
- "Accès Temporaire"

### 3. Révision Régulière

**Tous les mois :**
- Vérifiez la liste des partages
- Retirez les accès inutiles
- Mettez à jour les conventions si nécessaire

### 4. Communication

**Avant de partager :**
- Informez l'organisation
- Expliquez les conditions
- Donnez les instructions d'utilisation

**Après modification :**
- Prévenez les organisations partagées
- Expliquez les changements
- Répondez aux questions

---

## 📞 Besoin d'Aide ?

### Si vous avez des questions :

1. **Vérifiez ce guide d'abord**
   - La réponse est probablement ici
   - Utilisez la recherche (Ctrl+F)

2. **Vérifiez les logs d'audit**
   - Historique de toutes les actions
   - Qui a fait quoi et quand

3. **Testez dans un environnement de test**
   - Créez une convention de test
   - Partagez avec une organisation de test
   - Vérifiez le comportement

4. **Contactez le support technique**
   - Décrivez le problème précisément
   - Donnez les noms des conventions et organisations
   - Indiquez ce que vous avez déjà essayé

---

## ✅ Checklist de Démarrage

Avant de commencer à utiliser le partage :

- [ ] J'ai compris la différence entre organisation propriétaire et organisations partagées
- [ ] J'ai vérifié que mes conventions sont correctement configurées
- [ ] J'ai créé les organisations nécessaires
- [ ] J'ai testé le partage avec une convention de test
- [ ] J'ai compris comment retirer l'accès
- [ ] J'ai lu les questions fréquentes
- [ ] Je sais où trouver les logs d'audit
- [ ] J'ai préparé la communication pour les organisations

---

**Version du guide :** 1.0.0  
**Date de création :** 22 Mars 2026  
**Dernière mise à jour :** 22 Mars 2026

---

**Ce guide est destiné aux administrateurs non-techniques. Pour la documentation technique, consultez les fichiers CONVENTION_SHARING_IMPLEMENTATION.md et CONVENTION_SHARING_QUICK_GUIDE.md.**
