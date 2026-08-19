# IAgCanada

Agrégateur des observatoires scolaires de l'IA générative du Québec, de l'Ontario et de la Colombie-Britannique.

Le site propose une synthèse comparable et un répertoire national. Chaque fiche conserve un lien vers son observatoire provincial ou sa source d'origine.

## Mise à jour des données

Dans l'espace de travail commun, régénérer le registre après une mise à jour provinciale :

`powershell
node scripts/build-data.mjs
firebase deploy --only hosting --project iagcanada-observatoire --non-interactive
`
