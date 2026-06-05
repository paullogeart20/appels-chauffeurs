# apps-script/

Copies de référence du code Google Apps Script du projet. **Ce code ne vit pas ici** :
il tourne dans le projet Apps Script lié au Google Sheet
(ID `132cw_7ipnTTD-cj2lada1FNLKUfPJu0a-e8pTXVhRf0`), accessible via
**Extensions → Apps Script** depuis le Sheet. Ces fichiers servent à versionner /
documenter ce qui est déployé là-bas — toute modif doit être reportée des deux côtés.

## `RapportQuotidien.gs`

Rapport quotidien envoyé par **vrai email** (`MailApp`) à `paul.logeart@fleetch.net`,
chaque jour à **18h** via un déclencheur horaire.

Pourquoi en Apps Script plutôt qu'en agent distant : l'environnement d'exécution
distant (routine claude.ai) **bloque l'accès réseau** au domaine `appels-chauffeurs.vercel.app`,
et le connecteur Gmail ne sait créer que des brouillons. Apps Script tourne sur l'infra
Google, près des données, et peut envoyer un email réel — c'est la solution fiable.

La fonction relit les données via l'**URL publique de l'Apps Script** (`UrlFetchApp`),
ce qui réutilise le mapping de colonnes exact du `doGet` (l'onglet Réponses n'a pas
d'en-têtes), donc le rapport est cohérent avec le dashboard.

### Mise en place (une fois)
1. **Paramètres du projet** → *Fuseau horaire* = **(GMT+00:00) Abidjan** (= UTC, comme les dates stockées).
2. Exécuter `sendDailyReport` une fois → autoriser les permissions → email de test immédiat.
3. Exécuter `creerDeclencheur18h` une fois → programme l'envoi quotidien à 18h.

Contenu du mail : appels du jour (total + par agent), questionnaires soumis du jour,
cumul (soumis / reste à appeler / rappels / injoignables), et résultats globaux du
questionnaire (note moyenne, +10h/j, exclusivité Yango, risque départ Q12, garage Q18).
