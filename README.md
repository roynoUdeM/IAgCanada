# IAgCanada

Agregateur des observatoires scolaires de l IA generative du Quebec, de l Ontario et de la Colombie-Britannique.

Le site propose une synthese comparable et un repertoire national. Chaque fiche conserve un lien vers son observatoire provincial ou sa source d origine.

## Mise a jour des donnees

Dans l espace de travail commun, regenerer le registre apres une mise a jour provinciale :

`powershell
node scripts/build-data.mjs
firebase deploy --only hosting --project iagcanada-observatoire --non-interactive
`
