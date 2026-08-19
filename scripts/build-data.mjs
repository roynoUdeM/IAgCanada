import fs from "node:fs";
import { SEED_DATA as QUEBEC_DATA } from "../../iagcss-site/js/data.js";
import { SEED_DATA as ONTARIO_DATA } from "../../IAgOntario/iagontario-site/js/data.js";
import { SEED_DATA as BC_DATA } from "../../IAgCB/iagcb-site/js/data.js";

const sourceSites = {
  Quebec: "https://iagcss.web.app",
  Ontario: "https://iagontario.web.app",
  "British Columbia": "https://iagcb-observatoire.web.app",
};

function links(value) {
  if (!value) return [];
  if (typeof value === "string") return value.startsWith("http") ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(links);
  if (typeof value === "object") return Object.values(value).flatMap(links);
  return [];
}

function normalize(record, province, fallbackLanguage, typeField) {
  const urls = [
    ...links(record.siteWeb),
    ...links(record.page),
    ...links(record.lienBalises),
    ...links(record.lienMateriel),
    ...links(record.lienDocuments),
    ...links(record.autresLiens),
    ...links(record.documentsDrive),
  ];
  const sourceCount = Array.isArray(record.sources) ? record.sources.length : urls.length;
  return {
    id: province + "-" + record.id,
    sourceId: record.id,
    province,
    nom: record.nom,
    langue: record.langue || fallbackLanguage,
    type: record[typeField] || record.type || "public",
    statutBalises: record.statutBalises || "inconnu",
    statutMateriel: record.statutMateriel || "inconnu",
    derniereVerification: record.derniereVerification || "",
    description: String(record.description || record.notes || "").replace(/\s+/g, " ").slice(0, 520),
    url: urls[0] || sourceSites[province],
    observatoire: sourceSites[province],
    sourceCount,
  };
}

const records = [
  ...QUEBEC_DATA.map((record) => normalize(record, "Quebec", "French", "type")),
  ...ONTARIO_DATA.map((record) => normalize(record, "Ontario", "English", "typeConseil")),
  ...BC_DATA.map((record) => normalize(record, "British Columbia", "English", "typeConseil")),
];

const payload = {
  generatedAt: "2026-08-19",
  provinces: [
    { id: "Quebec", url: sourceSites.Quebec, labelFr: "Quebec", labelEn: "Quebec", version: "1.46" },
    { id: "Ontario", url: sourceSites.Ontario, labelFr: "Ontario", labelEn: "Ontario", version: "1.0.1" },
    { id: "British Columbia", url: sourceSites["British Columbia"], labelFr: "Colombie-Britannique", labelEn: "British Columbia", version: "0.5.1" },
  ],
  records,
};

fs.writeFileSync(
  new URL("../iagcanada-site/js/data.js", import.meta.url),
  "export const NATIONAL_DATA = " + JSON.stringify(payload, null, 2) + ";\n",
);
console.log("Registre national genere :", records.length, "fiches");
