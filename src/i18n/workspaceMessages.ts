/** Exact interface strings; entered project names and source quotations are never translated. */
export const workspaceMessages: Record<string, [string, string, string]> = {
  Unavailable: ["Nicht verfügbar", "Kò sí", "No dey available"],
  "Methods, assumptions and unresolved checks": [
    "Methoden, Annahmen und ungeklärte Prüfungen",
    "Ọ̀nà, àfojúsùn àti àyẹ̀wò tí kò tíì yanjú",
    "Methods, assumptions and unresolved checks",
  ],
  "Save measured data before exporting a Workspace backup. Saved measurements are included with projects and bills; an unsaved preview is not included.":
    [
      "Messdaten vor dem Export einer Arbeitsbereichssicherung speichern. Gespeicherte Messungen werden mit Projekten und Belegen gesichert; eine ungespeicherte Vorschau ist nicht enthalten.",
      "Fi dátà ìwọ̀n pamọ́ kí o tó gba àfipamọ́ àyè iṣẹ́. Ìwọ̀n tí a fi pamọ́ wà pẹ̀lú iṣẹ́ àti ìwé owó; àwòrán ṣáájú tí a kò fi pamọ́ kò sí nínú rẹ̀.",
      "Save measured data before exporting Workspace backup. Saved measurements join projects and bills; unsaved preview no join.",
    ],
  "Dated engineering comparison": [
    "Technischer Vergleich über einen Zeitraum",
    "Ìfiwéra ìmọ̀-ẹ̀rọ fún àkókò kan",
    "Dated engineering comparison",
  ],
  "Run both saved input sets over one explicit period. Unavailable evidence stays blank; different currencies are not subtracted. Up to 31 elapsed days per comparison.":
    [
      "Beide gespeicherten Eingabesätze über denselben expliziten Zeitraum berechnen. Fehlende Nachweise bleiben leer; unterschiedliche Währungen werden nicht voneinander abgezogen. Höchstens 31 verstrichene Tage je Vergleich.",
      "Ṣe ìṣirò dátà méjèèjì tí a fi pamọ́ fún àkókò kan tí a sọ kedere. Ẹ̀rí tí kò sí dúró ṣófo; a kò yọ owó orílẹ̀-èdè ọ̀tọ̀ kúrò nínú ara wọn. Tó ọjọ́ 31 gidi fún ìfiwéra kan.",
      "Run both saved input sets for one clear period. Missing evidence stays blank; different currencies no get subtracted. Up to 31 elapsed days per comparison.",
    ],
  "Comparison start (explicit offset)": [
    "Vergleichsbeginn (expliziter UTC-Versatz)",
    "Ìbẹ̀rẹ̀ ìfiwéra (ìyàtọ̀ UTC kedere)",
    "Comparison start (explicit offset)",
  ],
  "Comparison end (explicit offset)": [
    "Vergleichsende (expliziter UTC-Versatz)",
    "Òpin ìfiwéra (ìyàtọ̀ UTC kedere)",
    "Comparison end (explicit offset)",
  ],
  "Compare the same grid outage": [
    "Denselben Netzausfall vergleichen",
    "Fi ìdákẹ́ iná àgbá kan náà wéra",
    "Compare same grid outage",
  ],
  "Outage start (explicit offset)": [
    "Ausfallbeginn (expliziter UTC-Versatz)",
    "Ìbẹ̀rẹ̀ ìdákẹ́ iná (ìyàtọ̀ UTC kedere)",
    "Outage start (explicit offset)",
  ],
  "Outage end (explicit offset)": [
    "Ausfallende (expliziter UTC-Versatz)",
    "Òpin ìdákẹ́ iná (ìyàtọ̀ UTC kedere)",
    "Outage end (explicit offset)",
  ],
  "Run dated comparison": [
    "Zeitraumvergleich ausführen",
    "Ṣe ìfiwéra àkókò",
    "Run dated comparison",
  ],
  "Running comparison": [
    "Vergleich läuft",
    "Ìfiwéra ń lọ",
    "Comparison dey run",
  ],
  "Export dated comparison JSON": [
    "Zeitraumvergleich als JSON exportieren",
    "Gba JSON ìfiwéra àkókò",
    "Export dated comparison JSON",
  ],
  "Export dated comparison CSV": [
    "Zeitraumvergleich als CSV exportieren",
    "Gba CSV ìfiwéra àkókò",
    "Export dated comparison CSV",
  ],
  "Comparison worker failed. Project inputs are unchanged.": [
    "Vergleichsprozess fehlgeschlagen. Projekteingaben sind unverändert.",
    "Ìṣirò ìfiwéra kùnà. Dátà iṣẹ́ kò yí padà.",
    "Comparison worker fail. Project inputs no change.",
  ],
  "Compare a positive range of at most 31 elapsed days.": [
    "Einen positiven Zeitraum von höchstens 31 verstrichenen Tagen vergleichen.",
    "Fi àkókò tó ju òdo lọ, tí kò ju ọjọ́ 31 gidi lọ, wéra.",
    "Compare positive range wey no pass 31 elapsed days.",
  ],
  "L1 on-state current": [
    "L1-Strom im eingeschalteten Zustand",
    "Ìṣàn L1 ní ipò iṣẹ́",
    "L1 on-state current",
  ],
  "L2 on-state current": [
    "L2-Strom im eingeschalteten Zustand",
    "Ìṣàn L2 ní ipò iṣẹ́",
    "L2 on-state current",
  ],
  "L3 on-state current": [
    "L3-Strom im eingeschalteten Zustand",
    "Ìṣàn L3 ní ipò iṣẹ́",
    "L3 on-state current",
  ],
  "Interval peak demand": [
    "Spitzenbedarf im Intervall",
    "Ẹrù tó pọ̀ jù ní àkókò",
    "Interval peak demand",
  ],
  "Explicit start peak": [
    "Spitze expliziter Anläufe",
    "Òkè ìbẹ̀rẹ̀ tí a sọ kedere",
    "Explicit start peak",
  ],
  "Period load energy": [
    "Lastenergie im Zeitraum",
    "Agbára ẹrù fún àkókò",
    "Period load energy",
  ],
  "Unserved critical energy": [
    "Nicht versorgte kritische Energie",
    "Agbára pàtàkì tí a kò pèsè",
    "Critical energy wey no get served",
  ],
  "Feeder loss at range start": [
    "Zuleitungsverlust zu Beginn des Zeitraums",
    "Ìsonù ọ̀nà ìpèsè ní ìbẹ̀rẹ̀ àkókò",
    "Feeder loss at range start",
  ],
  "Period cost": ["Kosten im Zeitraum", "Owó àkókò", "Period cost"],
  "Import emissions": [
    "Emissionen aus Netzbezug",
    "Ìtújáde láti gbígba agbára wọlé",
    "Import emissions",
  ],
  "Unresolved checks": [
    "Ungeklärte Prüfungen",
    "Àyẹ̀wò tí kò tíì yanjú",
    "Unresolved checks",
  ],
  "Both projects use the same explicit elapsed period; each retains its entered timezone, tariff and equipment assumptions.":
    [
      "Beide Projekte verwenden denselben expliziten verstrichenen Zeitraum; jedes behält seine Zeitzone, Tarife und Geräteannahmen.",
      "Iṣẹ́ méjèèjì lo àkókò gidi kan náà; ọ̀kọ̀ọ̀kan pa agbègbè àkókò, owó àti àfojúsùn ohun èlò rẹ̀ mọ́.",
      "Both projects use same explicit elapsed period; each keeps entered timezone, tariff and equipment assumptions.",
    ],
  "Phase currents are on-state design values; interval demand is a chronological 15-minute average. These definitions are kept separate.":
    [
      "Phasenströme sind Planungswerte im eingeschalteten Zustand; Intervallbedarf ist ein chronologischer 15-Minuten-Mittelwert. Diese Definitionen bleiben getrennt.",
      "Ìṣàn fáàsì jẹ́ iye ètò ní ipò iṣẹ́; ẹrù àkókò jẹ́ àárín ìṣẹ́jú 15 léraléra. Ìtumọ̀ méjèèjì dúró lọ́tọ̀.",
      "Phase currents na on-state design values; interval demand na chronological 15-minute average. These definitions stay separate.",
    ],
  "Feeder losses are nominal-model instantaneous losses at the comparison start. Missing route evidence is unavailable, not zero. Storage losses are integrated separately.":
    [
      "Zuleitungsverluste sind momentane Verluste des Nennmodells zu Vergleichsbeginn. Fehlende Streckennachweise bedeuten nicht verfügbar, nicht null. Speicherverluste werden separat integriert.",
      "Ìsonù ọ̀nà ìpèsè jẹ́ ìsonù àwòṣe iye àkọ́kọ́ ní ìbẹ̀rẹ̀ ìfiwéra. Ẹ̀rí ọ̀nà tí kò sí jẹ́ àìsí dátà, kì í ṣe òdo. A ṣirò ìsonù ibi ìpamọ́ lọ́tọ̀.",
      "Feeder losses na nominal-model instant losses at comparison start. Missing route evidence means unavailable, no be zero. Storage losses integrate separately.",
    ],
  "Starting capacity is unavailable unless explicit events overlap the selected period. Carbon covers imported energy only and needs an entered factor; no avoided-export credit is inferred.":
    [
      "Anlaufkapazität ist nur verfügbar, wenn explizite Ereignisse im gewählten Zeitraum liegen. Emissionen umfassen nur bezogene Energie und benötigen einen eingegebenen Faktor; keine vermiedenen Exportemissionen werden gutgeschrieben.",
      "Agbára ìbẹ̀rẹ̀ kò sí bí ìṣẹ̀lẹ̀ kedere kò bá wọ àkókò tí a yàn. Carbon bo agbára tí a gbà wọlé nìkan, ó sì nílò ìwọ̀n tí a tẹ sílẹ̀; a kò dá èrè fífi agbára jáde sílẹ̀.",
      "Starting capacity unavailable unless explicit events overlap selected period. Carbon covers imported energy only and needs entered factor; no avoided-export credit gets assumed.",
    ],
  Project: ["Projekt", "Iṣẹ́", "Project"],
  Status: ["Status", "Ipò", "Status"],
  "Project changed. Reopen the template editor.": [
    "Projekt geändert. Vorlageneditor erneut öffnen.",
    "Iṣẹ́ ti yí padà. Tún ṣí olùṣàtúnṣe àpẹẹrẹ.",
    "Project don change. Open template editor again.",
  ],
  "Project changed. Review the replacement again.": [
    "Projekt geändert. Ersetzung erneut prüfen.",
    "Iṣẹ́ ti yí padà. Tún ṣàyẹ̀wò ohun tí yóò rọ́pò rẹ̀.",
    "Project don change. Review replacement again.",
  ],
  "Replacement was not applied. Review locks, phase assignments and validation errors before trying again.":
    [
      "Ersetzung nicht angewendet. Sperren, Phasenzuordnung und Validierungsfehler vor erneutem Versuch prüfen.",
      "A kò lo ìrọ́pò náà. Ṣàyẹ̀wò títì, ìpín fáàsì àti àṣìṣe dátà kí o tó tún gbìyànjú.",
      "Replacement no apply. Check locks, phase assignments and validation errors before you try again.",
    ],
  "Favorites only": ["Nur Favoriten", "Àwọn àyànfẹ́ nìkan", "Favorites only"],
  "Equipment category": [
    "Gerätekategorie",
    "Ẹ̀ka ohun èlò",
    "Equipment category",
  ],
  "Select a load": ["Last auswählen", "Yan ẹrù", "Choose one load"],
  Favorite: ["Favorit", "Àyànfẹ́", "Favorite"],
  "Equipment version history": [
    "Geräteversionsverlauf",
    "Ìtàn ẹ̀dà ohun èlò",
    "Equipment version history",
  ],
  Version: ["Version", "Ẹ̀dà", "Version"],
  Saved: ["Gespeichert", "A ti fi pamọ́", "Saved"],
  Record: ["Datensatz", "Àkọsílẹ̀", "Record"],
  "The latest 100 historical versions are shown. Complete version history is preserved in workspace backups.":
    [
      "Die letzten 100 historischen Versionen werden angezeigt. Arbeitsbereichssicherungen enthalten den vollständigen Versionsverlauf.",
      "A fi ẹ̀dà ìtàn 100 tó ṣẹ̀ṣẹ̀ hàn. Gbogbo ìtàn ẹ̀dà wà nínú àfipamọ́ àyè iṣẹ́.",
      "Latest 100 historical versions show here. Workspace backups keep the complete version history.",
    ],
  "Review equipment replacement": [
    "Geräteersetzung prüfen",
    "Ṣàyẹ̀wò ìrọ́pò ohun èlò",
    "Review equipment replacement",
  ],
  "Choose connected loads to update their electrical nameplate fields and source. Names, quantities, schedules and assignments stay as entered. Other projects retain their saved copies.":
    [
      "Angeschlossene Lasten zum Aktualisieren der elektrischen Typenschilddaten und Quellen auswählen. Namen, Mengen, Zeitpläne und Zuordnungen bleiben erhalten. Andere Projekte behalten ihre gespeicherten Kopien.",
      "Yan ẹrù tí a so pọ̀ láti ṣàtúnṣe iye orí àami ohun èlò àti orísun rẹ̀. Orúkọ, iye, àkókò àti ìpín dúró bí a ṣe tẹ wọn sílẹ̀. Iṣẹ́ mìíràn pa ẹ̀dà wọn mọ́.",
      "Choose connected loads to update electrical nameplate fields and source. Names, quantities, schedules and assignments stay as entered. Other projects keep their saved copies.",
    ],
  "Apply reviewed replacement": [
    "Geprüfte Ersetzung anwenden",
    "Lo ìrọ́pò tí a ṣàyẹ̀wò",
    "Apply replacement wey you review",
  ],
  "Chart cursor": ["Diagrammzeiger", "Atọ́ka àwòrán dátà", "Chart cursor"],
  "Chart data table": [
    "Diagrammdatentabelle",
    "Tábìlì dátà àwòrán",
    "Chart data table",
  ],
  Position: ["Position", "Ipò", "Position"],
  Comparison: ["Vergleich", "Ìfiwéra", "Comparison"],
  Previous: ["Zurück", "Èyí tó ṣáájú", "Previous"],
  Next: ["Weiter", "Èyí tó tẹ̀lé", "Next"],
  "Import actual interval-average power readings with explicit timestamp offsets.":
    [
      "Tatsächlich gemessene Intervallmittelwerte der Leistung mit ausdrücklichem UTC-Versatz importieren.",
      "Kó ìwọ̀n agbára àárín àkókò gidi wọlé pẹ̀lú ìyàtọ̀ UTC tó hàn kedere.",
      "Import actual interval-average power readings with clear timestamp offsets.",
    ],
  "Measured data is stored separately for this project on this browser. Export a measurement backup as well as your engineering project for recovery on another device.":
    [
      "Messdaten werden separat für dieses Projekt in diesem Browser gespeichert. Für die Wiederherstellung auf einem anderen Gerät eine Messdatensicherung und das technische Projekt exportieren.",
      "A fi dátà ìwọ̀n pamọ́ lọ́tọ̀ fún iṣẹ́ yìí nínú aṣàwákiri yìí. Gba àfipamọ́ ìwọ̀n àti iṣẹ́ ìmọ̀-ẹ̀rọ fún ìmúpadàbọ̀ lórí ẹ̀rọ mìíràn.",
      "Measured data dey saved separately for this project in this browser. Export measurement backup and engineering project to recover on another device.",
    ],
  "Open measured CSV or backup": [
    "Messdaten-CSV oder Sicherung öffnen",
    "Ṣí CSV ìwọ̀n tàbí àfipamọ́",
    "Open measured CSV or backup",
  ],
  "CSV: up to 5 MB. Measurement backup JSON: up to 32 MB.": [
    "CSV: bis 5 MB. Messdatensicherung als JSON: bis 32 MB.",
    "CSV: tó 5 MB. JSON àfipamọ́ ìwọ̀n: tó 32 MB.",
    "CSV: up to 5 MB. Measurement backup JSON: up to 32 MB.",
  ],
  "Processing measured data…": [
    "Messdaten werden verarbeitet…",
    "A ń ṣiṣẹ́ lórí dátà ìwọ̀n…",
    "Measured data dey process…",
  ],
  "No measured dataset is open. Choose your CSV or a measurement backup.": [
    "Kein Messdatensatz geöffnet. CSV oder Messdatensicherung auswählen.",
    "Kò sí dátà ìwọ̀n tó ṣí. Yan CSV rẹ tàbí àfipamọ́ ìwọ̀n.",
    "No measured dataset open. Choose your CSV or measurement backup.",
  ],
  "Each timestamp marks the start of one interval. Use ISO timestamps with Z or an explicit offset, for example 2026-11-05T09:00:00+01:00. Positive power is import; negative power is export. Missing readings are never treated as zero.":
    [
      "Jeder Zeitstempel bezeichnet den Intervallbeginn. ISO-Zeitstempel mit Z oder explizitem Versatz verwenden, zum Beispiel 2026-11-05T09:00:00+01:00. Positive Leistung bedeutet Bezug, negative Einspeisung. Fehlende Messwerte werden niemals als null behandelt.",
      "Àmì àkókò kọ̀ọ̀kan fi ìbẹ̀rẹ̀ àkókò hàn. Lo àkókò ISO pẹ̀lú Z tàbí ìyàtọ̀ UTC, bí 2026-11-05T09:00:00+01:00. Agbára rere jẹ́ gbígba wọlé; odi jẹ́ fífi jáde. A kò ka ìwọ̀n tó sọnù sí òdo.",
      "Each timestamp marks interval start. Use ISO timestamp with Z or clear offset, like 2026-11-05T09:00:00+01:00. Positive power na import; negative na export. Missing readings never count as zero.",
    ],
  "Previous validated measurements remain visible. The new draft has not replaced them.":
    [
      "Vorherige validierte Messungen bleiben sichtbar. Der neue Entwurf hat sie nicht ersetzt.",
      "Ìwọ̀n tí a ṣàyẹ̀wò tẹ́lẹ̀ ṣì hàn. Àkọ́kọ́ tuntun kò tíì rọ́pò wọn.",
      "Previous validated measurements still show. New draft never replace them.",
    ],
  "Validated dataset": [
    "Validierter Datensatz",
    "Dátà tí a ṣàyẹ̀wò",
    "Validated dataset",
  ],
  "Cyan shows import magnitude; violet shows export magnitude. The horizontal axis is recorded interval order. Gaps are not filled. The chart shows this table page only.":
    [
      "Cyan zeigt den Betrag des Bezugs, Violett die Einspeisung. Die waagerechte Achse zeigt die Reihenfolge erfasster Intervalle. Lücken werden nicht gefüllt. Das Diagramm zeigt nur diese Tabellenseite.",
      "Àwọ̀ cyan fi iye gbígba wọlé hàn; àwọ̀ violet fi fífi jáde hàn. Ìlà pẹ̀tẹ́lẹ̀ tẹ̀lé àtòjọ àkókò tí a kọ sílẹ̀. A kò kún àlàfo. Àwòrán fi ojú ìwé tábìlì yìí nìkan hàn.",
      "Cyan shows import magnitude; violet shows export magnitude. Horizontal axis follows recorded interval order. Gaps no get filled. Chart shows only this table page.",
    ],
  Inspect: ["Untersuchen", "Ṣàyẹ̀wò", "Inspect"],
  "recorded intervals": [
    "erfasste Intervalle",
    "àkókò tí a kọ sílẹ̀",
    "recorded intervals",
  ],
  "Supply equipment": [
    "Versorgungsgeräte",
    "Ohun èlò ìpèsè",
    "Supply equipment",
  ],
  "Source register and capacity checks": [
    "Quellenregister und Kapazitätsprüfungen",
    "Àkọsílẹ̀ orísun àti àyẹ̀wò agbára",
    "Source register and capacity checks",
  ],
  "Add source": ["Quelle hinzufügen", "Fi orísun kún", "Add source"],
  "Enter actual nameplate ratings and applicable conditions. Source records describe equipment and served boundaries; they do not switch physical supplies.":
    [
      "Tatsächliche Typenschildwerte und anwendbare Bedingungen eingeben. Quellen beschreiben Geräte und versorgte Bereiche; sie schalten keine physische Versorgung um.",
      "Tẹ iye gidi orí àami ohun èlò àti ipò tó bá yẹ. Àkọsílẹ̀ orísun ṣàlàyé ohun èlò àti ibi tí ó pèsè sí; wọn kò yí ìpèsè gidi padà.",
      "Enter actual nameplate ratings and applicable conditions. Source records describe equipment and served boundaries; they no switch physical supplies.",
    ],
  "No source equipment entered.": [
    "Keine Quellengeräte eingegeben.",
    "A kò tíì tẹ ohun èlò orísun sílẹ̀.",
    "No source equipment entered.",
  ],
  Type: ["Typ", "Irú", "Type"],
  "Served board": [
    "Versorgte Verteilung",
    "Pátákó tí a pèsè sí",
    "Board wey source serves",
  ],
  "Whole project": ["Gesamtes Projekt", "Gbogbo iṣẹ́", "Whole project"],
  "Assessment source": [
    "Zu bewertende Quelle",
    "Orísun fún àyẹ̀wò",
    "Assessment source",
  ],
  "Operating scenario": [
    "Betriebsszenario",
    "Àpẹẹrẹ ipò iṣẹ́",
    "Operating scenario",
  ],
  "Running loads": ["Laufende Lasten", "Ẹrù tó ń ṣiṣẹ́", "Running loads"],
  "Starting events": ["Anlaufereignisse", "Ìṣẹ̀lẹ̀ ìbẹ̀rẹ̀", "Starting events"],
  "Assessment instant": [
    "Bewertungszeitpunkt",
    "Àkókò àyẹ̀wò",
    "Assessment instant",
  ],
  "Optional ISO timestamp with UTC offset; blank uses entered on-state loads.":
    [
      "Optionaler ISO-Zeitstempel mit UTC-Versatz; ohne Angabe werden eingegebene eingeschaltete Lasten verwendet.",
      "Àkókò ISO pẹ̀lú ìyàtọ̀ UTC kò pọn dandan; bí ó bá ṣófo, lo ẹrù tí a tẹ sílẹ̀ ní ipò iṣẹ́.",
      "Optional ISO timestamp with UTC offset; blank uses entered on-state loads.",
    ],
  Limit: ["Grenze", "Ààlà", "Limit"],
  "Export assessment": [
    "Bewertung exportieren",
    "Gba àyẹ̀wò",
    "Export assessment",
  ],
  "Source equipment": ["Quellengerät", "Ohun èlò orísun", "Source equipment"],
  "Evidence type": ["Nachweisart", "Irú ẹ̀rí", "Evidence type"],
  "Evidence reference": [
    "Nachweisreferenz",
    "Ìtọ́kasí ẹ̀rí",
    "Evidence reference",
  ],
  "Enter documented overload envelope": [
    "Dokumentierte Überlastgrenze eingeben",
    "Tẹ ààlà ẹrù àṣejù tí a ní ẹ̀rí rẹ̀ sílẹ̀",
    "Enter documented overload envelope",
  ],
  Duration: ["Dauer", "Iye àkókò", "Duration"],
  "Envelope reference": [
    "Referenz der Belastungsgrenze",
    "Ìtọ́kasí ààlà ẹrù",
    "Envelope reference",
  ],
  "Save source": ["Quelle speichern", "Fi orísun pamọ́", "Save source"],
  "Site, buildings and zones": [
    "Standort, Gebäude und Zonen",
    "Ibi iṣẹ́, ilé àti agbègbè",
    "Site, buildings and zones",
  ],
  "Organization groups do not create electrical connections.": [
    "Organisationsgruppen erzeugen keine elektrischen Verbindungen.",
    "Àkójọpọ̀ ètò kò dá ìsopọ̀ iná sílẹ̀.",
    "Organization groups no create electrical connections.",
  ],
  "Group name": ["Gruppenname", "Orúkọ àkójọpọ̀", "Group name"],
  "Group type": ["Gruppentyp", "Irú àkójọpọ̀", "Group type"],
  Building: ["Gebäude", "Ilé", "Building"],
  Zone: ["Zone", "Agbègbè", "Zone"],
  "Parent group": ["Übergeordnete Gruppe", "Àkójọpọ̀ òbí", "Parent group"],
  Site: ["Standort", "Ibi iṣẹ́", "Site"],
  "Add group": ["Gruppe hinzufügen", "Fi àkójọpọ̀ kún", "Add group"],
  "Rename group": [
    "Gruppe umbenennen",
    "Yí orúkọ àkójọpọ̀ padà",
    "Rename group",
  ],
  "Remove group": ["Gruppe entfernen", "Yọ àkójọpọ̀", "Remove group"],
  "Add a board first": [
    "Zuerst eine Verteilung hinzufügen",
    "Kọ́kọ́ fi pátákó kún",
    "Add board first",
  ],
  "Add note": ["Notiz hinzufügen", "Fi àkọsílẹ̀ kún", "Add note"],
  Pan: ["Verschieben", "Gbé àwòrán", "Pan"],
  "Auto-layout": ["Automatisch anordnen", "Tò ó fúnra rẹ̀", "Auto-layout"],
  "Select diagram object": [
    "Diagrammobjekt auswählen",
    "Yan ohun nínú àwòrán",
    "Choose diagram object",
  ],
  "Isolate board": [
    "Verteilung einzeln anzeigen",
    "Fi pátákó kan hàn lọ́tọ̀",
    "Show board alone",
  ],
  "Diagram page size": [
    "Diagrammpapierformat",
    "Ìwọ̀n ojú ìwé àwòrán",
    "Diagram page size",
  ],
  "Diagram orientation": [
    "Diagrammausrichtung",
    "Ìtọ́sọ́nà ojú ìwé àwòrán",
    "Diagram orientation",
  ],
  Landscape: ["Querformat", "Ìbú", "Landscape"],
  Portrait: ["Hochformat", "Ìgùn", "Portrait"],
  "Show connection labels": [
    "Verbindungsbeschriftungen anzeigen",
    "Fi àkọlé ìsopọ̀ hàn",
    "Show connection labels",
  ],
  "Show component ratings": [
    "Komponentenbemessungswerte anzeigen",
    "Fi iye ohun èlò hàn",
    "Show component ratings",
  ],
  "Editable single-line diagram": [
    "Bearbeitbares einpoliges Schaltbild",
    "Àwòrán ìsopọ̀ ìlà kan tí a lè ṣàtúnṣe",
    "Single-line diagram wey you fit edit",
  ],
  "Keyboard pan controls": [
    "Tastatursteuerung zum Verschieben",
    "Bọ́tìnì fún gbígbé àwòrán",
    "Keyboard pan controls",
  ],
  "Pan left": ["Nach links verschieben", "Gbé sí òsì", "Pan left"],
  "Pan up": ["Nach oben verschieben", "Gbé sókè", "Pan up"],
  "Pan down": ["Nach unten verschieben", "Gbé sílẹ̀", "Pan down"],
  "Pan right": ["Nach rechts verschieben", "Gbé sí ọ̀tún", "Pan right"],
  "Inspect selected object": [
    "Ausgewähltes Objekt untersuchen",
    "Ṣàyẹ̀wò ohun tí a yàn",
    "Inspect selected object",
  ],
  "Circuit / protective device": [
    "Stromkreis / Schutzgerät",
    "Àyíká / ohun èlò ààbò",
    "Circuit / protective device",
  ],
  "EV load": ["Elektrofahrzeuglast", "Ẹrù ọkọ̀ iná", "EV load"],
  "Generic load": ["Allgemeine Last", "Ẹrù gbogbogbò", "General load"],
  "Single-source radial topology. Original analytical symbols; no IEC symbol certification. A connection changes the project graph. Unassigned loads have no electrical connection line. Flow animation illustrates connections and is not measured telemetry.":
    [
      "Radiale Topologie mit einer Quelle. Eigene analytische Symbole ohne IEC-Symbolzertifizierung. Eine Verbindung ändert den Projektgraphen. Nicht zugeordnete Lasten haben keine elektrische Verbindungslinie. Die Flussanimation zeigt Verbindungen und keine gemessene Telemetrie.",
      "Ètò radial orísun kan. Àmì ìṣirò tiwa; kò sí ìjẹ́rìí àmì IEC. Ìsopọ̀ yí àwòrán iṣẹ́ padà. Ẹrù tí a kò pín kò ní ìlà ìsopọ̀ iná. Ìrìn àwòrán fi ìsopọ̀ hàn, kì í ṣe ìwọ̀n gidi.",
      "Single-source radial topology. Original analytical symbols; no IEC symbol certification. Connection changes project graph. Unassigned loads get no electrical connection line. Flow animation shows connections, no be measured telemetry.",
    ],
  "Select an object, then use the connection controls. Drag nodes or enter X/Y coordinates; focused nodes move 10 units with arrow keys. Layout survives recalculation and is included in project backups.":
    [
      "Objekt auswählen und Verbindungssteuerung verwenden. Knoten ziehen oder X/Y eingeben; fokussierte Knoten bewegen sich mit Pfeiltasten um 10 Einheiten. Das Layout bleibt nach Neuberechnung erhalten und wird gesichert.",
      "Yan ohun kan, kí o lo ìṣàkóso ìsopọ̀. Fa àwọn kókó tàbí tẹ X/Y; bọ́tìnì ọfà gbé kókó tí a yan ní ìwọ̀n 10. Ìtòlẹ́sẹẹsẹ dúró lẹ́yìn ìṣirò tuntun, ó sì wà nínú àfipamọ́.",
      "Choose object, then use connection controls. Drag nodes or enter X/Y; arrow keys move focused nodes 10 units. Layout survives recalculation and enters project backups.",
    ],
  "Add a board first to create circuits and connect loads.": [
    "Zuerst eine Verteilung hinzufügen, um Stromkreise anzulegen und Lasten anzuschließen.",
    "Kọ́kọ́ fi pátákó kún kí o lè dá àyíká sílẹ̀ kí o so ẹrù pọ̀.",
    "Add board first to create circuits and connect loads.",
  ],
  "Diagram notes": ["Diagrammnotizen", "Àkọsílẹ̀ àwòrán", "Diagram notes"],
  "Remove note": ["Notiz entfernen", "Yọ àkọsílẹ̀", "Remove note"],
  "Topology object inspector": [
    "Topologieobjekt-Inspektor",
    "Olùṣàyẹ̀wò ohun nínú ètò ìsopọ̀",
    "Topology object inspector",
  ],
  "Planning source equipment": [
    "Geplantes Quellengerät",
    "Ohun èlò orísun fún ètò",
    "Planning source equipment",
  ],
  "This record is an entered planning source, not an active additional feed. Board association does not create an electrical connection or establish safe source paralleling.":
    [
      "Dieser Datensatz beschreibt eine eingegebene Planungsquelle, keine aktive zusätzliche Einspeisung. Die Zuordnung zur Verteilung stellt keine elektrische Verbindung her und bestätigt keinen sicheren Parallelbetrieb.",
      "Àkọsílẹ̀ yìí jẹ́ orísun fún ètò tí a tẹ sílẹ̀, kì í ṣe ìpèsè àfikún tó ń ṣiṣẹ́. Ìsopọ̀ orúkọ pẹ̀lú pátákó kò dá ìsopọ̀ iná tàbí ìjẹ́rìí ààbò orísun méjì sílẹ̀.",
      "This record na entered planning source, no be active extra feed. Board association no create electrical connection or prove safe source paralleling.",
    ],
  "Entered rating": [
    "Eingegebener Bemessungswert",
    "Iye tí a tẹ sílẹ̀",
    "Entered rating",
  ],
  "Associated board": [
    "Zugeordnete Verteilung",
    "Pátákó tí a so mọ́",
    "Associated board",
  ],
  "Edit this record in the source equipment register. Core circuit calculations retain the declared single-source radial model.":
    [
      "Diesen Datensatz im Quellenregister bearbeiten. Die Stromkreisberechnung behält das angegebene radiale Modell mit einer Quelle bei.",
      "Ṣàtúnṣe àkọsílẹ̀ yìí nínú àkọsílẹ̀ ohun èlò orísun. Ìṣirò àyíká pàtàkì ṣì lo àwòṣe radial orísun kan.",
      "Edit this record for source equipment register. Core circuit calculations still use declared single-source radial model.",
    ],
  "Manual position": [
    "Manuelle Position",
    "Ipò tí a tẹ sílẹ̀",
    "Manual position",
  ],
  "Diagram X": ["Diagramm X", "X àwòrán", "Diagram X"],
  "Diagram Y": ["Diagramm Y", "Y àwòrán", "Diagram Y"],
  "Save position": ["Position speichern", "Fi ipò pamọ́", "Save position"],
  "Object name": ["Objektname", "Orúkọ ohun", "Object name"],
  "Available ways": ["Verfügbare Abgänge", "Ọ̀nà tó wà", "Available ways"],
  "Circuit phase": ["Stromkreisphase", "Fáàsì àyíká", "Circuit phase"],
  "Entered breaking capacity": [
    "Eingegebenes Ausschaltvermögen",
    "Agbára gé iná tí a tẹ sílẹ̀",
    "Entered breaking capacity",
  ],
  "Entered prospective fault current": [
    "Eingegebener prospektiver Fehlerstrom",
    "Ìṣàn àṣìṣe tó lè ṣẹlẹ̀ tí a tẹ sílẹ̀",
    "Entered prospective fault current",
  ],
  "Object notes": ["Objektnotizen", "Àkọsílẹ̀ ohun", "Object notes"],
  "Preview object changes": [
    "Objektänderungen prüfen",
    "Wo àtúnṣe ohun ṣáájú",
    "Preview object changes",
  ],
  "Connect load to circuit": [
    "Last an Stromkreis anschließen",
    "So ẹrù pọ̀ mọ́ àyíká",
    "Connect load to circuit",
  ],
  "Choose a circuit": ["Stromkreis auswählen", "Yan àyíká", "Choose circuit"],
  Connect: ["Verbinden", "So pọ̀", "Connect"],
  Disconnect: ["Trennen", "Yà sọ́tọ̀", "Disconnect"],
  "Add a board and circuit to connect this load.": [
    "Verteilung und Stromkreis hinzufügen, um diese Last anzuschließen.",
    "Fi pátákó àti àyíká kún kí o lè so ẹrù yìí pọ̀.",
    "Add board and circuit to connect this load.",
  ],
  "Load destination phase": [
    "Zielphase der Last",
    "Fáàsì tí ẹrù yóò lọ sí",
    "Load destination phase",
  ],
  "Preview phase assignment": [
    "Phasenzuordnung prüfen",
    "Wo ìpín fáàsì ṣáájú",
    "Preview phase assignment",
  ],
  "Cable data and source": [
    "Kabeldaten und Quelle",
    "Dátà kéébù àti orísun",
    "Cable data and source",
  ],
  "Correction factors": [
    "Korrekturfaktoren",
    "Àwọn ìwọ̀n àtúnṣe",
    "Correction factors",
  ],
  "Cable data source": [
    "Quelle der Kabeldaten",
    "Orísun dátà kéébù",
    "Cable data source",
  ],
  "Preview cable changes": [
    "Kabeländerungen prüfen",
    "Wo àtúnṣe kéébù ṣáájú",
    "Preview cable changes",
  ],
  "Clear cable data": [
    "Kabeldaten löschen",
    "Pa dátà kéébù rẹ́",
    "Clear cable data",
  ],
  "Entered data and criteria require their own applicable source. These fields do not establish regulatory or manufacturer approval.":
    [
      "Eingegebene Daten und Kriterien benötigen eine passende Quelle. Diese Felder bestätigen keine behördliche oder Herstellerfreigabe.",
      "Dátà àti òṣùwọ̀n tí a tẹ sílẹ̀ nílò orísun tó bá yẹ. Àwọn pápá yìí kò fi ìfọwọ́sí òfin tàbí olùṣe múlẹ̀.",
      "Entered data and criteria need their own applicable source. These fields no establish regulatory or manufacturer approval.",
    ],
  "Review every dependent object before applying. Loads are retained unless a separate load deletion is requested.":
    [
      "Vor dem Anwenden alle abhängigen Objekte prüfen. Lasten bleiben erhalten, sofern sie nicht gesondert gelöscht werden.",
      "Ṣàyẹ̀wò gbogbo ohun tó gbẹ́kẹ̀ lé e kí o tó lò ó. Ẹrù dúró bí kò bá sí ìbéèrè pípa ẹrù lọ́tọ̀.",
      "Review every dependent object before applying. Loads stay unless you request separate load deletion.",
    ],
  "Dependency handling": [
    "Umgang mit Abhängigkeiten",
    "Bí a ṣe ń bójú tó ìgbẹ́kẹ̀lé",
    "Dependency handling",
  ],
  "Remove subtree; keep loads unassigned": [
    "Teilbaum entfernen; Lasten ohne Zuordnung behalten",
    "Yọ ẹ̀ka; pa ẹrù mọ́ láìpín wọn",
    "Remove subtree; keep loads unassigned",
  ],
  "Move direct dependants to another board": [
    "Direkt abhängige Objekte zu anderer Verteilung verschieben",
    "Gbé ohun tó gbẹ́kẹ̀ lé e tààrà sí pátákó mìíràn",
    "Move direct dependants to another board",
  ],
  "Dependency destination": [
    "Ziel abhängiger Objekte",
    "Ibi tí ohun tó gbẹ́kẹ̀ lé e yóò lọ",
    "Dependency destination",
  ],
  "Preview removal": ["Entfernung prüfen", "Wo yíyọ ṣáájú", "Preview removal"],
  "Board rated limit": [
    "Bemessungsgrenze der Verteilung",
    "Ààlà pátákó tí a sọ",
    "Board rated limit",
  ],
  "Preview addition": [
    "Ergänzung prüfen",
    "Wo àfikún ṣáájú",
    "Preview addition",
  ],
  Yes: ["Ja", "Bẹ́ẹ̀ ni", "Yes"],
  No: ["Nein", "Rárá", "No"],
  Apply: ["Anwenden", "Lò ó", "Apply"],
  "Compare current inputs with a saved revision. Select fields to restore; dependent objects must be restored together.":
    [
      "Aktuelle Eingaben mit einer gespeicherten Revision vergleichen. Wiederherzustellende Felder auswählen; abhängige Objekte müssen gemeinsam wiederhergestellt werden.",
      "Fi dátà lọ́wọ́lọ́wọ́ wé ẹ̀dà tí a fi pamọ́. Yan pápá láti mú padà; ohun tó gbẹ́kẹ̀ lé ara wọn gbọ́dọ̀ padà papọ̀.",
      "Compare current inputs with saved revision. Choose fields to restore; dependent objects must restore together.",
    ],
  "Restore selected fields": [
    "Ausgewählte Felder wiederherstellen",
    "Mú pápá tí a yàn padà",
    "Restore selected fields",
  ],
  "Separate values with semicolons; use the selected language decimal separator.":
    [
      "Werte durch Semikolon trennen; Dezimaltrennzeichen der gewählten Sprache verwenden.",
      "Ya iye sọ́tọ̀ pẹ̀lú semicolon; lo àmì eleemewa èdè tí a yàn.",
      "Separate values with semicolons; use decimal separator for selected language.",
    ],
  "This sweep changes the fallback import price. Entered time-of-use bands keep their own prices.":
    [
      "Diese Variation ändert den Bezugspreis außerhalb von Tarifzeitfenstern. Eingegebene Zeitfenster behalten ihre eigenen Preise.",
      "Ìdánwò iye yìí yí iye owó gbígba wọlé àkọ́kọ́ padà. Àwọn àkókò owó tí a tẹ sílẹ̀ pa iye owó wọn mọ́.",
      "This sweep changes fallback import price. Entered time-of-use bands keep their own prices.",
    ],
  loads: ["Lasten", "ẹrù", "loads"],
  "Load actions": ["Lastaktionen", "Ìṣe lórí ẹrù", "Load actions"],
  "Separate positive factors with semicolons. Enter 1 explicitly only when no correction applies.":
    [
      "Positive Faktoren durch Semikolon trennen. 1 nur ausdrücklich eingeben, wenn keine Korrektur gilt.",
      "Ya ìwọ̀n rere sọ́tọ̀ pẹ̀lú semicolon. Tẹ 1 sílẹ̀ kedere bí kò bá sí àtúnṣe tó yẹ.",
      "Separate positive factors with semicolons. Enter 1 clearly only when no correction applies.",
    ],
  "Inputs validated for the supported model.": [
    "Eingaben für das unterstützte Modell validiert.",
    "A ti ṣàyẹ̀wò dátà fún àwòṣe tí a ṣe atilẹyin.",
    "Inputs validate for supported model.",
  ],
  "Validate inputs": ["Eingaben validieren", "Ṣàyẹ̀wò dátà", "Validate inputs"],
  "Previous completed range": [
    "Vorheriger abgeschlossener Zeitraum",
    "Àkókò tí ó parí ṣáájú",
    "Previous completed range",
  ],
  "Completed range": [
    "Abgeschlossener Zeitraum",
    "Àkókò tí ó parí",
    "Completed range",
  ],
  "Step backward": [
    "Einen Schritt zurück",
    "Padà ní ìgbésẹ̀ kan",
    "Step backward",
  ],
  "Step forward": [
    "Einen Schritt vor",
    "Lọ síwájú ní ìgbésẹ̀ kan",
    "Step forward",
  ],
  "Playback speed": [
    "Wiedergabegeschwindigkeit",
    "Iyára fífi hàn",
    "Playback speed",
  ],
  "EV session": ["Ladevorgang", "Àkókò gbigba agbára ọkọ̀ iná", "EV session"],
  "Enter electrical input power, supply voltage and operating time. Power factor affects current; energy duty affects consumption. Source evidence and every failed or incomplete check remain visible.":
    [
      "Elektrische Eingangsleistung, Versorgungsspannung und Betriebszeit eingeben. Leistungsfaktor beeinflusst Strom; Einschaltdauer beeinflusst Energieverbrauch. Quellen sowie fehlgeschlagene und unvollständige Prüfungen bleiben sichtbar.",
      "Tẹ agbára iná wọlé, foliteji ìpèsè àti àkókò iṣẹ́. Power factor ní ipa lórí ìṣàn; ipin àkókò agbára ní ipa lórí lílò. Ẹ̀rí orísun àti gbogbo àyẹ̀wò tí kò pé tàbí tí ó kùnà ṣì hàn.",
      "Enter electrical input power, supply voltage and operating time. Power factor affects current; energy duty affects consumption. Source evidence and every failed or incomplete check still show.",
    ],
  "Utilization and standby assumptions": [
    "Annahmen zu Auslastung und Bereitschaft",
    "Àfojúsùn lílò àti standby",
    "Utilization and standby assumptions",
  ],
  "Analytical spatial view": [
    "Analytische Raumansicht",
    "Àwòrán ààyè fún ìṣirò",
    "Analytical spatial view",
  ],
  "This perspective view uses the same project graph. Height and spacing express hierarchy, not surveyed physical dimensions. Flow values are representative hourly energy averages, not transient currents or measured telemetry.":
    [
      "Diese Perspektivansicht verwendet denselben Projektgraphen. Höhe und Abstand zeigen die Hierarchie, keine vermessenen Abmessungen. Flusswerte sind repräsentative stündliche Energiemittelwerte, keine transienten Ströme oder gemessene Telemetrie.",
      "Àwòrán ìhà yìí lo ètò iṣẹ́ kan náà. Gíga àti àlàfo fi ìpele hàn, kì í ṣe ìwọ̀n ibi gidi. Iye ṣíṣàn jẹ́ àárín agbára wákàtí àpẹẹrẹ, kì í ṣe ìṣàn ìgbà-kúkúrú tàbí ìwọ̀n gidi.",
      "This perspective view uses same project graph. Height and spacing show hierarchy, no be surveyed dimensions. Flow values na representative hourly energy averages, no be transient currents or measured telemetry.",
    ],
  "Orbit angle": ["Drehwinkel", "Igun yíyí", "Orbit angle"],
  Elevation: ["Höhenwinkel", "Igun gíga", "Elevation"],
  Zoom: ["Zoom", "Ìfàgùn àwòrán", "Zoom"],
  "Perspective project graph": [
    "Perspektivischer Projektgraph",
    "Àwòrán ìhà iṣẹ́",
    "Perspective project graph",
  ],
  "No active feed": [
    "Keine aktive Einspeisung",
    "Kò sí ìpèsè tó ń ṣiṣẹ́",
    "No active feed",
  ],
  "Representative hour": [
    "Repräsentative Stunde",
    "Wákàtí àpẹẹrẹ",
    "Representative hour",
  ],
  objects: ["Objekte", "àwọn ohun", "objects"],
  "Reset view": ["Ansicht zurücksetzen", "Tún àwòrán bẹ̀rẹ̀", "Reset view"],
  "Export spatial SVG": [
    "Raumansicht als SVG exportieren",
    "Gba SVG àwòrán ààyè",
    "Export spatial SVG",
  ],
  "Inspect spatial object": [
    "Raumobjekt untersuchen",
    "Ṣàyẹ̀wò ohun nínú ààyè",
    "Inspect spatial object",
  ],
  "Select object": ["Objekt auswählen", "Yan ohun", "Choose object"],
  "Unlock the load first before changing its phase or connection.": [
    "Last vor dem Ändern von Phase oder Verbindung entsperren.",
    "Kọ́kọ́ ṣí ẹrù kí o tó yí fáàsì tàbí ìsopọ̀ rẹ̀ padà.",
    "Unlock load first before changing phase or connection.",
  ],
  "Project changed. Preview the import again before applying.": [
    "Projekt geändert. Importvorschau vor dem Anwenden erneut erstellen.",
    "Iṣẹ́ ti yí padà. Tún wo ìkó wọlé ṣáájú kí o tó lò ó.",
    "Project don change. Preview import again before applying.",
  ],
  "Navigation width": [
    "Navigationsbreite",
    "Ìbú àtòjọ ìrìn",
    "Navigation width",
  ],
  "Project actions": ["Projektaktionen", "Ìṣe lórí iṣẹ́", "Project actions"],
  "Rename project": [
    "Projekt umbenennen",
    "Yí orúkọ iṣẹ́ padà",
    "Rename project",
  ],
  "Duplicate project": [
    "Projekt duplizieren",
    "Ṣẹ̀dá ẹ̀dà iṣẹ́",
    "Duplicate project",
  ],
  "Import project": ["Projekt importieren", "Kó iṣẹ́ wọlé", "Import project"],
  "Revision history": ["Revisionsverlauf", "Ìtàn àtúnṣe", "Revision history"],
  "Restore from trash": [
    "Aus Papierkorb wiederherstellen",
    "Mú padà láti inú àpótí ìdọ̀tí",
    "Restore from trash",
  ],
  "Close project": ["Projekt schließen", "Pa iṣẹ́ dé", "Close project"],
  "Save a copy": ["Kopie speichern", "Fi ẹ̀dà pamọ́", "Save a copy"],
  "Advanced schedules, starts and flexible loads": [
    "Erweiterte Zeitpläne, Anläufe und flexible Lasten",
    "Àkókò tó jinlẹ̀, ìbẹ̀rẹ̀ àti ẹrù tó ṣeé yí",
    "Advanced schedules, starts and flexible loads",
  ],
  "Detail level": ["Detailgrad", "Ìpele àlàyé", "Detail level"],
  Simple: ["Einfach", "Rọrùn", "Simple"],
  "Inspector width": ["Inspektorbreite", "Ìbú olùṣàyẹ̀wò", "Inspector width"],
  "Reset layout": [
    "Layout zurücksetzen",
    "Tún ìtòlẹ́sẹẹsẹ bẹ̀rẹ̀",
    "Reset layout",
  ],
  "Use Workspace backup to export projects, histories, bills and measurements together. Local browser storage is not a remote backup.":
    [
      "Mit Arbeitsbereichssicherung Projekte, Verläufe, Belege und Messungen gemeinsam exportieren. Lokaler Browserspeicher ist keine entfernte Sicherung.",
      "Lo àfipamọ́ àyè iṣẹ́ láti gba iṣẹ́, ìtàn, ìwé owó àti ìwọ̀n papọ̀. Ìfipamọ́ aṣàwákiri kì í ṣe àfipamọ́ ibi míì.",
      "Use Workspace backup to export projects, histories, bills and measurements together. Local browser storage no be remote backup.",
    ],
  "Edit selected object": [
    "Ausgewähltes Objekt bearbeiten",
    "Ṣàtúnṣe ohun tí a yàn",
    "Edit selected object",
  ],
  "CSV column and unit mapping": [
    "CSV-Spalten und Einheiten zuordnen",
    "Ìpín kọ́lọ́mù CSV àti ẹyọ",
    "CSV column and unit mapping",
  ],
  "Use default / omit": [
    "Standard verwenden / auslassen",
    "Lo iye àkọ́kọ́ / fi sílẹ̀",
    "Use default / omit",
  ],
  "Imported rating unit": [
    "Importierte Bemessungseinheit",
    "Ẹyọ iye tí a kó wọlé",
    "Imported rating unit",
  ],
  "Use entry-mode column (default kW)": [
    "Eingabemodus-Spalte verwenden (Standard kW)",
    "Lo kọ́lọ́mù ọ̀nà ìtẹ̀sí (kW àkọ́kọ́)",
    "Use entry-mode column (default kW)",
  ],
  "CSV numeric values use decimal points. Explicit rating units override the entry-mode column; W and VA are converted to kW and kVA.":
    [
      "CSV-Zahlen verwenden Dezimalpunkte. Explizite Einheiten überschreiben die Eingabemodus-Spalte; W und VA werden in kW und kVA umgerechnet.",
      "Iye CSV lo àmì dot fún eleemewa. Ẹyọ iye tí a sọ kedere borí kọ́lọ́mù ọ̀nà ìtẹ̀sí; a yí W àti VA sí kW àti kVA.",
      "CSV numbers use decimal points. Explicit rating units override entry-mode column; W and VA convert to kW and kVA.",
    ],
  "Refresh import preview": [
    "Importvorschau aktualisieren",
    "Tún àwòrán ìkó wọlé ṣe",
    "Refresh import preview",
  ],
  "Import destination": ["Importziel", "Ibi ìkó wọlé", "Import destination"],
  "Merge into current project": [
    "Mit aktuellem Projekt zusammenführen",
    "Dapọ̀ mọ́ iṣẹ́ lọ́wọ́lọ́wọ́",
    "Merge into current project",
  ],
  "Replace current project contents": [
    "Inhalt des aktuellen Projekts ersetzen",
    "Rọ́pò ohun inú iṣẹ́ lọ́wọ́lọ́wọ́",
    "Replace current project contents",
  ],
  Boards: ["Verteilungen", "Àwọn pátákó", "Boards"],
  Circuits: ["Stromkreise", "Àwọn àyíká", "Circuits"],
  Loads: ["Lasten", "Àwọn ẹrù", "Loads"],
};
