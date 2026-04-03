# ⚠️ IMPORTANT: Codes de Garanties - Guide de Référence

## 📋 Codes Obligatoires à Utiliser

Lors de la création ou modification de garanties dans le panneau d'administration, vous **DEVEZ** utiliser ces codes exacts. Le système ne fonctionnera pas avec des abréviations.

### ✅ Garanties Obligatoires (Mandatory)

| Code Correct | ❌ NE PAS Utiliser | Nom Français |
|--------------|-------------------|--------------|
| `RC` | - | Responsabilité Civile |
| `CAS` | - | CAS / Défense et Recours |
| `VOL` | - | Vol |
| `INCENDIE` | ~~INC~~ | Incendie |
| `PERSONNES_TRANSPORTEES` | ~~PTA~~ | Personnes Transportées |
| `ASSISTANCE` | - | Assistance Remorquage |

### ✅ Garanties Optionnelles (Optional)

| Code Correct | ❌ NE PAS Utiliser | Nom Français |
|--------------|-------------------|--------------|
| `DOMMAGES_COLLISIONS` | ~~DC~~ | Dommages Collision |
| `TOUS_RISQUES_ZERO` | ~~TR~~ | Tous Risques |
| `BG` | - | Bris de Glaces |
| `CATASTROPHES_NATURELLES` | ~~CATNAT~~ | Catastrophes Naturelles |
| `DOMMAGES_EMEUTES` | ~~GEMP~~ | Dommages suite émeutes |
| `INCENDIE_EMEUTES` | - | Incendie Suite Emeutes |
| `ASSURANCE_CONDUCTEUR` | ~~IAC~~ | Assurance Conducteur |
| `DEFENSE_RECOURS` | - | Défense et Recours |

---

## 🚨 Erreurs Courantes à Éviter

### ❌ Erreur 1: Utiliser des abréviations
```
Code: INC          ❌ INCORRECT
Code: INCENDIE     ✅ CORRECT
```

### ❌ Erreur 2: Mauvaise casse (majuscules/minuscules)
```
Code: incendie     ❌ INCORRECT
Code: Incendie     ❌ INCORRECT
Code: INCENDIE     ✅ CORRECT
```

### ❌ Erreur 3: Espaces supplémentaires
```
Code: "INCENDIE " ❌ INCORRECT (espace à la fin)
Code: "INCENDIE"  ✅ CORRECT
```

### ❌ Erreur 4: Marquer une garantie obligatoire comme optionnelle
```
INCENDIE - isOptional: true   ❌ INCORRECT
INCENDIE - isOptional: false  ✅ CORRECT
```

---

## 📝 Procédure de Création d'une Garantie

1. **Vérifier** que le code n'existe pas déjà
2. **Copier-coller** le code exact depuis ce document (ne pas taper manuellement)
3. **Vérifier** le statut `isOptional`:
   - `false` pour les garanties obligatoires (RC, CAS, VOL, INCENDIE, PERSONNES_TRANSPORTEES, ASSISTANCE)
   - `true` pour les garanties optionnelles (toutes les autres)
4. **Activer** la garantie (`isActive: true`)

---

## 🔧 Que Faire en Cas d'Erreur?

Si vous avez créé une garantie avec un mauvais code:

1. **NE PAS** supprimer la garantie (cela supprimera les règles de tarification associées)
2. **Contacter** l'équipe technique pour corriger le code
3. Nous exécuterons un script de migration pour corriger le code sans perdre les données

---

## ✅ Garanties Actuellement Configurées (Production)

Toutes les garanties ont été corrigées le 2 avril 2026:

- ✅ RC (Responsabilité Civile) - Mandatory
- ✅ CAS (CAS / Défense et Recours) - Mandatory
- ✅ VOL (Vol) - Mandatory
- ✅ INCENDIE (Incendie) - Mandatory ← **Corrigé de INC**
- ✅ PERSONNES_TRANSPORTEES (Personnes Transportées) - Mandatory ← **Corrigé de PTA**
- ✅ ASSISTANCE (Assistance Remorquage) - Mandatory
- ✅ DOMMAGES_COLLISIONS (Dommages Collision) - Optional ← **Corrigé de DC**
- ✅ TOUS_RISQUES_ZERO (Tous Risques) - Optional ← **Corrigé de TR**
- ✅ BG (Bris de Glaces) - Optional
- ✅ CATASTROPHES_NATURELLES (Catastrophes Naturelles) - Optional ← **Corrigé de CATNAT**
- ✅ DOMMAGES_EMEUTES (Dommages suite émeutes) - Optional ← **Corrigé de GEMP**
- ✅ INCENDIE_EMEUTES (Incendie Suite Emeutes) - Optional
- ✅ ASSURANCE_CONDUCTEUR (Assurance Conducteur) - Optional ← **Corrigé de IAC**

---

## 📞 Support

En cas de doute, **toujours** se référer à ce document avant de créer une nouvelle garantie.

Pour toute question: Contacter l'équipe technique.

---

**Date de dernière mise à jour:** 2 avril 2026
**Version:** 1.0
