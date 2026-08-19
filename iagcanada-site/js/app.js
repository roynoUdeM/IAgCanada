import { NATIONAL_DATA } from "./data.js";
import { VERSION_COURANTE } from "./version.js";

const $ = (selector) => document.querySelector(selector);
const state = { lang: localStorage.getItem("iagcanada_lang") || "fr", view: "synthese", province: "", status: "", query: "", chart: null };
const copy = {
  fr: {
    navSummary: "Synthese", navDirectory: "Repertoire", navProvinces: "Provinces",
    eyebrow: "Observatoire pancanadien", title: "Politiques et ressources IAG dans les systemes scolaires", lede: "Une vue comparee des inventaires documentaires du Quebec, de l'Ontario et de la Colombie-Britannique.",
    notice: "Les fiches restent attribuees a leur observatoire provincial. « Aucun document public repere » signifie qu'aucune publication institutionnelle concluante n'a ete trouvee lors de la verification, et non qu'aucune recherche n'a ete faite.",
    total: "Organisations scolaires", guardrails: "Avec balises ou politiques IAG", material: "Avec materiel pedagogique IAG", sources: "Liens ou sources consignes",
    comparisonTitle: "Comparaison des provinces", comparisonLede: "Part des organisations ayant un statut Oui ou Partiel dans les inventaires provinciaux.", policy: "Balises ou politiques", resources: "Ressources pedagogiques",
    provincesTitle: "Observatoires provinciaux", provincesLede: "Accedez a la veille detaillee et aux documents sources propres a chaque province.", listed: "organisations", documents: "fiches avec sources", open: "Ouvrir l'observatoire",
    directoryTitle: "Repertoire pancanadien", directoryLede: "Filtrez les organisations recensees dans les trois observatoires.", search: "Rechercher une organisation", allProvinces: "Toutes les provinces", allStatuses: "Tous les statuts", name: "Organisation", province: "Province", type: "Type", guardrail: "Balises", teaching: "Materiel", date: "Derniere verification", result: "resultat",
    methodologyTitle: "Portee et methode", sourcesTitle: "Sources et responsabilite", methodOne: "Le registre national est une vue agregée de trois inventaires provinciaux publies.", methodTwo: "Les statuts sont ceux des observatoires d'origine; les definitions et la profondeur de recherche peuvent varier.", methodThree: "Le site national n'etablit pas de nouvelles conclusions institutionnelles.", sourceOne: "Quebec: IAgCSS, centres de services scolaires et commissions scolaires.", sourceTwo: "Ontario: IAgOntario, conseils scolaires.", sourceThree: "Colombie-Britannique: IAgCB, districts scolaires publics.",
    yes: "Oui", partial: "Partiel", no: "Non", unknown: "Aucun document public repere", source: "Source ou observatoire", lastCheck: "Derniere verification", close: "Fermer", sourceCount: "Liens ou sources consignes", footer: "Registre national base sur les observatoires provinciaux.", version: "Version",
  },
  en: {
    navSummary: "Summary", navDirectory: "Directory", navProvinces: "Provinces",
    eyebrow: "Pan-Canadian observatory", title: "GenAI policies and resources in school systems", lede: "A comparative view of documentary inventories from Quebec, Ontario, and British Columbia.",
    notice: "Records remain attributed to their provincial observatory. “No public document found” means no conclusive institutional publication was located during review, not that no research took place.",
    total: "School organizations", guardrails: "With GenAI policies or guardrails", material: "With GenAI teaching resources", sources: "Recorded links or sources",
    comparisonTitle: "Province comparison", comparisonLede: "Share of organizations with a Yes or Partial status in provincial inventories.", policy: "Policies or guardrails", resources: "Teaching resources",
    provincesTitle: "Provincial observatories", provincesLede: "Open detailed monitoring and source documents for each province.", listed: "organizations", documents: "records with sources", open: "Open observatory",
    directoryTitle: "Pan-Canadian directory", directoryLede: "Filter organizations listed across the three observatories.", search: "Search an organization", allProvinces: "All provinces", allStatuses: "All statuses", name: "Organization", province: "Province", type: "Type", guardrail: "Guardrails", teaching: "Material", date: "Last review", result: "result",
    methodologyTitle: "Scope and method", sourcesTitle: "Sources and ownership", methodOne: "The national register is an aggregated view of three published provincial inventories.", methodTwo: "Statuses originate from provincial observatories; definitions and research depth can vary.", methodThree: "The national site does not create new institutional conclusions.", sourceOne: "Quebec: IAgCSS, school service centres and school boards.", sourceTwo: "Ontario: IAgOntario, school boards.", sourceThree: "British Columbia: IAgCB, public school districts.",
    yes: "Yes", partial: "Partial", no: "No", unknown: "No public document found", source: "Source or observatory", lastCheck: "Last review", close: "Close", sourceCount: "Recorded links or sources", footer: "National register based on provincial observatories.", version: "Version",
  },
};

function t(key) { return copy[state.lang][key] || key; }
function make(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}
function link(label, url) {
  const anchor = make("a", "link-button", label);
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noreferrer";
  return anchor;
}
function provinceLabel(id) {
  const province = NATIONAL_DATA.provinces.find((item) => item.id === id);
  return province ? province[state.lang === "fr" ? "labelFr" : "labelEn"] : id;
}
function statusLabel(value) { return t({ oui: "yes", partiel: "partial", non: "no", inconnu: "unknown" }[value] || "unknown"); }
function badge(value) { return make("span", "badge badge-" + (value || "inconnu"), statusLabel(value)); }
function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(value + "T12:00:00");
  return Number.isNaN(parsed.valueOf()) ? value : new Intl.DateTimeFormat(state.lang === "fr" ? "fr-CA" : "en-CA", { dateStyle: "medium" }).format(parsed);
}
function documented(records, field) { return records.filter((record) => ["oui", "partiel"].includes(record[field])).length; }
function withSources(records) { return records.filter((record) => record.sourceCount > 0).length; }
function pct(value, total) { return total ? Math.round((value / total) * 100) : 0; }
function resetView(id) { const view = $("#" + id); view.replaceChildren(); return view; }
function intro(eyebrow, title, lede) {
  const section = make("div", "dashboard-intro");
  section.append(make("p", "eyebrow", eyebrow), make("h1", "", title), make("p", "lede", lede));
  return section;
}
function statCard(value, label, accent, note) {
  const card = make("article", "stat-card " + (accent || ""));
  card.append(make("div", "stat-value", value), make("div", "stat-label", label));
  if (note) card.append(make("div", "stat-note", note));
  return card;
}

function renderNav() {
  const nav = $("#main-nav");
  nav.replaceChildren();
  [["synthese", t("navSummary")], ["repertoire", t("navDirectory")], ["provinces", t("navProvinces")]].forEach(([id, label]) => {
    const button = make("button", state.view === id ? "active" : "", label);
    button.type = "button";
    button.onclick = () => { state.view = id; render(); };
    nav.append(button);
  });
}

function provinceCard(province) {
  const records = NATIONAL_DATA.records.filter((record) => record.province === province.id);
  const card = make("article", "province-card");
  const stats = make("div", "province-stats");
  const policy = make("div");
  policy.append(make("strong", "", documented(records, "statutBalises")), make("span", "", t("policy")));
  const resources = make("div");
  resources.append(make("strong", "", documented(records, "statutMateriel")), make("span", "", t("resources")));
  stats.append(policy, resources);
  card.append(make("p", "eyebrow", provinceLabel(province.id)), make("h3", "", records.length + " " + t("listed")), stats, make("p", "", withSources(records) + " " + t("documents") + " · v" + province.version), link(t("open"), province.url));
  return card;
}

function renderSummary() {
  const view = resetView("synthese");
  const records = NATIONAL_DATA.records;
  const guardrails = documented(records, "statutBalises");
  const materials = documented(records, "statutMateriel");
  view.append(intro(t("eyebrow"), t("title"), t("lede")), make("div", "notice", t("notice")));
  const stats = make("div", "stat-grid");
  stats.append(statCard(records.length, t("total"), "", "3 provinces"), statCard(guardrails + " (" + pct(guardrails, records.length) + "%)", t("guardrails"), "green"), statCard(materials + " (" + pct(materials, records.length) + "%)", t("material"), "gold"), statCard(withSources(records), t("sources"), "grey", NATIONAL_DATA.generatedAt));
  view.append(stats);
  const grid = make("div", "chart-grid");
  const comparison = make("article", "panel");
  comparison.append(make("h2", "", t("comparisonTitle")), make("p", "panel-sub", t("comparisonLede")));
  const chartBox = make("div", "chart-box");
  const canvas = make("canvas");
  chartBox.append(canvas);
  comparison.append(chartBox);
  const provinces = make("article", "panel");
  provinces.append(make("h2", "", t("provincesTitle")), make("p", "panel-sub", t("provincesLede")));
  const provinceGrid = make("div", "province-grid");
  NATIONAL_DATA.provinces.forEach((province) => provinceGrid.append(provinceCard(province)));
  provinces.append(provinceGrid);
  grid.append(comparison, provinces);
  view.append(grid);
  drawComparison(canvas);
}

function drawComparison(canvas) {
  if (!window.Chart) return;
  state.chart?.destroy();
  const byProvince = NATIONAL_DATA.provinces.map((province) => NATIONAL_DATA.records.filter((record) => record.province === province.id));
  state.chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: NATIONAL_DATA.provinces.map((province) => provinceLabel(province.id)),
      datasets: [
        { label: t("policy"), data: byProvince.map((records) => pct(documented(records, "statutBalises"), records.length)), backgroundColor: "#2057a6", borderRadius: 3 },
        { label: t("resources"), data: byProvince.map((records) => pct(documented(records, "statutMateriel"), records.length)), backgroundColor: "#1e8f53", borderRadius: 3 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (value) => value + "%" } } }, plugins: { legend: { position: "bottom" } } },
  });
}

function filteredRecords() {
  const query = state.query.trim().toLowerCase();
  return NATIONAL_DATA.records.filter((record) => {
    const searchable = [record.nom, record.province, record.type, record.langue].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) && (!state.province || record.province === state.province) && (!state.status || [record.statutBalises, record.statutMateriel].includes(state.status));
  }).sort((left, right) => left.nom.localeCompare(right.nom, state.lang));
}
function select(firstLabel, options, value, onChange) {
  const field = make("select");
  const first = make("option", "", firstLabel);
  first.value = "";
  field.append(first);
  options.forEach(([optionValue, label]) => {
    const option = make("option", "", label);
    option.value = optionValue;
    option.selected = value === optionValue;
    field.append(option);
  });
  field.onchange = (event) => onChange(event.target.value);
  return field;
}

function renderDirectory() {
  const view = resetView("repertoire");
  view.append(intro(t("navDirectory"), t("directoryTitle"), t("directoryLede")));
  const filters = make("div", "filters");
  const search = make("input");
  search.type = "search";
  search.value = state.query;
  search.placeholder = t("search");
  search.oninput = (event) => { state.query = event.target.value; renderDirectory(); };
  const result = make("div", "result-count");
  filters.append(search, select(t("allProvinces"), NATIONAL_DATA.provinces.map((province) => [province.id, provinceLabel(province.id)]), state.province, (value) => { state.province = value; renderDirectory(); }), select(t("allStatuses"), ["oui", "partiel", "non", "inconnu"].map((value) => [value, statusLabel(value)]), state.status, (value) => { state.status = value; renderDirectory(); }), result);
  view.append(filters);
  const records = filteredRecords();
  result.textContent = records.length + " " + t("result") + (records.length > 1 ? "s" : "");
  const table = make("table", "records");
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  [t("name"), t("province"), t("type"), t("guardrail"), t("teaching"), t("date")].forEach((label) => headRow.append(make("th", "", label)));
  head.append(headRow);
  const body = document.createElement("tbody");
  records.forEach((record) => {
    const row = document.createElement("tr");
    const name = make("button", "record-button", record.nom);
    name.type = "button";
    name.onclick = () => openDetail(record.id);
    const nameCell = document.createElement("td");
    nameCell.append(name);
    const policyCell = document.createElement("td");
    policyCell.append(badge(record.statutBalises));
    const materialCell = document.createElement("td");
    materialCell.append(badge(record.statutMateriel));
    row.append(nameCell, make("td", "", provinceLabel(record.province)), make("td", "", record.type), policyCell, materialCell, make("td", "", formatDate(record.derniereVerification)));
    body.append(row);
  });
  table.append(head, body);
  const tableWrap = make("div", "table-wrap");
  tableWrap.append(table);
  view.append(tableWrap);
}

function renderProvinces() {
  const view = resetView("provinces");
  view.append(intro(t("navProvinces"), t("provincesTitle"), t("provincesLede")));
  const cards = make("div", "province-grid");
  NATIONAL_DATA.provinces.forEach((province) => cards.append(provinceCard(province)));
  const methodGrid = make("div", "method-grid");
  methodGrid.style.marginTop = "18px";
  const method = make("article", "panel");
  const methodList = make("ul", "method-list");
  [t("methodOne"), t("methodTwo"), t("methodThree")].forEach((item) => methodList.append(make("li", "", item)));
  method.append(make("h2", "", t("methodologyTitle")), methodList);
  const sources = make("article", "panel");
  const sourceList = make("ul", "method-list");
  [t("sourceOne"), t("sourceTwo"), t("sourceThree")].forEach((item) => sourceList.append(make("li", "", item)));
  sources.append(make("h2", "", t("sourcesTitle")), sourceList);
  methodGrid.append(method, sources);
  view.append(cards, methodGrid);
}

function openDetail(id) {
  const record = NATIONAL_DATA.records.find((item) => item.id === id);
  if (!record) return;
  const dialog = $("#detail-dialog");
  dialog.replaceChildren();
  const content = make("div", "dialog-content");
  const top = make("div", "dialog-top");
  const title = make("div");
  title.append(make("p", "eyebrow", provinceLabel(record.province)), make("h2", "", record.nom));
  const close = make("button", "close", "×");
  close.type = "button";
  close.setAttribute("aria-label", t("close"));
  close.onclick = () => dialog.close();
  top.append(title, close);
  const statuses = make("p");
  statuses.append(badge(record.statutBalises), document.createTextNode(" "), badge(record.statutMateriel));
  const actions = make("div", "dialog-actions");
  actions.append(link(t("source"), record.url), link(provinceLabel(record.province), record.observatoire));
  content.append(top, make("p", "meta", record.langue + " · " + record.type + " · " + t("lastCheck") + ": " + formatDate(record.derniereVerification)), statuses, make("p", "", record.description || ""), make("p", "meta", record.sourceCount + " " + t("sourceCount")), actions);
  dialog.append(content);
  dialog.showModal();
}

function render() {
  document.documentElement.lang = state.lang;
  renderNav();
  ["synthese", "repertoire", "provinces"].forEach((id) => $("#" + id).classList.toggle("active", state.view === id));
  if (state.view === "synthese") renderSummary();
  if (state.view === "repertoire") renderDirectory();
  if (state.view === "provinces") renderProvinces();
  $("#footer-note").textContent = t("footer") + " " + NATIONAL_DATA.generatedAt + ".";
  $("#version-button").textContent = t("version") + " " + VERSION_COURANTE.numero;
  $("#version-button").onclick = () => alert(VERSION_COURANTE.numero + " (" + VERSION_COURANTE.date + ")\n" + VERSION_COURANTE.description);
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === state.lang);
    button.onclick = () => { state.lang = button.dataset.lang; localStorage.setItem("iagcanada_lang", state.lang); render(); };
  });
}
render();
