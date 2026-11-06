import { translate, type Locale } from "../i18n";

/** Local setup copy; professional language review remains pending. */
const messages: Record<string, [string, string, string]> = {
  "Project setup": ["Projekt einrichten", "Ṣètò iṣẹ́", "Set up project"],
  "Set the project basics, or enter your first load now.": [
    "Legen Sie die Projektdaten fest oder erfassen Sie sofort die erste Last.",
    "Ṣètò ìpìlẹ̀ iṣẹ́, tàbí tẹ ẹrù àkọ́kọ́ rẹ sínú báyìí.",
    "Set the project basics, or enter your first load now.",
  ],
  "Add first load": [
    "Erste Last hinzufügen",
    "Fi ẹrù àkọ́kọ́ kún",
    "Add first load",
  ],
  "Project name": ["Projektname", "Orúkọ iṣẹ́", "Project name"],
  "Application context": [
    "Anwendungsbereich",
    "Irú ibi iṣẹ́",
    "Where you go use am",
  ],
  "Interface language": [
    "Sprache der Oberfläche",
    "Èdè ojú iṣẹ́",
    "App language",
  ],
  Timezone: ["Zeitzone", "Agbègbè àkókò", "Time zone"],
  Currency: ["Währung", "Owó", "Currency"],
  "Jurisdiction (optional)": [
    "Rechtsraum (optional)",
    "Agbègbè òfin (àṣàyàn)",
    "Jurisdiction (if needed)",
  ],
  "Supply assumptions": [
    "Versorgungsannahmen",
    "Àfojúsùn ìpèsè iná",
    "Supply assumptions",
  ],
  "Line-to-neutral voltage (V)": [
    "Spannung L–N (V)",
    "Fọ́ltéèjì láàárín fásì àti àárín (V)",
    "Line-to-neutral voltage (V)",
  ],
  "Line-to-line voltage (V)": [
    "Spannung L–L (V)",
    "Fọ́ltéèjì láàárín fásì méjì (V)",
    "Line-to-line voltage (V)",
  ],
  "Frequency (Hz)": ["Frequenz (Hz)", "Ìgbòkègbodò (Hz)", "Frequency (Hz)"],
  "Supply limit (A)": [
    "Versorgungsgrenze (A)",
    "Ààlà ìpèsè (A)",
    "Supply limit (A)",
  ],
  "Save project setup": [
    "Projekteinrichtung speichern",
    "Fi ètò iṣẹ́ pamọ́",
    "Save project setup",
  ],
  "Language, currency and jurisdiction are independent. Check the supply values against your project.":
    [
      "Sprache, Währung und Rechtsraum sind unabhängig. Prüfen Sie die Versorgungswerte für Ihr Projekt.",
      "Èdè, owó àti agbègbè òfin dá dúró lọ́tọ̀ọ̀tọ̀. Ṣàyẹ̀wò iye ìpèsè fún iṣẹ́ rẹ.",
      "Language, currency and jurisdiction no depend on each other. Check supply values for your project.",
    ],
  "Your unfinished setup stays here while you add loads or change views.": [
    "Ihre ungespeicherte Einrichtung bleibt beim Hinzufügen von Lasten oder Ansichtswechsel erhalten.",
    "Ètò tí o kò tíì parí yóò wà níbí bí o ṣe ń fi ẹrù kún tàbí yí ojú iṣẹ́ padà.",
    "Your unfinished setup go remain when you add loads or change views.",
  ],
  "Enter a project name (up to 160 characters).": [
    "Geben Sie einen Projektnamen ein (höchstens 160 Zeichen).",
    "Tẹ orúkọ iṣẹ́ sínú (kò ju àmì 160 lọ).",
    "Enter a project name (no more than 160 characters).",
  ],
  "Enter a valid timezone, for example Africa/Lagos or Europe/Berlin.": [
    "Geben Sie eine gültige Zeitzone ein, etwa Africa/Lagos oder Europe/Berlin.",
    "Tẹ agbègbè àkókò tó tọ́ sínú, bí Africa/Lagos tàbí Europe/Berlin.",
    "Enter correct time zone, like Africa/Lagos or Europe/Berlin.",
  ],
  "Enter a positive number using this field's decimal separator.": [
    "Geben Sie eine positive Zahl mit dem Dezimaltrennzeichen dieses Feldes ein.",
    "Tẹ nọ́ńbà tó ju òdo lọ pẹ̀lú àmì eleemewa pápá yìí.",
    "Enter number above zero with the decimal separator for this field.",
  ],
  "Review the project settings before saving.": [
    "Prüfen Sie die Projekteinstellungen vor dem Speichern.",
    "Ṣàyẹ̀wò ètò iṣẹ́ kí o tó fi pamọ́.",
    "Check project settings before you save.",
  ],
  Residential: ["Wohngebäude", "Ilé gbígbé", "House"],
  Commercial: ["Gewerbe", "Ibi ìṣòwò", "Business"],
  Workshop: ["Werkstatt", "Ilé iṣẹ́ ọwọ́", "Workshop"],
  Industrial: ["Industrie", "Iṣẹ́ ilé-iṣẹ́", "Industry"],
  Agricultural: ["Landwirtschaft", "Iṣẹ́ àgbẹ̀", "Farm"],
  Community: ["Gemeinschaft", "Àwùjọ", "Community"],
};

export function setupText(key: string, locale: Locale) {
  return locale === "en"
    ? key
    : (messages[key]?.[locale === "de" ? 0 : locale === "yo" ? 1 : 2] ??
        translate(key, locale));
}
