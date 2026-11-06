import type { Locale } from "../i18n";

const labels = {
  title: [
    "Help & Support",
    "Hilfe & Support",
    "Ìrànlọ́wọ́ àti Àtìlẹ́yìn",
    "Help & Support",
  ],
  search: [
    "Search the help guide",
    "Hilfe durchsuchen",
    "Wá nínú ìtọ́sọ́nà",
    "Search this help guide",
  ],
  placeholder: [
    "Try save, customer bill, CSV or T01",
    "Zum Beispiel Speichern, Rechnung, CSV oder T01",
    "Gbìyànjú save, customer bill, CSV tàbí T01",
    "Try save, customer bill, CSV or T01",
  ],
  tasks: [
    "Task guides",
    "Aufgabenanleitungen",
    "Ìtọ́sọ́nà iṣẹ́",
    "How to do tasks",
  ],
  tools: [
    "Tool directory",
    "Werkzeugverzeichnis",
    "Àtòjọ irinṣẹ́",
    "All the tools",
  ],
  topics: ["Help topics", "Hilfethemen", "Àwọn kókó ìrànlọ́wọ́", "Help topics"],
  steps: [
    "Where to click, what to enter, what happens",
    "Klicken, eingeben, Ergebnis prüfen",
    "Ibi tí o tẹ̀, ohun tí o kọ, ohun tó ṣẹlẹ̀",
    "Where to click, wetin to enter, wetin go happen",
  ],
  controls: [
    "Buttons and controls",
    "Schaltflächen und Bedienelemente",
    "Bọ́tìnì àti ìṣàkóso",
    "Buttons and controls",
  ],
  control: ["Control", "Bedienelement", "Ìṣàkóso", "Control"],
  action: ["What it does", "Funktion", "Ohun tí ó ń ṣe", "Wetin e dey do"],
  example: [
    "Practice example",
    "Übungsbeispiel",
    "Àpẹẹrẹ ìdánwò",
    "Practice example",
  ],
  notes: ["Remember", "Beachten", "Rántí", "Remember"],
  noResults: [
    "No matching help topics. Try a menu name, save, import, bill or a tool ID.",
    "Keine passenden Themen. Versuchen Sie einen Menünamen, save, import, bill oder eine Werkzeug-ID.",
    "Kò sí kókó tó bá mu. Wá orúkọ àkójọ, save, import, bill tàbí ID irinṣẹ́.",
    "No topic match. Try menu name, save, import, bill or tool ID.",
  ],
  clear: ["Clear search", "Suche löschen", "Pa ìwádìí rẹ́", "Clear search"],
  return: [
    "Return to my work",
    "Zurück zu meiner Arbeit",
    "Padà sí iṣẹ́ mi",
    "Go back to my work",
  ],
  safe: [
    "Your current work stays open underneath this guide.",
    "Ihre aktuelle Arbeit bleibt unter dieser Anleitung geöffnet.",
    "Iṣẹ́ rẹ wà ní ṣíṣí lábẹ́ ìtọ́sọ́nà yìí.",
    "Your current work still dey open under this guide.",
  ],
  language: [
    "",
    "Die ausführlichen Anleitungen sind derzeit auf Englisch. Menünamen verwenden die gewählte App-Sprache; technische Erklärungen sind noch nicht vollständig übersetzt.",
    "Àlàyé kíkún wà ní Gẹ̀ẹ́sì báyìí. Orúkọ àkójọ ń lo èdè app tí o yàn; a kò tíì túmọ̀ gbogbo àlàyé ìmọ̀ ẹ̀rọ.",
    "The full guide dey English for now. Menu names follow your app language; all technical explanations never get full translation.",
  ],
  inputs: [
    "Enter these inputs",
    "Diese Eingaben verwenden",
    "Tẹ àwọn iye wọ̀nyí",
    "Enter these inputs",
  ],
  input: ["Input / unit", "Eingabe / Einheit", "Iye / ẹyọ", "Input / unit"],
  requirement: [
    "How to enter it",
    "Eingabehinweis",
    "Bí o ṣe tẹ ẹ́",
    "How to enter am",
  ],
  exampleValue: [
    "Worked-example value",
    "Beispielwert",
    "Iye àpẹẹrẹ",
    "Example value",
  ],
  required: ["Required", "Erforderlich", "Pàtàkì", "Required"],
  optional: [
    "Optional / model dependent",
    "Optional / modellabhängig",
    "Àṣàyàn / ó dá lórí àwòṣe",
    "Optional / depends on model",
  ],
  notSet: [
    "Left blank in this example",
    "Im Beispiel leer",
    "Ó ṣófo nínú àpẹẹrẹ yìí",
    "Blank for this example",
  ],
  result: [
    "Expected worked-example result",
    "Erwartetes Beispielergebnis",
    "Èsì àpẹẹrẹ tí a retí",
    "Result for this example",
  ],
  formula: [
    "Formula used",
    "Verwendete Formel",
    "Àgbékalẹ̀ tí a lò",
    "Formula wey e use",
  ],
  sources: [
    "Sources and model notes",
    "Quellen und Modellhinweise",
    "Orísun àti àlàyé àwòṣe",
    "Sources and model notes",
  ],
  issue: ["Report an issue", "Problem melden", "Jábọ̀ ìṣòro", "Report problem"],
  fullGuide: [
    "Complete user guide",
    "Vollständiges Benutzerhandbuch",
    "Ìtọ́sọ́nà kíkún",
    "Complete user guide",
  ],
  matches: [
    "matching topics and tools",
    "passende Themen und Werkzeuge",
    "kókó àti irinṣẹ́ tó bá mu",
    "topics and tools match",
  ],
  start: ["Start a project", "Projekt starten", "Bẹ̀rẹ̀ iṣẹ́", "Start project"],
  navigation: [
    "Navigating the platform",
    "Navigation in der Plattform",
    "Lílo ojúlé",
    "How to move around",
  ],
  save: [
    "Save, refresh and resume",
    "Speichern, neu laden und fortsetzen",
    "Fipamọ́, tún ṣí, tẹ̀síwájú",
    "Save, refresh and continue",
  ],
  projectActions: [
    "Project menu and saved work",
    "Projektmenü und gespeicherte Arbeit",
    "Àkójọ iṣẹ́ àti iṣẹ́ tí a fipamọ́",
    "Project menu and saved work",
  ],
  imports: [
    "Import files and supported formats",
    "Dateiimport und unterstützte Formate",
    "Gbé fáìlì wọlé àti irú fáìlì",
    "Import files and formats wey work",
  ],
  bill: [
    "Create and print a customer bill",
    "Kundenbeleg erstellen und drucken",
    "Ṣẹ̀dá kí o tẹ ìwé owó oníbàárà",
    "Create and print customer bill",
  ],
  bom: [
    "Build an estimate from model quantities",
    "Angebot aus Modellmengen erstellen",
    "Ṣẹ̀dá ìṣírò owó láti iye àwòṣe",
    "Use model quantities make estimate",
  ],
  troubleshooting: [
    "Warnings and common problems",
    "Warnungen und häufige Probleme",
    "Ìkìlọ̀ àti ìṣòro tó wọ́pọ̀",
    "Warnings and common problems",
  ],
  support: [
    "Get support",
    "Unterstützung erhalten",
    "Gba ìrànlọ́wọ́",
    "Get support",
  ],
} as const;

export type HelpLabel = keyof typeof labels;
const localeIndex: Record<Locale, 0 | 1 | 2 | 3> = {
  en: 0,
  de: 1,
  yo: 2,
  pcm: 3,
};
export function helpText(locale: Locale, key: HelpLabel): string {
  return labels[key][localeIndex[locale]];
}

export const helpTopicLabels: Record<string, HelpLabel> = {
  start: "start",
  navigation: "navigation",
  save: "save",
  "project-actions": "projectActions",
  imports: "imports",
  bill: "bill",
  bom: "bom",
  troubleshooting: "troubleshooting",
  support: "support",
};
