/* Ernesto Investing AI - navegación, preferencias compartidas y formato regional. */
const PAGES = [
  ["index.html", "nav_dash", "dashboard"], ["watchlist.html", "nav_watch", "watchlist"],
  ["trading.html", "nav_trade", "trading"], ["leaderboard.html", "nav_lead", "leaderboard"],
  ["clasificacion.html", "nav_clasif", "clasificacion", 1], ["regresion.html", "nav_reg", "regresion", 1],
  ["optimizador.html", "nav_opt", "optimizador", 1], ["portafolios.html", "nav_port", "portafolios", 1],
  ["backtesting.html", "nav_back", "backtesting", 1], ["perfil.html", "nav_perfil", "perfil"],
  ["configuracion.html", "nav_config", "configuracion"], ["ayuda.html", "nav_ayuda", "ayuda"],
  ["acerca.html", "nav_acerca", "acerca"]
];
const LOCALES = ["es-PE", "en-US", "ar-EG", "ja-JP", "qu-PE"];
const TIMEZONES = ["America/Lima", "America/New_York", "Africa/Cairo", "Asia/Tokyo", "UTC"];
const $ = (selector, root = document) => root.querySelector(selector);
function store(key, value) {
  try {
    if (value === undefined) {
      const saved = localStorage.getItem(key);
      return saved === null ? null : JSON.parse(saved);
    }
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  } catch (_) {
    return null;
  }
}
const locale = () => LOCALES.includes(I18N.state().locale) ? I18N.state().locale : "es-PE";
const timeZone = () => TIMEZONES.includes(I18N.state().tz) ? I18N.state().tz : "America/Lima";

const fmt = {
  n: (value, digits = 2) => I18N.num(Number(value), { minimumFractionDigits: digits, maximumFractionDigits: digits }),
  pct: (value, digits = 2) => I18N.pct(Number(value) / 100, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
  usd: value => I18N.money(Number(value), "USD", { currencyDisplay: "code" }),
  cls: value => value > 0 ? "up" : value < 0 ? "dn" : "mut"
};
const fmtMoney = (value) => fmt.usd(value);
const fmtPct = (value, digits) => fmt.pct(value, digits);
const fmtDate = (date, options) => I18N.dt(date, options);
window.fmtMoney = fmtMoney;
window.fmtPct = fmtPct;
window.fmtDate = fmtDate;

const EIA = {
  lang: locale,
  timeZone,
  t: (key, vars) => I18N.t(key, vars),
  num: (value, options) => I18N.num(value, options),
  money: (value, currency = "USD", options) => I18N.money(value, currency, options),
  pct: (value, options) => I18N.pct(value, options),
  dt: (value, options) => I18N.dt(value, options),
  sort: (items, selector) => I18N.sort(items, selector),
  state: () => I18N.state(),
  setLang(next) {
    if (!LOCALES.includes(next)) return;
    store("eia_locale", next);
    store("eia_lang", next);
    I18N.set({ locale: next });
    I18N.apply();
    location.reload();
  },
  setLocale(next) {
    if (!LOCALES.includes(next)) return;
    store("eia_locale", next);
    store("eia_lang", next);
    I18N.set({ locale: next });
    I18N.apply();
    refreshRegionalShell();
  },
  setTimeZone(next) {
    if (!TIMEZONES.includes(next)) return;
    store("eia_tz", next);
    I18N.set({ tz: next });
    refreshRegionalShell();
  },
  setPseudo(enabled) {
    store("eia_pseudo", enabled ? "1" : "0");
    I18N.set({ pseudo: !!enabled });
    I18N.apply();
    refreshRegionalShell();
  },
  refreshPreferences: refreshRegionalShell,
  setTheme(theme) {
    if (theme !== "dark" && theme !== "light") return;
    applyTheme(theme);
    store("eia_theme", theme);
    const button = $("#tema");
    if (button) button.setAttribute("aria-pressed", theme === "dark");
    if (window.onTheme) window.onTheme(theme);
  },
  ticker: () => store("eia_ticker"),
  setTicker(ticker) { if (ticker) store("eia_ticker", String(ticker).toUpperCase()); },
  portafolio: () => store("eia_pf"),
  setPortafolio(value) { store("eia_pf", value); },
  watch: () => store("eia_watch"),
  trading: () => store("eia_port")
};
window.EIA = EIA;

const cache = {};
async function loadJSON(name) {
  if (cache[name]) return cache[name];
  const response = await fetch("data/" + name);
  if (!response.ok) throw new Error("No se pudo leer data/" + name + " (" + response.status + ")");
  cache[name] = await response.json();
  return cache[name];
}
function applyTheme(theme) {
  if (theme === "dark" || theme === "light") document.documentElement.setAttribute("data-theme", theme);
}
function marketCloseText() {
  const target = $("#market-close");
  if (target) target.textContent = I18N.t("market_close", { time: I18N.dt(I18N.FIXTURE_UTC) });
}
function draftNotice() {
  const notice = $("#draft-notice");
  if (!notice) return;
  const draft = ["ar-EG", "ja-JP", "qu-PE"].includes(locale());
  notice.hidden = !draft;
}
function refreshRegionalShell() {
  document.documentElement.lang = locale();
  document.documentElement.dir = I18N.dir();
  document.documentElement.dataset.timezone = timeZone();
  const quick = $("#idioma");
  if (quick) quick.value = locale();
  const settingsLocale = $("#eia-locale");
  if (settingsLocale) settingsLocale.value = locale();
  const settingsTimezone = $("#eia-tz");
  if (settingsTimezone) settingsTimezone.value = timeZone();
  const pseudo = I18N.state().pseudo;
  const button = $("#i18n-pseudo");
  if (button) button.setAttribute("aria-pressed", String(pseudo));
  const settingsPseudo = $("#eia-pseudo-button");
  if (settingsPseudo) settingsPseudo.setAttribute("aria-pressed", String(pseudo));
  I18N.apply();
  draftNotice();
  marketCloseText();
}

function buildShell() {
  const currentPage = document.body.dataset.page;
  const nav = PAGES.map(([href, key, page, isNew]) =>
    `<li><a href="${href}" data-i18n="${key}" ${page === currentPage ? 'aria-current="page"' : ""} class="${isNew ? "nuevo" : ""}"></a></li>`
  ).join("");
  const labels = {
    "es-PE": "Español (Perú)", "en-US": "English (US)", "ar-EG": "العربية (مصر)",
    "ja-JP": "日本語", "qu-PE": "Runasimi (Quechua)"
  };
  const options = LOCALES.map(value => `<option value="${value}">${labels[value]}</option>`).join("");
  document.body.insertAdjacentHTML("afterbegin", `
    <a class="skip" href="#contenido" data-i18n="skip"></a>
    <header class="top"><div class="bar">
      <a class="brand" href="index.html">Ernesto <span>Investing AI</span></a>
      <nav data-i18n-aria="nav_label"><ul>${nav}</ul></nav><span class="sp"></span>
      <label class="sr-only" for="idioma" data-i18n="lang_label"></label>
      <select id="idioma" class="idioma" aria-label="Idioma">${options}</select>
      <button id="i18n-pseudo" type="button" aria-pressed="false" data-i18n="pseudo" data-i18n-title="pseudo_title"></button>
      <button id="tema" type="button" aria-pressed="false" data-i18n="theme" data-i18n-title="theme_title"></button>
    </div></header>
    <p id="draft-notice" class="aviso" role="note" data-i18n="draft_notice" hidden></p>`);

  const skipLink = $(".skip");
  skipLink.style.position = "fixed";
  skipLink.style.insetInlineStart = "1rem";
  skipLink.style.insetBlockStart = "-999px";
  skipLink.addEventListener("focus", () => { skipLink.style.insetBlockStart = "1rem"; });
  skipLink.addEventListener("blur", () => { skipLink.style.insetBlockStart = "-999px"; });

  const main = $("main");
  if (main) {
    main.id = "contenido";
    main.insertAdjacentHTML("beforeend", `
      <p class="aviso" style="margin-top:2rem" data-i18n="synthetic_notice"></p>
      <p class="mut" id="market-close" role="status" aria-live="polite"></p>`);
  }
  I18N.apply();
  refreshRegionalShell();
  const theme = store("eia_theme");
  applyTheme(theme);
  const prefersDark = matchMedia("(prefers-color-scheme:dark)").matches;
  $("#tema").setAttribute("aria-pressed", theme ? theme === "dark" : prefersDark);
  $("#idioma").addEventListener("change", event => EIA.setLang(event.target.value));
  $("#i18n-pseudo").addEventListener("click", () => EIA.setPseudo(!I18N.state().pseudo));
  $("#tema").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
    EIA.setTheme(current === "dark" ? "light" : "dark");
  });
}
function showError(error) {
  const main = $("main");
  if (main) {
    const notice = document.createElement("p");
    notice.className = "err";
    notice.setAttribute("role", "alert");
    notice.textContent = error.message + ". " + I18N.t("load_error");
    main.prepend(notice);
  }
}
async function initializeI18n() {
  const locales = ["es-PE", "en-US", "ar-EG", "ja-JP", "qu-PE"];
  const dictionaries = await Promise.all(locales.map(async code => {
    const response = await fetch("locales/" + code + ".json");
    if (!response.ok) throw new Error("No se pudo cargar locales/" + code + ".json (" + response.status + ")");
    return [code, await response.json()];
  }));
  const loaded = {};
  dictionaries.forEach(([code, dictionary]) => { loaded[code] = dictionary; });
  I18N.load(loaded);

  const params = new URLSearchParams(location.search);
  const savedLocale = store("eia_locale") || store("eia_lang") || "es-PE";
  const requestedLocale = params.get("locale");
  const selectedLocale = LOCALES.includes(requestedLocale) ? requestedLocale :
    (LOCALES.includes(savedLocale) ? savedLocale : "es-PE");
  const savedTimezone = store("eia_tz");
  const selectedTimezone = TIMEZONES.includes(savedTimezone) ? savedTimezone : "America/Lima";
  const savedPseudo = store("eia_pseudo");
  const requestedPseudo = params.get("pseudo");
  const pseudo = requestedPseudo === "1" ? true : requestedPseudo === "0" ? false :
    (savedPseudo === true || savedPseudo === "1" || savedPseudo === 1);
  I18N.set({ locale: selectedLocale, tz: selectedTimezone, pseudo });
  document.documentElement.lang = selectedLocale;
  document.documentElement.dir = selectedLocale === "ar-EG" ? "rtl" : "ltr";
  store("eia_locale", selectedLocale);
  store("eia_tz", selectedTimezone);
  store("eia_pseudo", pseudo ? "1" : "0");
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initializeI18n();
    buildShell();
    if (window.init) await window.init();
  } catch (error) {
    showError(error);
  }
});
