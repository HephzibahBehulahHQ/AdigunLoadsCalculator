import { planningMessages } from "./planningMessages";
import { workspaceMessages } from "./workspaceMessages";
import { detailMessages } from "./detailMessages";
import { helpMessages } from "./helpMessages";
import { createContext, useContext } from "react";
import { uiMessages } from "./uiMessages";
import { reportMessages } from "./reportMessages";
import {
  engineeringMessages,
  engineeringTemplates,
} from "./engineeringMessages";
export type Locale = "en" | "de" | "yo" | "pcm";
export const languages: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  yo: "Yorùbá",
  pcm: "Nigerian Pidgin",
};
export const LanguageContext = createContext<Locale>("en");
const words: Record<string, [string, string, string]> = {
  Measurements: ["Messdaten", "Àwọn ìwọ̀n", "Measured data"],
  Overview: ["Übersicht", "Àkótán", "Overview"],
  "Load Schedule": ["Lastenliste", "Àtòjọ ẹrù", "Load Schedule"],
  "Boards & Circuits": [
    "Verteiler & Stromkreise",
    "Pánẹ́lì àti àyíká",
    "Boards & Circuits",
  ],
  "Single-Line Studio": [
    "Einlinien-Studio",
    "Àwòrán ìlà kan",
    "Single-Line Studio",
  ],
  "Schedules & Simulation": [
    "Zeitpläne & Simulation",
    "Ìṣètò àti àfọwọ́ṣe",
    "Schedules & Simulation",
  ],
  "Cables & Protection": [
    "Kabel & Schutz",
    "Okùn àti ààbò",
    "Cable & Protection",
  ],
  "Motors & Supply": [
    "Motoren & Versorgung",
    "Mọ́tò àti ìpèsè",
    "Motor & Supply",
  ],
  "Power Quality": ["Netzqualität", "Didara agbára", "Power Quality"],
  "Engineering Toolbox": [
    "Technische Werkzeuge",
    "Àpótí irinṣẹ́",
    "Engineering Tools",
  ],
  "Renewables & Storage": [
    "Erneuerbare & Speicher",
    "Agbára tuntun àti ìpamọ́",
    "Renewables & Storage",
  ],
  "EV & Flexible Loads": [
    "E-Mobilität & flexible Lasten",
    "Ọkọ̀ iná àti ẹrù",
    "EV & Flexible Loads",
  ],
  "Scenarios & Optimization": [
    "Szenarien & Optimierung",
    "Àwọn àṣàyàn àti àtúnṣe",
    "Scenarios & Optimization",
  ],
  "Costs & Carbon": ["Kosten & CO₂", "Owó àti erogba", "Cost & Carbon"],
  "Equipment Library": [
    "Gerätebibliothek",
    "Àkójọpọ̀ ohun èlò",
    "Equipment Library",
  ],
  "Reports & Estimates": [
    "Berichte & Angebote",
    "Ìròyìn àti àfojúsùn owó",
    "Report & Customer Bill",
  ],
  "Engineering Reference": [
    "Technische Referenz",
    "Ìtọ́kasí ìmọ̀ ẹ̀rọ",
    "Engineering Reference",
  ],
  "History & Issues": [
    "Verlauf & Hinweise",
    "Ìtàn àti ìṣòro",
    "History & Issues",
  ],
  Settings: ["Einstellungen", "Ètò", "Settings"],
  Workspace: ["Arbeitsbereich", "Ibùdó iṣẹ́", "Workspace"],
  Engineering: ["Elektrotechnik", "Ìmọ̀ ẹ̀rọ", "Engineering"],
  "Energy & Planning": [
    "Energie & Planung",
    "Agbára àti ìṣètò",
    "Energy & Planning",
  ],
  Resources: ["Ressourcen", "Àwọn orísun", "Resources"],
  "Local workspace": [
    "Lokaler Arbeitsbereich",
    "Ibùdó iṣẹ́ abẹ́lé",
    "Local workspace",
  ],
  "New project": ["Neues Projekt", "Iṣẹ́ tuntun", "New project"],
  "Open project": ["Projekt öffnen", "Ṣí iṣẹ́", "Open project"],
  "Project name": ["Projektname", "Orúkọ iṣẹ́", "Project name"],
  "Project settings": ["Projekteinstellungen", "Ètò iṣẹ́", "Project settings"],
  "Saved locally": [
    "Lokal gespeichert",
    "A ti fipamọ́",
    "Saved for this device",
  ],
  Saving: ["Wird gespeichert", "Ń fipamọ́", "Saving"],
  "Unsaved changes": [
    "Nicht gespeicherte Änderungen",
    "Àtúnṣe tí a kò fipamọ́",
    "Changes never save",
  ],
  "Save failed": ["Speichern fehlgeschlagen", "Ìfipamọ́ kùnà", "Save no work"],
  Save: ["Speichern", "Fipamọ́", "Save"],
  Undo: ["Rückgängig", "Dápadà", "Undo"],
  Redo: ["Wiederholen", "Ṣe lẹ́ẹ̀kan sí i", "Redo"],
  Search: ["Suchen", "Wá", "Search"],
  "Search tools, loads and pages": [
    "Werkzeuge, Lasten und Seiten suchen",
    "Wá irinṣẹ́, ẹrù àti ojú ìwé",
    "Find tools, loads and pages",
  ],
  Calculate: ["Berechnen", "Ṣe ìṣírò", "Calculate"],
  "Add load": ["Last hinzufügen", "Fi ẹrù kún", "Add load"],
  "Edit load": ["Last bearbeiten", "Ṣàtúnṣe ẹrù", "Edit load"],
  Import: ["Importieren", "Gbé wọlé", "Import"],
  Export: ["Exportieren", "Gbé jáde", "Export"],
  "Export project": ["Projekt exportieren", "Gbé iṣẹ́ jáde", "Export project"],
  "Export loads": ["Lasten exportieren", "Gbé ẹrù jáde", "Export loads"],
  "Print report": ["Bericht drucken", "Tẹ ìròyìn jáde", "Print report"],
  "Engineering report": [
    "Technischer Bericht",
    "Ìròyìn ìmọ̀ ẹ̀rọ",
    "Engineering report",
  ],
  "Customer bill": ["Kundenrechnung", "Owó oníbàárà", "Customer bill"],
  "Installed load": [
    "Installierte Leistung",
    "Agbára tí a fi sí",
    "Installed load",
  ],
  "Design demand": ["Auslegungsleistung", "Agbára ìṣètò", "Design demand"],
  "Daily energy": ["Tagesenergie", "Agbára ọjọ́", "Energy per day"],
  "Daily cost": ["Tageskosten", "Owó ọjọ́", "Cost per day"],
  "Apparent power": ["Scheinleistung", "Agbára àpapọ̀", "Apparent power"],
  "Reactive power": ["Blindleistung", "Agbára aláìṣiṣẹ́", "Reactive power"],
  "Power factor": ["Leistungsfaktor", "Ìwọ̀n agbára", "Power factor"],
  "Phase balance": ["Phasenverteilung", "Ìdọ́gba fásì", "Phase balance"],
  "Neutral current": [
    "Neutralleiterstrom",
    "Ìṣàn okùn àárín",
    "Neutral current",
  ],
  "Supply limit": ["Versorgungsgrenze", "Ààlà ìpèsè", "Supply limit"],
  "Demand profile": ["Lastprofil", "Àwòrán ẹrù", "Demand profile"],
  "24-hour estimate": [
    "24-Stunden-Schätzung",
    "Àfojúsùn wákàtí 24",
    "24-hour estimate",
  ],
  "Phase loading": ["Phasenbelastung", "Ẹrù fásì", "Phase loading"],
  "Project health": ["Projektprüfung", "Ìṣàyẹ̀wò iṣẹ́", "Project checks"],
  "No loads yet": ["Noch keine Lasten", "Kò sí ẹrù síbẹ̀", "No load yet"],
  "Build your first power study": [
    "Starten Sie Ihre erste Leistungsstudie",
    "Bẹ̀rẹ̀ ìwádìí agbára rẹ",
    "Start your first power study",
  ],
  "Add equipment to calculate real demand, energy and cost.": [
    "Fügen Sie Geräte hinzu, um Bedarf, Energie und Kosten zu berechnen.",
    "Fi ohun èlò kún láti ṣírò agbára àti owó.",
    "Add your equipment make we calculate demand, energy and cost.",
  ],
  "Open reference case": [
    "Referenzbeispiel öffnen",
    "Ṣí àpẹẹrẹ ìtọ́kasí",
    "Open worked example",
  ],
  "Worked reference case": [
    "Berechnetes Referenzbeispiel",
    "Àpẹẹrẹ ìṣírò",
    "Worked example",
  ],
  "Empty project": ["Leeres Projekt", "Iṣẹ́ òfo", "Empty project"],
  Name: ["Name", "Orúkọ", "Name"],
  Category: ["Kategorie", "Ẹ̀ka", "Category"],
  Quantity: ["Anzahl", "Iye", "Quantity"],
  Rating: ["Nennwert", "Ìwọ̀n", "Rating"],
  Voltage: ["Spannung", "Fọ́ltèjì", "Voltage"],
  Current: ["Strom", "Ìṣàn iná", "Current"],
  Power: ["Leistung", "Agbára", "Power"],
  Energy: ["Energie", "Agbára lílò", "Energy"],
  Cost: ["Kosten", "Owó", "Cost"],
  Phase: ["Phase", "Fásì", "Phase"],
  Connection: ["Anschluss", "Ìsopọ̀", "Connection"],
  "Electrical input (kW)": [
    "Elektrische Aufnahme (kW)",
    "Agbára iná wọlé (kW)",
    "Electrical input (kW)",
  ],
  "Apparent power (kVA)": [
    "Scheinleistung (kVA)",
    "Agbára àpapọ̀ (kVA)",
    "Apparent power (kVA)",
  ],
  "Nameplate current (A)": [
    "Typenschildstrom (A)",
    "Ìṣàn àkọlé (A)",
    "Nameplate current (A)",
  ],
  "Motor shaft output (kW)": [
    "Motor-Wellenleistung (kW)",
    "Agbára ọ̀pá mọ́tò (kW)",
    "Motor shaft output (kW)",
  ],
  "Complex P/Q": ["Komplexe Leistung P/Q", "Agbára P/Q", "Complex P/Q"],
  "Entry mode": ["Eingabemodus", "Ọ̀nà ìwọlé", "Entry mode"],
  "Single phase": ["Einphasig", "Fásì kan", "Single phase"],
  "Three phase": ["Dreiphasig", "Fásì mẹ́ta", "Three phase"],
  "Line to line": [
    "Außenleiter–Außenleiter",
    "Láti ìlà sí ìlà",
    "Line to line",
  ],
  DC: ["Gleichstrom", "Ìṣàn tààrà", "DC"],
  Efficiency: ["Wirkungsgrad", "Ìmúṣẹ", "Efficiency"],
  "Operating hours": ["Betriebsstunden", "Wákàtí iṣẹ́", "Hours of operation"],
  "Start hour": ["Startstunde", "Wákàtí ìbẹ̀rẹ̀", "Start hour"],
  "Energy duty": ["Energie-Tastgrad", "Ìpín àkókò agbára", "Energy duty"],
  Utilization: ["Auslastungsfaktor", "Ìpín agbára lílò", "Utilization"],
  "Standby power": ["Standby-Leistung", "Agbára ìdúró", "Standby power"],
  Lagging: ["Induktiv", "Ìfàsẹ́yìn", "Lagging"],
  Leading: ["Kapazitiv", "Ìṣáájú", "Leading"],
  "Critical load": ["Kritische Last", "Ẹrù pàtàkì", "Critical load"],
  "Lock phase": ["Phase sperren", "Tì fásì", "Lock phase"],
  Provenance: ["Datenherkunft", "Orísun ẹ̀rí", "Source of data"],
  "Source reference": ["Quellenangabe", "Ìtọ́kasí orísun", "Source reference"],
  Nameplate: ["Typenschild", "Àkọlé ohun èlò", "Nameplate"],
  Measured: ["Gemessen", "A wọ̀n án", "Measured"],
  Datasheet: ["Datenblatt", "Ìwé àlàyé", "Datasheet"],
  "User assumption": ["Benutzerannahme", "Èrò olùlò", "Your assumption"],
  "Typical estimate": [
    "Typische Schätzung",
    "Àfojúsùn gbogbogbò",
    "Typical estimate",
  ],
  Notes: ["Notizen", "Àkọsílẹ̀", "Notes"],
  Cancel: ["Abbrechen", "Fagilé", "Cancel"],
  Close: ["Schließen", "Pa dé", "Close"],
  Delete: ["Löschen", "Parẹ́", "Delete"],
  Duplicate: ["Duplizieren", "Ṣe ẹ̀dà", "Duplicate"],
  Edit: ["Bearbeiten", "Ṣàtúnṣe", "Edit"],
  Actions: ["Aktionen", "Ìṣe", "Actions"],
  "All categories": ["Alle Kategorien", "Gbogbo ẹ̀ka", "All categories"],
  "All phases": ["Alle Phasen", "Gbogbo fásì", "All phases"],
  "Selected object": ["Ausgewähltes Objekt", "Ohun tí a yàn", "Selected item"],
  "Calculation trace": [
    "Berechnungsnachweis",
    "Àlàyé ìṣírò",
    "Calculation trace",
  ],
  "Explain result": ["Ergebnis erklären", "Ṣàlàyé èsì", "Explain result"],
  Origin: ["Herkunft", "Orísun", "Origin"],
  Calculated: ["Berechnet", "A ṣírò rẹ̀", "Calculated"],
  Assumptions: ["Annahmen", "Àwọn èrò", "Assumptions"],
  Revision: ["Revision", "Àtúnṣe", "Revision"],
  Issues: ["Hinweise", "Ìṣòro", "Issues"],
  "No unresolved issues": [
    "Keine offenen Hinweise",
    "Kò sí ìṣòro tó kù",
    "No open issue",
  ],
  Incomplete: ["Unvollständig", "Kò tíì pé", "Never complete"],
  "Passed specified check": [
    "Angegebene Prüfung bestanden",
    "Ìṣàyẹ̀wò pàtó kọjá",
    "Specified check pass",
  ],
  "Failed specified check": [
    "Angegebene Prüfung nicht bestanden",
    "Ìṣàyẹ̀wò pàtó kùnà",
    "Specified check fail",
  ],
  "Add board": ["Verteiler hinzufügen", "Fi pánẹ́lì kún", "Add board"],
  "Add circuit": ["Stromkreis hinzufügen", "Fi àyíká kún", "Add circuit"],
  Board: ["Verteiler", "Pánẹ́lì", "Board"],
  Circuit: ["Stromkreis", "Àyíká iná", "Circuit"],
  Unassigned: ["Nicht zugewiesen", "A kò yàn", "Not assigned"],
  "Preview balance": [
    "Phasenausgleich vorschlagen",
    "Ṣàyẹ̀wò ìdọ́gba",
    "Preview phase balance",
  ],
  "Apply changes": ["Änderungen anwenden", "Lo àtúnṣe", "Apply changes"],
  Before: ["Vorher", "Ṣáájú", "Before"],
  After: ["Nachher", "Lẹ́yìn", "After"],
  "No phase moves required": [
    "Keine Phasenverschiebung nötig",
    "Kò nílò ìyípadà fásì",
    "No phase move needed",
  ],
  "Export SVG": ["SVG exportieren", "Gbé SVG jáde", "Export SVG"],
  "Fit view": ["Ansicht einpassen", "Ṣe àwòrán bá iboju", "Fit view"],
  "Flow animation": ["Flussanimation", "Ìṣeré ìṣàn", "Flow animation"],
  "Run simulation": ["Simulation starten", "Ṣe àfọwọ́ṣe", "Run simulation"],
  "Start date": ["Startdatum", "Ọjọ́ ìbẹ̀rẹ̀", "Start date"],
  "End date": ["Enddatum", "Ọjọ́ ìparí", "End date"],
  Timezone: ["Zeitzone", "Agbègbè àkókò", "Timezone"],
  Interval: ["Intervall", "Àárín àkókò", "Interval"],
  "Export series": ["Zeitreihe exportieren", "Gbé àtòjọ jáde", "Export series"],
  Play: ["Abspielen", "Ṣeré", "Play"],
  Pause: ["Pause", "Dúró", "Pause"],
  "Peak demand": ["Spitzenleistung", "Agbára tó ga jù", "Peak demand"],
  Reset: ["Zurücksetzen", "Tún bẹ̀rẹ̀", "Reset"],
  "Load worked example": [
    "Berechnungsbeispiel laden",
    "Ṣí àpẹẹrẹ ìṣírò",
    "Load worked example",
  ],
  "Copy result": ["Ergebnis kopieren", "Da èsì kọ", "Copy result"],
  Method: ["Methode", "Ọ̀nà", "Method"],
  Result: ["Ergebnis", "Èsì", "Result"],
  Sources: ["Quellen", "Àwọn orísun", "Sources"],
  "Search tools": ["Werkzeuge suchen", "Wá irinṣẹ́", "Find tools"],
  "All tools": ["Alle Werkzeuge", "Gbogbo irinṣẹ́", "All tools"],
  "PV capacity": ["PV-Leistung", "Agbára oòrùn", "PV capacity"],
  "Peak sun hours": [
    "Volllast-Sonnenstunden",
    "Wákàtí oòrùn",
    "Peak sun hours",
  ],
  "Performance ratio": ["Performance Ratio", "Ìwọ̀n ìmúṣẹ", "Performance ratio"],
  "Battery capacity": [
    "Batteriekapazität",
    "Agbára bátìrì",
    "Battery capacity",
  ],
  "Initial SOC": ["Anfangsladezustand", "Ìpele bátìrì ìbẹ̀rẹ̀", "Initial SOC"],
  "Minimum SOC": ["Mindestladezustand", "Ìpele bátìrì tó kéré", "Minimum SOC"],
  "Maximum SOC": ["Höchstladezustand", "Ìpele bátìrì tó ga", "Maximum SOC"],
  "Charge power": ["Ladeleistung", "Agbára gbígba", "Charge power"],
  "Discharge power": ["Entladeleistung", "Agbára tújáde", "Discharge power"],
  "Charge efficiency": [
    "Ladewirkungsgrad",
    "Ìmúṣẹ gbígba",
    "Charge efficiency",
  ],
  "Discharge efficiency": [
    "Entladewirkungsgrad",
    "Ìmúṣẹ tújáde",
    "Discharge efficiency",
  ],
  "Grid import": ["Netzbezug", "Agbára wọlé", "Grid import"],
  "Grid export": ["Netzeinspeisung", "Agbára jáde", "Grid export"],
  "PV generation": ["PV-Erzeugung", "Agbára oòrùn tí a ṣe", "PV generation"],
  "Battery stored": [
    "Gespeicherte Energie",
    "Agbára bátìrì tí a pamọ́",
    "Battery energy stored",
  ],
  "Analytical profile": [
    "Analytisches Profil",
    "Àpẹẹrẹ ìṣírò",
    "Analytical profile",
  ],
  "Add session": [
    "Ladevorgang hinzufügen",
    "Fi ìgbà gbígba kún",
    "Add charging session",
  ],
  Arrival: ["Ankunft", "Ìdé", "Arrival"],
  Departure: ["Abfahrt", "Ìlọ", "Departure"],
  "Required energy": ["Benötigte Energie", "Agbára tí a nílò", "Energy needed"],
  "Charger limit": ["Ladepunktgrenze", "Ààlà chaja", "Charger limit"],
  "Vehicle limit": ["Fahrzeuggrenze", "Ààlà ọkọ̀", "Vehicle limit"],
  "Site limit": ["Standortgrenze", "Ààlà ibi", "Site limit"],
  "Delivered energy": [
    "Gelieferte Energie",
    "Agbára tí a fi fún",
    "Energy delivered",
  ],
  "Unmet energy": ["Fehlende Energie", "Agbára tó kù", "Energy shortfall"],
  Feasible: ["Machbar", "Ó ṣeé ṣe", "E fit work"],
  Infeasible: ["Nicht machbar", "Kò ṣeé ṣe", "E no fit work"],
  "Create scenario": ["Szenario erstellen", "Ṣe àṣàyàn", "Create scenario"],
  Baseline: ["Referenz", "Ìpìlẹ̀", "Baseline"],
  Compare: ["Vergleichen", "Fi wé", "Compare"],
  Open: ["Öffnen", "Ṣí", "Open"],
  "Import price": ["Bezugspreis", "Owó wọlé", "Import price"],
  "Export price": ["Einspeisevergütung", "Owó jáde", "Export price"],
  "Standing charge": ["Grundpreis", "Owó ìdúró", "Standing charge"],
  "Demand charge": ["Leistungspreis", "Owó agbára gíga", "Demand charge"],
  Tax: ["Steuer", "Owó orí", "Tax"],
  Currency: ["Währung", "Owó orílẹ̀ èdè", "Currency"],
  "Carbon factor": ["Emissionsfaktor", "Ìwọ̀n erogba", "Carbon factor"],
  "Monthly estimate": ["Monatsschätzung", "Àfojúsùn oṣù", "Monthly estimate"],
  "30-day assumption": ["30-Tage-Annahme", "Èrò ọjọ́ 30", "30-day assumption"],
  Restore: ["Wiederherstellen", "Dápadà", "Restore"],
  "Move to trash": [
    "In Papierkorb verschieben",
    "Gbé sí ibi àfọ̀",
    "Move to trash",
  ],
  Trash: ["Papierkorb", "Àfọ̀", "Trash"],
  Language: ["Sprache", "Èdè", "Language"],
  Theme: ["Darstellung", "Àwọ̀ iboju", "Theme"],
  Dark: ["Dunkel", "Dúdú", "Dark"],
  Light: ["Hell", "Fúnfun", "Light"],
  System: ["System", "Ètò ẹ̀rọ", "System"],
  Motion: ["Animation", "Ìṣeré", "Motion"],
  Reduced: ["Reduziert", "Dín kù", "Reduced"],
  Full: ["Vollständig", "Kíkún", "Full"],
  Frequency: ["Frequenz", "Ìgbà ìṣàn", "Frequency"],
  Jurisdiction: ["Rechtsgebiet", "Agbègbè òfin", "Jurisdiction"],
  Context: ["Anwendungsbereich", "Irú iṣẹ́", "Context"],
  "Coincidence factor": [
    "Gleichzeitigkeitsfaktor",
    "Ìpín ìgbà kan",
    "Coincidence factor",
  ],
  "Growth allowance": ["Zuwachsreserve", "Ìpín ìdàgbàsókè", "Growth allowance"],
  "Local engineering help": [
    "Lokale technische Hilfe",
    "Ìrànlọ́wọ́ ìmọ̀ ẹ̀rọ abẹ́lé",
    "Local engineering help",
  ],
  "Explain my results": [
    "Meine Ergebnisse erklären",
    "Ṣàlàyé èsì mi",
    "Explain my results",
  ],
  "Check missing inputs": [
    "Fehlende Eingaben prüfen",
    "Ṣàyẹ̀wò ohun tí ó kù",
    "Check missing inputs",
  ],
  "Balance phases": ["Phasen ausgleichen", "Ṣe ìdọ́gba fásì", "Balance phases"],
  Send: ["Senden", "Ránṣẹ́", "Send"],
  "Clear history": ["Verlauf löschen", "Pa ìtàn rẹ́", "Clear history"],
  Minimize: ["Minimieren", "Dín kù", "Minimize"],
  Maximize: ["Maximieren", "Fẹ̀ sí i", "Maximize"],
  "Ask about your project": [
    "Fragen zu Ihrem Projekt",
    "Béèrè nípa iṣẹ́ rẹ",
    "Ask about your project",
  ],
  "No connected AI service": [
    "Kein KI-Dienst verbunden",
    "Kò sí iṣẹ́ AI tí a so",
    "No AI service connected",
  ],
  Help: ["Hilfe", "Ìrànlọ́wọ́", "Help"],
  "Preview import": ["Importvorschau", "Ṣàyẹ̀wò ìwọlé", "Preview import"],
  "Apply import": ["Import übernehmen", "Lo ìwọlé", "Apply import"],
  Errors: ["Fehler", "Àṣìṣe", "Errors"],
  "Valid rows": ["Gültige Zeilen", "Ìlà tó tọ́", "Valid rows"],
  "Local only": ["Nur lokal", "Abẹ́lé nìkan", "This device only"],
  "No cloud connection": [
    "Keine Cloud-Verbindung",
    "Kò sí ìsopọ̀ àwọsánmà",
    "No cloud connection",
  ],
  "All results use entered assumptions.": [
    "Alle Ergebnisse beruhen auf eingegebenen Annahmen.",
    "Gbogbo èsì lo èrò tí a tẹ̀ sí.",
    "All results use the assumptions you enter.",
  ],
  "Engineering estimate, not installation approval.": [
    "Technische Schätzung; keine Freigabe der Installation.",
    "Àfojúsùn ìmọ̀ ẹ̀rọ; kì í ṣe ìfọwọ́sí fífi iná sí.",
    "Engineering estimate; installation approval still need proper checks.",
  ],
  "Configure source and evidence": [
    "Quelle und Nachweise konfigurieren",
    "Ṣètò orísun àti ẹ̀rí",
    "Set source and evidence",
  ],
  None: ["Keine", "Kò sí", "None"],
  Back: ["Zurück", "Padà", "Back"],
  Continue: ["Weiter", "Tẹ̀ síwájú", "Continue"],
  Create: ["Erstellen", "Ṣẹ̀dá", "Create"],
  "Update available": [
    "Update verfügbar",
    "Àtúnṣe tuntun wà",
    "Update dey available",
  ],
  "Save and reload": [
    "Speichern und neu laden",
    "Fipamọ́ kí o tún ṣí",
    "Save and reload",
  ],
  "Show details": ["Details anzeigen", "Fi àlàyé hàn", "Show details"],
  "Hide details": ["Details ausblenden", "Fi àlàyé pamọ́", "Hide details"],
  "Add from library": [
    "Aus Bibliothek hinzufügen",
    "Fi kún láti àkójọpọ̀",
    "Add from library",
  ],
};
Object.assign(words, {
  "Load updated": [
    "Verbraucher aktualisiert",
    "A ti ṣe àtúnṣe ohun èlò",
    "Load don update",
  ],
  "Measured intervals": [
    "Gemessene Intervalle",
    "Àwọn àárín àkókò tí a wọn",
    "Measured intervals",
  ],
  "Timestamp column": ["Zeitstempelspalte", "Ọ̀wọ̀ àkókò", "Timestamp column"],
  "Interval-average power column": [
    "Spalte der mittleren Intervallleistung",
    "Ọ̀wọ̀ agbára àárín àkókò lápapọ̀",
    "Column for average power per interval",
  ],
  "Power unit": ["Leistungseinheit", "Ẹyọ agbára", "Power unit"],
  "Declared elapsed interval": [
    "Angegebenes verstrichenes Intervall",
    "Àárín àkókò gidi tí a sọ",
    "Declared elapsed interval",
  ],
  "Preview measured data": [
    "Messdaten prüfen",
    "Ṣàyẹ̀wò dátà ìwọ̀n",
    "Preview measured data",
  ],
  "Save measured data": [
    "Messdaten speichern",
    "Fi dátà ìwọ̀n pamọ́",
    "Save measured data",
  ],
  "Export measurement backup": [
    "Messdatensicherung exportieren",
    "Gba ẹ̀dà ààbò dátà ìwọ̀n",
    "Export measurement backup",
  ],
  "Export cleaned CSV": [
    "Bereinigte CSV exportieren",
    "Gba CSV tí a ti ṣètò",
    "Export cleaned CSV",
  ],
  "Reopen saved measurements": [
    "Gespeicherte Messungen erneut öffnen",
    "Tún ṣí àwọn ìwọ̀n tí a fi pamọ́",
    "Reopen saved measurements",
  ],
  "Observed import energy": [
    "Gemessene Bezugsenergie",
    "Agbára ìwọlé tí a wọn",
    "Measured energy wey enter",
  ],
  "Observed export energy": [
    "Gemessene Einspeiseenergie",
    "Agbára ìjáde tí a wọn",
    "Measured energy wey go out",
  ],
  "Observed net energy": [
    "Gemessene Nettoenergie",
    "Agbára àpapọ̀ ìwọlé yọ ìjáde tí a wọn",
    "Measured import minus export energy",
  ],
  "Timestamp with offset": [
    "Zeitstempel mit UTC-Abweichung",
    "Àkókò pẹ̀lú ìyàtọ̀ sí UTC",
    "Timestamp with UTC offset",
  ],
  "Interval-average power": [
    "Mittlere Intervallleistung",
    "Agbára àárín àkókò lápapọ̀",
    "Average power for the interval",
  ],
  "Interval energy": [
    "Intervallenergie",
    "Agbára tí a lò ní àárín àkókò",
    "Energy for the interval",
  ],
  "Import blocked": [
    "Import blockiert",
    "A dá gbígbé wọlé dúró",
    "Import dey blocked",
  ],
  "Measurement assumptions and coverage warnings": [
    "Messannahmen und Hinweise zur Abdeckung",
    "Àfojúsùn ìwọ̀n àti ìkìlọ̀ nípa àkókò tí dátà bo",
    "Measurement assumptions and coverage warnings",
  ],
  History: ["Verlauf", "Ìtàn", "History"],
  "Electrical fundamentals": [
    "Elektrotechnische Grundlagen",
    "Ìpilẹ̀ ìmọ̀ iná",
    "Electrical basics",
  ],
  "Motors & starting": [
    "Motoren & Anlauf",
    "Mọ́tò àti ìbẹ̀rẹ̀",
    "Motors & starting",
  ],
  "Cables & protection": [
    "Kabel & Schutz",
    "Okun àti ààbò",
    "Cables & protection",
  ],
  "Distribution & supply": [
    "Verteilung & Versorgung",
    "Pípín àti ìpèsè iná",
    "Distribution & supply",
  ],
  "Power quality": ["Netzqualität", "Didara iná", "Power quality"],
  "Renewables & storage": [
    "Erneuerbare & Speicher",
    "Agbára àtúnṣe àti ìpamọ́",
    "Renewables & storage",
  ],
  "EV, energy & economics": [
    "E-Mobilität, Energie & Wirtschaftlichkeit",
    "Ọkọ̀ iná, agbára àti ètò owó",
    "EV, energy & cost planning",
  ],
  "Ohm’s law": ["Ohmsches Gesetz", "Òfin Ohm", "Ohm law"],
  "DC load power & energy": [
    "DC-Lastleistung & Energie",
    "Agbára àti lílo iná DC",
    "DC load power & energy",
  ],
  "Single-phase AC current": [
    "Einphasiger Wechselstrom",
    "Ìṣàn AC fésì kan",
    "Current for single-phase AC",
  ],
  "Three-phase AC current": [
    "Dreiphasiger Wechselstrom",
    "Ìṣàn AC fésì mẹ́ta",
    "Current for three-phase AC",
  ],
  "Signed power triangle": [
    "Leistungsdreieck mit Vorzeichen",
    "Onígun agbára pẹ̀lú àmì",
    "Power triangle with direction signs",
  ],
  "Series & parallel resistance": [
    "Reihen- & Parallelwiderstand",
    "Ìdènà ní tẹ̀lé àti ní ẹ̀gbẹ́",
    "Resistance in series & parallel",
  ],
  "Series RLC impedance": [
    "Impedanz einer RLC-Reihenschaltung",
    "Ìdènà RLC ní tẹ̀lé",
    "Series RLC impedance",
  ],
  "Engineering unit converter": [
    "Technischer Einheitenumrechner",
    "Olùyí ẹyọ ìmọ̀ ẹ̀rọ",
    "Convert engineering units",
  ],
  "Useful output → electrical input": [
    "Nutzleistung → elektrische Aufnahme",
    "Agbára iṣẹ́ → agbára iná wọlé",
    "Useful output → electrical input",
  ],
  "Motor input & full-load current": [
    "Motoraufnahme & Volllaststrom",
    "Ìwọlé mọ́tò àti ìṣàn ẹrù kíkún",
    "Motor input & full-load current",
  ],
  "Torque, speed & shaft power": [
    "Drehmoment, Drehzahl & Wellenleistung",
    "Ipá yíyí, iyára àti agbára ọ̀pá",
    "Torque, speed & shaft power",
  ],
  "Synchronous speed & slip": [
    "Synchrondrehzahl & Schlupf",
    "Iyára ìbámu àti ìyàtọ̀ iyára",
    "Synchronous speed & motor slip",
  ],
  "Star / delta winding relations": [
    "Stern-/Dreieck-Wicklungsgrößen",
    "Ìbáṣepọ̀ wáíńdìńgì star / delta",
    "Star / delta winding relations",
  ],
  "Motor start sequence": [
    "Motor-Anlaufreihenfolge",
    "Ìtòlẹ́sẹẹsẹ ìbẹ̀rẹ̀ mọ́tò",
    "Order for starting motors",
  ],
  "AC voltage drop / rise": [
    "AC-Spannungsfall / -anhebung",
    "Ìsọ̀kalẹ̀ / ìgbéga fọ́ltèjì AC",
    "AC voltage drop / rise",
  ],
  "DC complete-loop voltage drop": [
    "DC-Spannungsfall der vollständigen Schleife",
    "Ìsọ̀kalẹ̀ fọ́ltèjì DC nínú lúpù kíkún",
    "DC voltage drop for the full loop",
  ],
  "Conductor resistance & temperature": [
    "Leiterwiderstand & Temperatur",
    "Ìdènà olùdarí àti ooru",
    "Conductor resistance & temperature",
  ],
  "Route length / cross-section by drop": [
    "Leitungslänge / Querschnitt nach Spannungsfall",
    "Gígùn / àgbègbè okun láti ìsọ̀kalẹ̀ fọ́ltèjì",
    "Cable length / size from voltage drop",
  ],
  "Conductor loss & loss energy": [
    "Leiterverluste & Verlustenergie",
    "Ìpàdánù agbára nínú okun",
    "Conductor power & energy loss",
  ],
  "Cable ampacity correction worksheet": [
    "Arbeitsblatt zur Strombelastbarkeit",
    "Ìwé àtúnṣe àgbára gbígbé ìṣàn okun",
    "Cable current-capacity corrections",
  ],
  "Device, load & cable checks": [
    "Schutzgerät-, Last- & Kabelprüfung",
    "Àyẹ̀wò ẹ̀rọ ààbò, ẹrù àti okun",
    "Device, load & cable checks",
  ],
  "Cable adiabatic withstand": [
    "Adiabatische Kurzschlussfestigkeit",
    "Ìfaradà okun láìsí pàṣípààrọ̀ ooru",
    "Cable short-circuit thermal withstand",
  ],
  "Simplified prospective fault current": [
    "Vereinfachter prospektiver Fehlerstrom",
    "Ìṣírò rọrùn fún ìṣàn àṣìṣe",
    "Simplified prospective fault current",
  ],
  "Loop impedance & disconnection": [
    "Schleifenimpedanz & Abschaltung",
    "Ìdènà lúpù àti gígé iná",
    "Loop impedance & disconnection",
  ],
  "Protective conductor / bonding worksheet": [
    "Arbeitsblatt Schutzleiter / Potenzialausgleich",
    "Ìwé okun ààbò / ìsopọ̀ ìdọ́gba",
    "Protective conductor / bonding worksheet",
  ],
  "Connected & coincident demand": [
    "Anschlussleistung & gleichzeitiger Bedarf",
    "Agbára tí a so àti ìbéèrè ìgbà kan",
    "Connected & same-time demand",
  ],
  "Demand-factor definitions": [
    "Definitionen von Bedarfsfaktoren",
    "Àlàyé àwọn ìpín ìbéèrè",
    "Demand-factor definitions",
  ],
  "Transformer current, loading & losses": [
    "Transformatorstrom, Auslastung & Verluste",
    "Ìṣàn, ẹrù àti ìpàdánù tiransifọ́mà",
    "Transformer current, loading & losses",
  ],
  "Generator capacity worksheet": [
    "Arbeitsblatt Generatorleistung",
    "Ìwé agbára jẹnẹrétọ̀",
    "Generator capacity worksheet",
  ],
  "Inverter & overload envelope": [
    "Wechselrichter & Überlastgrenzen",
    "Íńfátà àti ààlà ẹrù àṣejù",
    "Inverter & overload limits",
  ],
  "UPS energy-based runtime": [
    "USV-Laufzeit aus Energie",
    "Àkókò iṣẹ́ UPS láti agbára",
    "UPS runtime from stored energy",
  ],
  "Phase-current imbalance": [
    "Stromunsymmetrie der Phasen",
    "Àìdọ́gba ìṣàn fésì",
    "Imbalance between phase currents",
  ],
  "Fundamental neutral current": [
    "Neutralleiterstrom der Grundschwingung",
    "Ìṣàn nùtràlì ìpilẹ̀",
    "Fundamental neutral current",
  ],
  "Power-factor correction": [
    "Blindleistungskompensation",
    "Àtúnṣe ìpín agbára",
    "Power-factor correction",
  ],
  "Capacitor element sizing": [
    "Bemessung von Kondensatorelementen",
    "Ìṣírò ìwọ̀n kápásítọ̀",
    "Capacitor element sizing",
  ],
  "Harmonic RMS & THD": [
    "Oberschwingungs-Effektivwert & THD",
    "RMS harmonic àti THD",
    "Harmonic RMS & THD",
  ],
  "PV yield / inverter clipping": [
    "PV-Ertrag / Wechselrichterbegrenzung",
    "Èso PV / ààlà íńfátà",
    "PV yield / inverter power clipping",
  ],
  "PV string voltage & current": [
    "PV-Strangspannung & -strom",
    "Fọ́ltèjì àti ìṣàn okun PV",
    "PV string voltage & current",
  ],
  "Wind supplied-profile energy": [
    "Windenergie aus vorgegebenem Profil",
    "Agbára afẹ́fẹ́ láti àtòjọ tí a fún",
    "Wind energy from supplied profile",
  ],
  "Battery capacity & usable energy": [
    "Batteriekapazität & nutzbare Energie",
    "Agbára bátìrì àti agbára tí a lè lò",
    "Battery capacity & usable energy",
  ],
  "Battery rates & constrained runtime": [
    "Batterieraten & begrenzte Laufzeit",
    "Oṣuwọn bátìrì àti àkókò iṣẹ́ tó ní ààlà",
    "Battery rates & runtime under limits",
  ],
  "Chronological battery dispatch": [
    "Zeitabhängiger Batterieeinsatz",
    "Ìṣètò bátìrì ní ìtòlẹ́sẹẹsẹ àkókò",
    "Battery charging & discharging by time",
  ],
  "EV charging & deadline feasibility": [
    "EV-Laden & Terminmachbarkeit",
    "Gbígba ọkọ̀ iná àti ṣíṣeéṣe àkókò ìparí",
    "EV charging & deadline check",
  ],
  "Managed charging allocation": [
    "Gesteuerte Ladeverteilung",
    "Pípín agbára gbígba tí a ṣàkóso",
    "Managed charging allocation",
  ],
  "Power-profile integration": [
    "Integration des Leistungsprofils",
    "Ìṣírò agbára láti àtòjọ ìṣàn",
    "Energy from a power profile",
  ],
  "Load factor & duration curve": [
    "Lastfaktor & Lastdauerlinie",
    "Ìpín ẹrù àti àwòrán àkókò",
    "Load factor & duration curve",
  ],
  "Standby & replacement savings": [
    "Standby- & Austauscheinsparungen",
    "Ìfipamọ́ agbára ìdúró àti rírọ́pò",
    "Savings from standby & replacement",
  ],
  "Interval tariff & demand bill": [
    "Intervalltarif & Leistungsabrechnung",
    "Owó àkókò àti ìwé owó agbára",
    "Interval tariff & demand bill",
  ],
  "Operational electricity carbon": [
    "Betriebliche Stromemissionen",
    "Erogba láti lílo iná",
    "Carbon from electricity use",
  ],
  "Simple payback & break-even": [
    "Einfache Amortisation & Kostendeckung",
    "Àkókò ìpadà owó àti ìdọ́gba èrè",
    "Simple payback & break-even",
  ],
  "NPV & discount-rate sensitivity": [
    "Kapitalwert & Zinssensitivität",
    "NPV àti ipa oṣuwọn ẹ̀dínwó",
    "NPV & discount-rate sensitivity",
  ],
  Resistance: ["Widerstand", "Ìdènà", "Resistance"],
  "Terminal voltage": [
    "Klemmenspannung",
    "Fọ́ltèjì ní ẹnu ìsopọ̀",
    "Voltage at the terminals",
  ],
  "On-state current per load": [
    "Betriebsstrom je Verbraucher",
    "Ìṣàn nígbà iṣẹ́ fún ẹrù kọ̀ọ̀kan",
    "Current per load while e dey on",
  ],
  "Elapsed operating time": [
    "Verstrichene Betriebszeit",
    "Àkókò iṣẹ́ tó ti kọjá",
    "Actual operating time",
  ],
  "Total power": ["Gesamtleistung", "Àpapọ̀ agbára", "Total power"],
  "Electrical input": [
    "Elektrische Aufnahmeleistung",
    "Agbára iná wọlé",
    "Electrical input",
  ],
  "Line-to-line voltage": [
    "Außenleiterspannung",
    "Fọ́ltèjì láàárín ìlà",
    "Line-to-line voltage",
  ],
  "Line-to-neutral voltage": [
    "Außenleiter-Neutralleiter-Spannung",
    "Fọ́ltèjì láti ìlà sí nùtràlì",
    "Line-to-neutral voltage",
  ],
  "Displacement power factor": [
    "Verschiebungsfaktor cos φ",
    "PF ìyípo fésì",
    "Displacement power factor",
  ],
  "Displacement PF": [
    "Verschiebungsfaktor cos φ",
    "PF ìyípo fésì",
    "Displacement PF",
  ],
  "Reactive behavior": [
    "Blindleistungsverhalten",
    "Ìhùwàsí agbára rìákítífù",
    "Reactive behavior",
  ],
  "Inductive / lagging": [
    "Induktiv / nacheilend",
    "Inductive / lẹ́yìn",
    "Inductive / lagging",
  ],
  "Capacitive / leading": [
    "Kapazitiv / voreilend",
    "Capacitive / ṣáájú",
    "Capacitive / leading",
  ],
  "On-state current": [
    "Strom im eingeschalteten Zustand",
    "Ìṣàn nígbà iṣẹ́",
    "Current while e dey on",
  ],
  "Signed reactive power": [
    "Blindleistung mit Vorzeichen",
    "Agbára rìákítífù pẹ̀lú àmì",
    "Reactive power with direction sign",
  ],
  "Signed real power": [
    "Wirkleistung mit Vorzeichen",
    "Agbára gidi pẹ̀lú àmì",
    "Real power with direction sign",
  ],
  "Apparent power magnitude": [
    "Betrag der Scheinleistung",
    "Ìwọ̀n agbára hàn",
    "Apparent power magnitude",
  ],
  "Power factor magnitude": [
    "Betrag des Leistungsfaktors",
    "Ìwọ̀n ìpín agbára",
    "Power factor magnitude",
  ],
  "Complex-power angle": [
    "Winkel der komplexen Leistung",
    "Igun agbára àkópọ̀",
    "Complex-power angle",
  ],
  "Real-power direction": [
    "Wirkleistungsrichtung",
    "Ìdarí agbára gidi",
    "Real-power direction",
  ],
  "Reactive direction": [
    "Blindleistungsrichtung",
    "Ìdarí agbára rìákítífù",
    "Reactive-power direction",
  ],
  "Export / regeneration": [
    "Einspeisung / Rückspeisung",
    "Fífi iná jáde / ìdá padà",
    "Export / regeneration",
  ],
  Consumption: ["Verbrauch", "Lílo agbára", "Consumption"],
  "No real power": ["Keine Wirkleistung", "Kò sí agbára gidi", "No real power"],
  "Capacitive supply": [
    "Kapazitive Einspeisung",
    "Ìpèsè capacitive",
    "Capacitive supply",
  ],
  "Inductive absorption": [
    "Induktive Aufnahme",
    "Gbígba inductive",
    "Inductive absorption",
  ],
  "Zero reactive power": [
    "Keine Blindleistung",
    "Agbára rìákítífù jẹ́ òdo",
    "Zero reactive power",
  ],
  "Not applicable": ["Nicht anwendbar", "Kò kan án", "E no apply"],
  Topology: ["Topologie", "Ìṣètò ìsopọ̀", "Connection layout"],
  "All series": ["Alle in Reihe", "Gbogbo ní tẹ̀lé", "All in series"],
  "All parallel": ["Alle parallel", "Gbogbo ní ẹ̀gbẹ́", "All in parallel"],
  "Resistance values": [
    "Widerstandswerte",
    "Àwọn iye ìdènà",
    "Resistance values",
  ],
  "Equivalent resistance": [
    "Ersatzwiderstand",
    "Ìdènà dọ́gba",
    "Equivalent resistance",
  ],
  "Number of resistors": [
    "Anzahl Widerstände",
    "Iye àwọn rísísítọ̀",
    "Number of resistors",
  ],
  Inductance: ["Induktivität", "Ìwọ̀n inductance", "Inductance"],
  "Capacitance (0 = capacitor omitted)": [
    "Kapazität (0 = ohne Kondensator)",
    "Capacitance (0 = kò sí kápásítọ̀)",
    "Capacitance (0 means no capacitor)",
  ],
  "Applied RMS voltage": [
    "Angelegte Effektivspannung",
    "Fọ́ltèjì RMS tí a fi sí",
    "Applied RMS voltage",
  ],
  "Inductive reactance": [
    "Induktiver Blindwiderstand",
    "Ìdènà inductive",
    "Inductive reactance",
  ],
  "Capacitive reactance": [
    "Kapazitiver Blindwiderstand",
    "Ìdènà capacitive",
    "Capacitive reactance",
  ],
  "Impedance magnitude": [
    "Impedanzbetrag",
    "Ìwọ̀n ìdènà àkópọ̀",
    "Impedance magnitude",
  ],
  "Impedance angle": ["Impedanzwinkel", "Igun ìdènà àkópọ̀", "Impedance angle"],
  "RMS current": ["Effektivstrom", "Ìṣàn RMS", "RMS current"],
  Conversion: ["Umrechnung", "Ìyípadà ẹyọ", "Conversion"],
  Value: ["Wert", "Iye", "Value"],
  "Converted value": [
    "Umgerechneter Wert",
    "Iye lẹ́yìn ìyípadà",
    "Converted value",
  ],
  "Conversion basis": [
    "Umrechnungsgrundlage",
    "Ìpìlẹ̀ ìyípadà",
    "Conversion basis",
  ],
  "Mechanical output / efficiency": [
    "Mechanische Abgabe / Wirkungsgrad",
    "Agbára ẹ̀rọ jáde / ìmúṣẹ",
    "Mechanical output / efficiency",
  ],
  "Heating or cooling output / COP": [
    "Heiz-/Kühlleistung / COP",
    "Agbára gbígbóná tàbí tútù / COP",
    "Heating or cooling output / COP",
  ],
  "Useful output": ["Nutzleistung", "Agbára iṣẹ́ tó wúlò", "Useful output"],
  "Efficiency (0–1) or COP": [
    "Wirkungsgrad (0–1) oder COP",
    "Ìmúṣẹ (0–1) tàbí COP",
    "Efficiency (0–1) or COP",
  ],
  "Conversion loss": [
    "Umwandlungsverlust",
    "Ìpàdánù ìyípadà",
    "Conversion loss",
  ],
  "Shaft output": ["Wellenleistung", "Agbára ọ̀pá", "Shaft output"],
  "Motor efficiency": ["Motorwirkungsgrad", "Ìmúṣẹ mọ́tò", "Motor efficiency"],
  "Supply voltage": ["Versorgungsspannung", "Fọ́ltèjì ìpèsè", "Supply voltage"],
  "Rotational speed": ["Drehzahl", "Iyára yíyí", "Rotational speed"],
  "Rotor speed": ["Rotordrehzahl", "Iyára rótọ̀", "Rotor speed"],
  "Number of poles": ["Polzahl", "Iye póòlù", "Number of poles"],
  "Supply frequency": ["Netzfrequenz", "Ìgbà ìṣàn ìpèsè", "Supply frequency"],
  "Winding connection": [
    "Wicklungsschaltung",
    "Ìsopọ̀ wáíńdìńgì",
    "Winding connection",
  ],
  "Rated winding voltage": [
    "Wicklungsnennspannung",
    "Fọ́ltèjì ìwọ̀n wáíńdìńgì",
    "Rated winding voltage",
  ],
  "Motor running current": [
    "Motorbetriebsstrom",
    "Ìṣàn mọ́tò nígbà iṣẹ́",
    "Motor current while running",
  ],
  "Motor starting current": [
    "Motoranlaufstrom",
    "Ìṣàn mọ́tò ní ìbẹ̀rẹ̀",
    "Motor starting current",
  ],
  "Motor running displacement PF": [
    "Verschiebungsfaktor im Motorbetrieb",
    "PF ìyípo fésì mọ́tò ní iṣẹ́",
    "Motor displacement PF while running",
  ],
  "Motor starting displacement PF": [
    "Verschiebungsfaktor beim Motoranlauf",
    "PF ìyípo fésì mọ́tò ní ìbẹ̀rẹ̀",
    "Motor displacement PF at start",
  ],
  "Start duration per motor": [
    "Anlaufdauer je Motor",
    "Àkókò ìbẹ̀rẹ̀ fún mọ́tò kan",
    "Start duration per motor",
  ],
  Sequence: ["Reihenfolge", "Ìtòlẹ́sẹẹsẹ", "Sequence"],
  "One-way route length": [
    "Einfache Leitungslänge",
    "Gígùn ọ̀nà lọ nìkan",
    "One-way cable route length",
  ],
  "Conductor resistance": [
    "Leiterwiderstand",
    "Ìdènà olùdarí",
    "Conductor resistance",
  ],
  "Conductor inductive reactance": [
    "Induktiver Leiterblindwiderstand",
    "Ìdènà inductive olùdarí",
    "Conductor inductive reactance",
  ],
  "Conductor cross-section": [
    "Leiterquerschnitt",
    "Àgbègbè àgbélébùú okun",
    "Conductor cross-section",
  ],
  "Operating temperature": [
    "Betriebstemperatur",
    "Ooru nígbà iṣẹ́",
    "Operating temperature",
  ],
  "Reference temperature": [
    "Bezugstemperatur",
    "Ooru ìtọ́kasí",
    "Reference temperature",
  ],
  "Outgoing conductor resistance": [
    "Widerstand des Hinleiters",
    "Ìdènà okun lọ",
    "Outgoing conductor resistance",
  ],
  "Return conductor resistance": [
    "Widerstand des Rückleiters",
    "Ìdènà okun padà",
    "Return conductor resistance",
  ],
  "On-state conductor current": [
    "Leiterstrom im eingeschalteten Zustand",
    "Ìṣàn okun nígbà iṣẹ́",
    "Conductor current while load dey on",
  ],
  "One conductor length": [
    "Länge eines Leiters",
    "Gígùn okun kan",
    "Length of one conductor",
  ],
  "Temperature factor": ["Temperaturfaktor", "Ìpín ooru", "Temperature factor"],
  "Grouping factor": ["Häufungsfaktor", "Ìpín ìkójọpọ̀", "Grouping factor"],
  "Base current-carrying capacity": [
    "Grund-Strombelastbarkeit",
    "Àgbára gbígbé ìṣàn ìpilẹ̀",
    "Base current-carrying capacity",
  ],
  "Design current Ib": [
    "Bemessungsstrom Ib",
    "Ìṣàn ìṣètò Ib",
    "Design current Ib",
  ],
  "Device rating / setting In": [
    "Gerätenennstrom / Einstellung In",
    "Ìwọ̀n / ètò ẹ̀rọ In",
    "Device rating / setting In",
  ],
  "Corrected cable capacity Iz": [
    "Korrigierte Strombelastbarkeit Iz",
    "Àgbára okun lẹ́yìn àtúnṣe Iz",
    "Corrected cable capacity Iz",
  ],
  "Conventional operating current I₂": [
    "Konventioneller Auslösestrom I₂",
    "Ìṣàn iṣẹ́ tí a sọ I₂",
    "Conventional operating current I₂",
  ],
  "Prospective fault current": [
    "Prospektiver Fehlerstrom",
    "Ìṣàn àṣìṣe tí a lè retí",
    "Prospective fault current",
  ],
  "Fault clearing duration": [
    "Fehlerabschaltzeit",
    "Àkókò gígé àṣìṣe",
    "Time to clear the fault",
  ],
  "Complete fault-loop impedance": [
    "Vollständige Fehlerschleifenimpedanz",
    "Ìdènà lúpù àṣìṣe kíkún",
    "Complete fault-loop impedance",
  ],
  "Required disconnection time": [
    "Erforderliche Abschaltzeit",
    "Àkókò gígé tí a nílò",
    "Required disconnection time",
  ],
  "Earthing model": ["Erdungsmodell", "Àwòṣe ìsopọ̀ ilẹ̀", "Earthing model"],
  "Initial stored energy": [
    "Anfänglich gespeicherte Energie",
    "Agbára tí a pamọ́ ní ìbẹ̀rẹ̀",
    "Energy stored at the start",
  ],
  "Minimum stored energy / reserve": [
    "Mindestenergie / Reserve",
    "Agbára ìpamọ́ tó kéré / àfikún",
    "Minimum stored energy / reserve",
  ],
  "Maximum stored energy": [
    "Höchste gespeicherte Energie",
    "Agbára ìpamọ́ tó pọ̀ jù",
    "Maximum stored energy",
  ],
  "Nominal battery voltage": [
    "Batterienennspannung",
    "Fọ́ltèjì ìwọ̀n bátìrì",
    "Nominal battery voltage",
  ],
  "Nominal charge capacity": [
    "Nenn-Ladekapazität",
    "Ìwọ̀n gbígba iná",
    "Nominal charge capacity",
  ],
  "Nominal stored energy": [
    "Nenn-Speicherenergie",
    "Agbára ìpamọ́ ìwọ̀n",
    "Nominal stored energy",
  ],
  "Lower SOC / reserve": [
    "Unterer Ladezustand / Reserve",
    "SOC ìsàlẹ̀ / àfikún",
    "Lower SOC / reserve",
  ],
  "Starting SOC": ["Anfangsladezustand", "SOC ìbẹ̀rẹ̀", "Starting SOC"],
  "Target SOC": ["Ziel-Ladezustand", "SOC tí a fẹ́", "Target SOC"],
  "Maximum AC charge power": [
    "Maximale AC-Ladeleistung",
    "Agbára gbígba AC tó pọ̀ jù",
    "Maximum AC charging power",
  ],
  "Maximum AC discharge power": [
    "Maximale AC-Entladeleistung",
    "Agbára tújáde AC tó pọ̀ jù",
    "Maximum AC discharge power",
  ],
  "AC-to-battery efficiency": [
    "Wirkungsgrad AC zur Batterie",
    "Ìmúṣẹ AC sí bátìrì",
    "Efficiency from AC to battery",
  ],
  "AC-to-stored charge efficiency": [
    "Ladewirkungsgrad AC zum Speicher",
    "Ìmúṣẹ gbígba AC sí ìpamọ́",
    "AC-to-stored charging efficiency",
  ],
  "Stored-to-AC discharge efficiency": [
    "Entladewirkungsgrad Speicher zu AC",
    "Ìmúṣẹ tújáde ìpamọ́ sí AC",
    "Stored-to-AC discharge efficiency",
  ],
  "Load power profile": [
    "Lastleistungsprofil",
    "Àtòjọ agbára ẹrù",
    "Load power profile",
  ],
  "Actual elapsed interval duration": [
    "Tatsächlich verstrichene Intervallzeit",
    "Àkókò àárín gidi tó kọjá",
    "Actual time covered by interval",
  ],
  "Available generation power profile": [
    "Verfügbares Erzeugungsprofil",
    "Àtòjọ agbára tí a lè ṣe",
    "Available generation power profile",
  ],
  "Charger power limit": [
    "Ladeleistungsgrenze",
    "Ààlà agbára chaja",
    "Charger power limit",
  ],
  "Vehicle acceptance limit": [
    "Fahrzeug-Aufnahmegrenze",
    "Ààlà gbígba ọkọ̀",
    "Vehicle charging limit",
  ],
  "Actual elapsed charging window": [
    "Tatsächlich verfügbare Ladezeit",
    "Àkókò gbígba gidi",
    "Actual available charging time",
  ],
  "AC-to-battery charging efficiency": [
    "Ladewirkungsgrad AC zur Batterie",
    "Ìmúṣẹ gbígba AC sí bátìrì",
    "AC-to-battery charging efficiency",
  ],
  "Physical imported electricity": [
    "Physikalisch bezogener Strom",
    "Iná tí a gbà wọlé gidi",
    "Electricity physically imported",
  ],
  "Operational emissions factor": [
    "Betrieblicher Emissionsfaktor",
    "Ìpín ìtújáde erogba ní iṣẹ́",
    "Operational emissions factor",
  ],
  "Initial investment": [
    "Anfangsinvestition",
    "Owó ìdókòwò ìbẹ̀rẹ̀",
    "Initial investment",
  ],
  "Annual discount rate": [
    "Jährlicher Kalkulationszins",
    "Oṣuwọn ẹ̀dínwó ọdún",
    "Annual discount rate",
  ],
  "Number of years": ["Anzahl Jahre", "Iye ọdún", "Number of years"],
  "Energy price": ["Energiepreis", "Owó agbára", "Energy price"],
  "Tax rate": ["Steuersatz", "Oṣuwọn owó-orí", "Tax rate"],
  "Tax basis": ["Steuerbemessungsgrundlage", "Ìpìlẹ̀ owó-orí", "Tax basis"],
  "Currency denomination": [
    "Währungsbezeichnung",
    "Irú owó",
    "Currency denomination",
  ],
  General: ["Allgemein", "Gbogbogbò", "General"],
  Lighting: ["Beleuchtung", "Ìmọ́lẹ̀", "Lighting"],
  Heating: ["Heizung", "Gbígbóná", "Heating"],
  HVAC: [
    "Heizung, Lüftung, Klima",
    "Ooru, afẹ́fẹ́ àti tútù",
    "Heating, ventilation & cooling",
  ],
  "IT & servers": ["IT & Server", "IT àti sáfà", "IT & servers"],
  Motor: ["Motor", "Mọ́tò", "Motor"],
  Workshop: ["Werkstatt", "Ilé iṣẹ́ ọwọ́", "Workshop"],
  EV: ["Elektrofahrzeug", "Ọkọ̀ iná", "Electric vehicle"],
  Pumps: ["Pumpen", "Pọ́ọ̀mù", "Pumps"],
  Appliances: ["Haushaltsgeräte", "Ohun èlò ilé", "Appliances"],
  "Phase pair": ["Phasenpaar", "Fésì méjì", "Phase pair"],
  "Enter a name and rating.": [
    "Name und Nennwert eingeben.",
    "Tẹ orúkọ àti ìwọ̀n sílẹ̀.",
    "Enter name and rating.",
  ],
  "Hourly PV profile, 00:00–23:00": [
    "Stündliches PV-Profil, 00:00–23:00",
    "Àtòjọ PV wákàtí, 00:00–23:00",
    "Hourly PV profile, 00:00–23:00",
  ],
  "Entered generation fractions. Peak-sun-hours alone does not create a chronological profile.":
    [
      "Eingegebene Erzeugungsanteile. Volllast-Sonnenstunden allein ergeben kein zeitliches Profil.",
      "Àwọn ìpín agbára tí a tẹ sílẹ̀. Wákàtí oòrùn nìkan kò dá àtòjọ àkókò sílẹ̀.",
      "Na entered generation fractions. Peak-sun-hours alone no fit create chronological profile.",
    ],
  "Island-capable supply with verified transfer/isolation arrangement": [
    "Inselfähige Versorgung mit überprüfter Umschalt-/Trenneinrichtung",
    "Ìpèsè erékùṣù pẹ̀lú ìyípadà / ìyapa tí a ṣàyẹ̀wò",
    "Island-capable supply with verified transfer/isolation",
  ],
  "Simulate grid outage": [
    "Netzausfall simulieren",
    "Ṣe àfọwọ́ṣe pípà iná",
    "Simulate when grid power goes off",
  ],
  "Outage duration": [
    "Ausfalldauer",
    "Àkókò pípà iná",
    "How long outage lasts",
  ],
  "Gold: PV · Violet: load": [
    "Gold: PV · Violett: Last",
    "Góòlù: PV · Àlùkò: ẹrù",
    "Gold: PV · Violet: load",
  ],
  "Conversion losses": [
    "Umwandlungsverluste",
    "Ìpàdánù ìyípadà",
    "Conversion losses",
  ],
  "Energy balance error": [
    "Fehler der Energiebilanz",
    "Àṣìṣe ìdọ́gba agbára",
    "Energy balance error",
  ],
  "Charging strategy": ["Ladestrategie", "Ọ̀nà gbígba", "Charging strategy"],
  "Immediate charging": [
    "Sofortladen",
    "Gbígba lẹ́sẹ̀kẹsẹ̀",
    "Charge immediately",
  ],
  "Lowest-cost available intervals": [
    "Günstigste verfügbare Intervalle",
    "Àkókò tí owó rẹ̀ kéré jù",
    "Available intervals wey cost least",
  ],
  "Time-of-use bands": [
    "Zeitabhängige Tarifzonen",
    "Àwọn ẹgbẹ́ owó àkókò",
    "Time-of-use tariff bands",
  ],
  "Band name": ["Tarifzonenname", "Orúkọ ẹgbẹ́ owó", "Tariff band name"],
  "Add tariff band": [
    "Tarifzone hinzufügen",
    "Fi ẹgbẹ́ owó kún un",
    "Add tariff band",
  ],
  "Uncovered hours use the flat import price. Overlapping bands are rejected. Demand charges use the largest modeled hourly average in the repeated-day estimate.":
    [
      "Nicht abgedeckte Stunden verwenden den festen Bezugspreis. Überschneidungen werden abgewiesen. Leistungskosten nutzen den höchsten modellierten Stundenmittelwert der wiederholten Tagesschätzung.",
      "Wákàtí tí a kò bo lo owó wọlé àìyípadà. A kọ ẹgbẹ́ tí ó bọ́ sí ara wọn. Owó agbára lo ìpín wákàtí tó ga jù nínú àfojúsùn ọjọ́.",
      "Hours wey band no cover use flat import price. Bands no fit overlap. Demand charges use highest modeled hourly average for the repeated-day estimate.",
    ],
  Ways: ["Teilungseinheiten", "Àwọn àyè", "Board ways"],
  "Grid / supply": ["Netz / Versorgung", "Nẹ́tíwọ́ọ̀kì / ìpèsè", "Grid / supply"],
  Hour: ["Stunde", "Wákàtí", "Hour"],
  "Timeline hour": ["Stunde der Zeitleiste", "Wákàtí àtòjọ", "Timeline hour"],
  "Zoom in": ["Vergrößern", "Fẹ̀ sí i", "Zoom in"],
  "Zoom out": ["Verkleinern", "Dín kù", "Zoom out"],
  "Collapse navigation": [
    "Navigation einklappen",
    "Pa àtòjọ ìrìn dé",
    "Hide navigation",
  ],
  "Open navigation": ["Navigation öffnen", "Ṣí àtòjọ ìrìn", "Open navigation"],
  "Main navigation": [
    "Hauptnavigation",
    "Àtòjọ ìrìn pàtàkì",
    "Main navigation",
  ],
  Keyboard: ["Tastatur", "Bọ́tìnì ẹ̀rọ", "Keyboard"],
  Engine: ["Berechnungskern", "Ẹ̀rọ ìṣírò", "Calculation engine"],
  "Open Adigun BOT": ["Adigun BOT öffnen", "Ṣí Adigun BOT", "Open Adigun BOT"],
  "Open / restore Adigun BOT": [
    "Adigun BOT öffnen / wiederherstellen",
    "Ṣí / dá Adigun BOT padà",
    "Open / restore Adigun BOT",
  ],
  "Connected AI requires an authenticated backend. API keys are never stored in this browser application.":
    [
      "Verbundene KI benötigt einen authentifizierten Backend-Dienst. API-Schlüssel werden nie in dieser Browseranwendung gespeichert.",
      "AI tí a so nílò ẹ̀rọ ẹ̀yìn pẹ̀lú ìjẹ́rìísí. A kì í fi kọ́kọ́rọ́ API pamọ́ nínú aṣàwákiri yìí.",
      "Connected AI needs authenticated backend. This browser app no dey store API keys.",
    ],
  "Local revisions and undo history. Export a project backup for recovery on another device.":
    [
      "Lokale Revisionen und Rückgängig-Verlauf. Exportieren Sie eine Projektsicherung zur Wiederherstellung auf einem anderen Gerät.",
      "Àtúnṣe abẹ́lé àti ìtàn dápadà. Gba ẹ̀dà iṣẹ́ fún dídápadà lórí ẹ̀rọ mìíràn.",
      "Local revisions and undo history. Export project backup to recover am for another device.",
    ],
  "These are opt-in analytical cases with entered assumptions and independent expected results. They are saved as new projects.":
    [
      "Diese freiwillig geöffneten Rechenbeispiele enthalten eingegebene Annahmen und unabhängige Sollwerte. Sie werden als neue Projekte gespeichert.",
      "Àwọn àpẹẹrẹ ìṣírò tí o yàn ni, pẹ̀lú àfojúsùn àti èsì ìtọ́kasí. A fi wọ́n pamọ́ bí iṣẹ́ tuntun.",
      "Na optional worked cases with entered assumptions and independent expected results. Dem save as new projects.",
    ],
  "On-state conductor current and energy duty are separate. Three-phase supply assumes a stiff neutral. True power factor does not determine a harmonic spectrum. Manual cable/device data must include its source.":
    [
      "Leiterstrom im Betrieb und Energie-Tastgrad sind getrennt. Dreiphasige Versorgung nimmt einen festen Neutralpunkt an. Der Gesamtleistungsfaktor bestimmt kein Oberschwingungsspektrum. Manuelle Kabel-/Gerätedaten benötigen eine Quelle.",
      "Ìṣàn okun ní iṣẹ́ àti ìpín àkókò agbára yàtọ̀. Ìpèsè fésì mẹ́ta ro nùtràlì tí kò yí. PF gidi kò fi àtòjọ harmonic hàn. Dátà okun / ẹ̀rọ gbọ́dọ̀ ní orísun.",
      "Current while load dey on and energy duty na separate things. Three-phase model assumes stiff neutral. True PF no tell harmonic spectrum. Manual cable/device data must show source.",
    ],
  "Enter exactly 24 normalized hourly PV values from 0 to 1.": [
    "Genau 24 normierte stündliche PV-Werte zwischen 0 und 1 eingeben.",
    "Tẹ iye PV wákàtí 24 gan-an, láàárín 0 àti 1.",
    "Enter exactly 24 hourly PV values from 0 to 1.",
  ],
  "Clipboard unavailable; use Export.": [
    "Zwischenablage nicht verfügbar; Export verwenden.",
    "Àpótí àdàkọ kò sí; lo Gbé jáde.",
    "Clipboard no dey available; use Export.",
  ],
  calculated: ["berechnet", "a ṣírò rẹ̀", "calculated"],
  incomplete: ["unvollständig", "kò tíì pé", "never complete"],
  unsupported: ["nicht unterstützt", "àwòṣe kò gbà á", "model no support am"],
  passed: ["Prüfung bestanden", "àyẹ̀wò kọjá", "check pass"],
  failed: ["Prüfung fehlgeschlagen", "àyẹ̀wò kùnà", "check fail"],
  warning: ["Warnung", "ìkìlọ̀", "warning"],
  error: ["Fehler", "àṣìṣe", "error"],
  info: ["Information", "àlàyé", "information"],
  "Not entered": ["Nicht eingegeben", "A kò tẹ sílẹ̀", "Nobody enter am"],
  "Enter at least two independent quantities.": [
    "Mindestens zwei unabhängige Größen eingeben.",
    "Tẹ ó kéré tán iye méjì tí kò gbára lé ara wọn.",
    "Enter at least two independent quantities.",
  ],
  "Quantity must be a whole number.": [
    "Die Anzahl muss ganzzahlig sein.",
    "Iye gbọdọ̀ jẹ́ nọ́ńbà odindi.",
    "Quantity must be a whole number.",
  ],
  "Mechanical efficiency cannot exceed 1.": [
    "Der mechanische Wirkungsgrad darf 1 nicht überschreiten.",
    "Ìmúṣẹ ẹ̀rọ kò lè ju 1 lọ.",
    "Mechanical efficiency no fit pass 1.",
  ],
  "Every elapsed interval must be longer than zero.": [
    "Jedes Zeitintervall muss länger als null sein.",
    "Àárín àkókò kọ̀ọ̀kan gbọdọ̀ ju òdo lọ.",
    "Each elapsed interval must pass zero.",
  ],
  "Close the older PowerLab tab to update local storage.": [
    "Älteren PowerLab-Tab schließen, um lokalen Speicher zu aktualisieren.",
    "Pa tábù PowerLab àtijọ́ dé láti ṣe àtúnṣe ìpamọ́.",
    "Close the older PowerLab tab make local storage update.",
  ],
  "Local save failed": [
    "Lokales Speichern fehlgeschlagen",
    "Ìfipamọ́ abẹ́lé kùnà",
    "Local save no work",
  ],
  "Local save failed. Export your project to keep a backup.": [
    "Lokales Speichern fehlgeschlagen. Exportieren Sie das Projekt als Sicherung.",
    "Ìfipamọ́ abẹ́lé kùnà. Gba ẹ̀dà iṣẹ́ rẹ.",
    "Local save no work. Export your project to keep backup.",
  ],
  "Another tab saved a newer revision. Export your changes or save a copy before reloading.":
    [
      "Ein anderer Tab hat eine neuere Revision gespeichert. Exportieren Sie Änderungen oder speichern Sie eine Kopie vor dem Neuladen.",
      "Tábù mìíràn ti fi àtúnṣe tuntun pamọ́. Gba àtúnṣe rẹ tàbí fi ẹ̀dà pamọ́ kí o tó tún ṣí.",
      "Another tab don save newer revision. Export your changes or save copy before reloading.",
    ],
} satisfies Record<string, [string, string, string]>);
export function hasTranslation(key: string, locale: Locale): boolean {
  return (
    locale === "en" ||
    Boolean(
      words[key]?.[locale === "de" ? 0 : locale === "yo" ? 1 : 2]?.trim(),
    ) ||
    messageTemplates.some((item) => item.pattern.test(key)) ||
    validationTemplates.some(([pattern]) => pattern.test(key))
  );
}
const validationTemplates: Array<[RegExp, [string, string, string]]> = [
  [/^Enter (.+)\.$/, ["{0} eingeben.", "Tẹ {0} sílẹ̀.", "Enter {0}."]],
  [
    /^Choose a supported (.+)\.$/,
    [
      "Eine unterstützte Auswahl für {0} treffen.",
      "Yan {0} tí àwòṣe gbà.",
      "Choose {0} wey the model supports.",
    ],
  ],
  [
    /^(.+) must be a finite number\.$/,
    [
      "{0} muss eine endliche Zahl sein.",
      "{0} gbọdọ̀ jẹ́ nọ́ńbà tó ní òpin.",
      "{0} must be a finite number.",
    ],
  ],
  [
    /^(.+) must be greater than zero\.$/,
    [
      "{0} muss größer als null sein.",
      "{0} gbọdọ̀ ju òdo lọ.",
      "{0} must pass zero.",
    ],
  ],
  [
    /^(.+) must be greater than zero and at most 1\.$/,
    [
      "{0} muss größer als null und höchstens 1 sein.",
      "{0} gbọdọ̀ ju òdo lọ, kí ó sì má ju 1 lọ.",
      "{0} must pass zero but no pass 1.",
    ],
  ],
  [
    /^(.+) must be a whole number\.$/,
    [
      "{0} muss ganzzahlig sein.",
      "{0} gbọdọ̀ jẹ́ nọ́ńbà odindi.",
      "{0} must be a whole number.",
    ],
  ],
  [
    /^(.+) must be between (.+) and (.+)\.$/,
    [
      "{0} muss zwischen {1} und {2} liegen.",
      "{0} gbọdọ̀ wà láàárín {1} àti {2}.",
      "{0} must stay between {1} and {2}.",
    ],
  ],
  [
    /^(.+) contains an empty value\. Enter an explicit zero if intended\.$/,
    [
      "{0} enthält einen leeren Wert. Falls beabsichtigt, ausdrücklich null eingeben.",
      "Iye òfo wà nínú {0}. Tẹ òdo sílẹ̀ bí ìyẹn ni o bá fẹ́.",
      "{0} get empty value. Enter zero if na zero you mean.",
    ],
  ],
  [
    /^(.+) is limited to 4,096 values per worksheet\.$/,
    [
      "{0} ist auf 4.096 Werte pro Arbeitsblatt begrenzt.",
      "{0} ní ààlà iye 4,096 fún ìwé iṣẹ́ kan.",
      "{0} fit take only 4,096 values for one worksheet.",
    ],
  ],
  [
    /^(.+) needs one value or exactly (\d+) values\.$/,
    [
      "{0} benötigt einen Wert oder genau {1} Werte.",
      "{0} nílò iye kan tàbí iye {1} gan-an.",
      "{0} needs one value or exactly {1} values.",
    ],
  ],
  [
    /^Assessment incomplete: enter (.+)\. Numerical results use unverified entered values\.$/,
    [
      "Bewertung unvollständig: {0} eingeben. Zahlen beruhen auf ungeprüften Eingaben.",
      "Àyẹ̀wò kò pé: tẹ {0} sílẹ̀. Àwọn èsì lo iye tí a kò ṣàyẹ̀wò.",
      "Assessment never complete: enter {0}. Numbers use inputs wey nobody verify yet.",
    ],
  ],
];
Object.assign(
  words,
  engineeringMessages,
  uiMessages,
  reportMessages,
  workspaceMessages,
  planningMessages,
  detailMessages,
  helpMessages,
);
const uiTemplates: Array<[string, [string, string, string]]> = [
  ["Value {0}: {1}", ["Wert {0}: {1}", "Iye {0}: {1}", "Value {0}: {1}"]],
  [
    "Use at most {0} decimal places.",
    [
      "Höchstens {0} Dezimalstellen verwenden.",
      "Lo ó pọ̀ jù ẹyọ kékeré {0}.",
      "Use at most {0} decimal places.",
    ],
  ],
  ["{0} is too long.", ["{0} ist zu lang.", "{0} gùn jù.", "{0} too long."]],
  ["{0} is too large.", ["{0} ist zu groß.", "{0} tóbi jù.", "{0} too large."]],
  [
    "{0} must be a non-negative decimal number.",
    [
      "{0} muss eine nicht negative Dezimalzahl sein.",
      "{0} gbọdọ̀ jẹ́ nọ́ńbà ẹyọ kékeré tí kò jẹ́ òdì.",
      "{0} must be decimal number wey no negative.",
    ],
  ],
  [
    "{0} allows at most {1} decimal places.",
    [
      "{0} erlaubt höchstens {1} Dezimalstellen.",
      "{0} gba ó pọ̀ jù ẹyọ kékeré {1}.",
      "{0} allows at most {1} decimal places.",
    ],
  ],
  [
    "Quantity {0} must be greater than zero.",
    [
      "Menge {0} muss größer als null sein.",
      "Iye {0} gbọdọ̀ ju òdo lọ.",
      "Quantity {0} must pass zero.",
    ],
  ],
  ["Quantity {0}", ["Menge {0}", "Iye {0}", "Quantity {0}"]],
  ["Unit price {0}", ["Einzelpreis {0}", "Owó ẹyọ {0}", "Unit price {0}"]],
  [
    "Description {0} is required.",
    [
      "Beschreibung {0} ist erforderlich.",
      "Àpèjúwe {0} ṣe pàtàkì.",
      "Description {0} dey required.",
    ],
  ],
  [
    "Invalid {0}.",
    ["Ungültige Angabe: {0}.", "Àlàyé àìtọ́: {0}.", "Invalid {0}."],
  ],
  [
    "Project {0}: {1}",
    ["Projekt {0}: {1}", "Iṣẹ́ {0}: {1}", "Project {0}: {1}"],
  ],
  [
    "The {0} evidence belongs to another project/revision or lacks provenance. Run it again before reporting.",
    [
      "Der Nachweis für {0} gehört zu einem anderen Projekt/einer anderen Revision oder enthält keine Herkunft. Vor dem Bericht erneut ausführen.",
      "Ẹ̀rí {0} jẹ́ ti iṣẹ́/àtúnṣe mìíràn tàbí kò ní orísun. Tún ìṣírò ṣe ṣáájú ìròyìn.",
      "The {0} evidence belongs to another project/revision or source no dey. Run am again before report.",
    ],
  ],
];
const messageTemplates = [...engineeringTemplates, ...uiTemplates].map(
  ([source, messages]) => {
    const ids: number[] = [];
    let previous = 0,
      pattern = "^";
    const escape = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const match of source.matchAll(/\{(\d+)\}/g)) {
      pattern += escape(source.slice(previous, match.index)) + "([\\s\\S]*?)";
      ids.push(Number(match[1]));
      previous = match.index! + match[0].length;
    }
    pattern += escape(source.slice(previous)) + "$";
    // Captures may be user-entered identifiers. Translate only explicitly declared message slots.
    const messageIds =
      source === "Value {0}: {1}" || source === "Project {0}: {1}" ? [1] : [];
    return { pattern: new RegExp(pattern), ids, messages, messageIds };
  },
);
export function translationCatalogKeys(): string[] {
  return Object.keys(words);
}
export function translate(key: string, locale: Locale, depth = 0): string {
  if (locale === "en") return key;
  const index = locale === "de" ? 0 : locale === "yo" ? 1 : 2;
  if (words[key]) return words[key][index];
  if (depth < 4)
    for (const item of messageTemplates) {
      const match = key.match(item.pattern);
      if (!match) continue;
      const values: Record<number, string> = {};
      let consistent = true;
      item.ids.forEach((id, position) => {
        const value = match[position + 1];
        if (id in values && values[id] !== value) consistent = false;
        values[id] = value;
      });
      if (consistent)
        return item.messages[index].replace(/\{(\d+)\}/g, (_, id: string) =>
          item.messageIds.includes(Number(id))
            ? translate(values[Number(id)] ?? `{${id}}`, locale, depth + 1)
            : (values[Number(id)] ?? `{${id}}`),
        );
    }
  for (const [pattern, templates] of validationTemplates) {
    const match = key.match(pattern);
    if (match)
      return templates[index].replace(/\{(\d+)\}/g, (_, n: string) => {
        const part = match[Number(n) + 1];
        return (
          words[part]?.[index] ??
          words[part[0]?.toUpperCase() + part.slice(1)]?.[index] ??
          part
        );
      });
  }
  return key;
}
export function useT() {
  const locale = useContext(LanguageContext);
  return (key: string) => translate(key, locale);
}
export function numberFormat(value: number, digits = 2, locale: Locale = "en") {
  return new Intl.NumberFormat(
    locale === "pcm" ? "en-NG" : locale === "yo" ? "yo-NG" : locale,
    { maximumFractionDigits: digits },
  ).format(value);
}
export function money(value: number, currency: string, locale: Locale = "en") {
  try {
    return new Intl.NumberFormat(
      locale === "pcm" ? "en-NG" : locale === "yo" ? "yo-NG" : locale,
      { style: "currency", currency },
    ).format(value);
  } catch {
    return value.toFixed(2) + " " + currency;
  }
}
