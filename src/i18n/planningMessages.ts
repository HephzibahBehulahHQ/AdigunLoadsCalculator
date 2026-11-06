/** Local planning language coverage. Technical units and user-supplied evidence stay unchanged.
 * Yoruba and Pidgin terminology remains subject to independent technical language review.
 */
export const planningMessages: Record<string, [string, string, string]> = {
  "Operating window": [
    "Betriebszeitfenster",
    "Àkókò iṣẹ́",
    "Operating time window",
  ],
  Duration: ["Dauer", "Gígùn àkókò", "How long"],
  "Weekdays (0 Sunday–6 Saturday)": [
    "Wochentage (0 Sonntag–6 Samstag)",
    "Ọjọ́ ọ̀sẹ̀ (0 Àìkú–6 Àbámẹ́ta)",
    "Weekdays (0 Sunday–6 Saturday)",
  ],
  "Leave empty for every day.": [
    "Leer lassen für jeden Tag.",
    "Fi sílẹ̀ láìkún fún gbogbo ọjọ́.",
    "Leave am empty to use every day.",
  ],
  "Months (1–12)": ["Monate (1–12)", "Oṣù (1–12)", "Months (1–12)"],
  "Leave empty for every month.": [
    "Leer lassen für jeden Monat.",
    "Fi sílẹ̀ láìkún fún gbogbo oṣù.",
    "Leave am empty to use every month.",
  ],
  "Effective from": [
    "Gültig ab",
    "Bẹ̀rẹ̀ sí í wúlò láti",
    "Start date for this rule",
  ],
  "Effective to": ["Gültig bis", "Wúlò títí dé", "Last date for this rule"],
  "Remove window": [
    "Zeitfenster entfernen",
    "Yọ àkókò iṣẹ́ kúrò",
    "Remove time window",
  ],
  "Add operating window": [
    "Betriebszeitfenster hinzufügen",
    "Fi àkókò iṣẹ́ kún un",
    "Add operating time window",
  ],
  "Correct invalid draft values before applying changes.": [
    "Korrigieren Sie ungültige Entwurfswerte vor dem Übernehmen.",
    "Ṣe àtúnṣe àwọn iye àkọ́kọ́ tí kò tọ́ kí o tó fi ìyípadà sílẹ̀.",
    "Correct invalid draft values before you apply changes.",
  ],
  "Changes saved. Undo is available in the workspace.": [
    "Änderungen gespeichert. Rückgängig ist im Arbeitsbereich verfügbar.",
    "A ti fi ìyípadà pamọ́. O lè dá a padà ní àgbègbè iṣẹ́.",
    "Changes don save. You fit undo for the workspace.",
  ],
  "Calendar worker failed. Your project is unchanged.": [
    "Die Kalenderberechnung ist fehlgeschlagen. Ihr Projekt ist unverändert.",
    "Ìṣirò kàlẹ́ńdà kùnà. Iṣẹ́ rẹ kò yí padà.",
    "Calendar calculation fail. Your project no change.",
  ],
  "Advanced planning": [
    "Erweiterte Planung",
    "Ìṣètò tó jinlẹ̀",
    "Advanced planning",
  ],
  "Calendar and constrained planning": [
    "Kalender und Planung mit Randbedingungen",
    "Kàlẹ́ńdà àti ìṣètò pẹ̀lú ààlà",
    "Calendar and planning within limits",
  ],
  "Planning workspaces": [
    "Planungsbereiche",
    "Àwọn àgbègbè ìṣètò",
    "Planning workspaces",
  ],
  "Calendar rules": ["Kalenderregeln", "Àwọn òfin kàlẹ́ńdà", "Calendar rules"],
  "Start sequences": ["Anlaufsequenzen", "Àtòjọ ìbẹ̀rẹ̀ iṣẹ́", "Start sequences"],
  "Flexible loads": [
    "Flexible Lasten",
    "Ẹrù tí a lè ṣètò àkókò rẹ̀",
    "Loads wey their time fit change",
  ],
  "Calendar bill": ["Kalenderabrechnung", "Owó kàlẹ́ńdà", "Calendar bill"],
  "Selected load": ["Ausgewählte Last", "Ẹrù tí a yàn", "Selected load"],
  "Select a load": ["Last auswählen", "Yan ẹrù kan", "Choose a load"],
  "Overlapping operating windows are unioned. Date exceptions override the entire local day, including overnight carry-in. Timed cycles replace average duty; on-state electrical current is unchanged.":
    [
      "Überlappende Betriebsfenster werden vereinigt. Datumsausnahmen ersetzen den gesamten lokalen Tag einschließlich Überträgen vom Vortag. Zeitzyklen ersetzen den mittleren Einschaltdauerfaktor; der Betriebsstrom bleibt unverändert.",
      "A so àwọn àkókò iṣẹ́ tó bò ara wọn pọ̀. Ìyàsọ́tọ̀ ọjọ́ rọ́pò gbogbo ọjọ́ agbègbè náà, pẹ̀lú iṣẹ́ tó kọjá ọ̀gànjọ́ láti ọjọ́ tó ṣáájú. Ìyípo àkókò rọ́pò duty àárín; ìṣàn iná nígbà iṣẹ́ kò yí padà.",
      "Overlapping time windows join together. Date exceptions replace the whole local day, including work wey enter from the previous night. Timed cycles replace average duty; on-state current no change.",
    ],
  "This load has an applied absolute schedule. Saving recurring rules replaces those timestamped windows.":
    [
      "Diese Last hat einen angewendeten Zeitplan mit festen Zeitpunkten. Das Speichern wiederkehrender Regeln ersetzt diese Zeitfenster.",
      "Ẹrù yìí ní ètò pẹ̀lú àkókò gangan. Fífipamọ́ òfin tó ń tún ara rẹ̀ ṣe máa rọ́pò àwọn àkókò wọ̀nyẹn.",
      "This load get a schedule with fixed timestamps. Saving repeating rules replaces those time windows.",
    ],
  "Holiday and date exceptions": [
    "Feiertags- und Datumsausnahmen",
    "Ìyàsọ́tọ̀ ọjọ́ ìsinmi àti ọjọ́ pàtó",
    "Holiday and special-date exceptions",
  ],
  "Date exception": ["Datumsausnahme", "Ìyàsọ́tọ̀ ọjọ́", "Special-date rule"],
  Date: ["Datum", "Ọjọ́", "Date"],
  "Exception action": [
    "Ausnahmeaktion",
    "Iṣẹ́ ìyàsọ́tọ̀",
    "What the exception does",
  ],
  "Closed / standby only": [
    "Geschlossen / nur Bereitschaft",
    "Títì / standby nìkan",
    "Closed / standby only",
  ],
  "Replacement operating windows": [
    "Ersatz-Betriebszeitfenster",
    "Àwọn àkókò iṣẹ́ àfidípò",
    "Replacement operating windows",
  ],
  "Remove exception": [
    "Ausnahme entfernen",
    "Yọ ìyàsọ́tọ̀ kúrò",
    "Remove exception",
  ],
  "Add date exception": [
    "Datumsausnahme hinzufügen",
    "Fi ìyàsọ́tọ̀ ọjọ́ kún un",
    "Add special-date rule",
  ],
  "Explicit timed duty": [
    "Expliziter zeitlicher Einschaltzyklus",
    "Ìyípo iṣẹ́ pẹ̀lú àkókò tí a sọ",
    "Entered timed duty cycle",
  ],
  "Use explicit on/off cycle instead of average duty": [
    "Expliziten Ein/Aus-Zyklus statt mittlerer Einschaltdauer verwenden",
    "Lo àkókò títan àti pípa dípò duty àárín",
    "Use entered on/off cycle instead of average duty",
  ],
  "On duration": ["Einschaltdauer", "Àkókò títan", "On duration"],
  "Off duration": ["Ausschaltdauer", "Àkókò pípa", "Off duration"],
  "Local midnight offset": [
    "Versatz ab lokaler Mitternacht",
    "Ìyàtọ̀ sí ọ̀gànjọ́ agbègbè",
    "Offset from local midnight",
  ],
  "Save calendar rules": [
    "Kalenderregeln speichern",
    "Fi òfin kàlẹ́ńdà pamọ́",
    "Save calendar rules",
  ],
  "Use basic daily schedule": [
    "Einfachen Tageszeitplan verwenden",
    "Lo ètò ojoojúmọ́ tó rọrùn",
    "Use basic daily schedule",
  ],
  "Add a load before defining its calendar.": [
    "Fügen Sie vor der Kalenderdefinition eine Last hinzu.",
    "Fi ẹrù kún un kí o tó ṣe kàlẹ́ńdà rẹ̀.",
    "Add a load before you set its calendar.",
  ],
  "Enter actual starting current, PF and duration from your chosen model or equipment evidence. Each event replaces that load during the stated seconds; simultaneous and staggered starts use the same project. This is not a transient voltage/frequency solver.":
    [
      "Geben Sie Anlaufstrom, Leistungsfaktor und Dauer aus Ihrem Modell oder Gerätenachweis ein. Jedes Ereignis ersetzt die Last während der angegebenen Sekunden; gleichzeitige und gestaffelte Starts verwenden dasselbe Projekt. Transiente Spannung und Frequenz werden nicht gelöst.",
      "Tẹ ìṣàn ìbẹ̀rẹ̀, PF àti àkókò láti àwòṣe tàbí ẹ̀rí ohun èlò rẹ sínú. Ìṣẹ̀lẹ̀ kọ̀ọ̀kan rọ́pò ẹrù náà ní àwọn ìṣẹ́jú-àáyá tí a sọ; ìbẹ̀rẹ̀ papọ̀ àti ní tẹ̀léntẹ̀lé lo iṣẹ́ kan náà. Kì í ṣe solver voltage/frequency ìyípadà kánkán.",
      "Enter starting current, PF and duration from your model or equipment evidence. Each event replaces that load during the stated seconds. Simultaneous and staggered starts use the same project. This no solve transient voltage or frequency.",
    ],
  "Start event": ["Anlaufereignis", "Ìṣẹ̀lẹ̀ ìbẹ̀rẹ̀", "Start event"],
  Load: ["Last", "Ẹrù", "Load"],
  "Start instant (explicit offset)": [
    "Startzeitpunkt (expliziter UTC-Versatz)",
    "Àkókò ìbẹ̀rẹ̀ (UTC offset tí a sọ)",
    "Start instant (enter UTC offset)",
  ],
  "Starting current basis": [
    "Anlaufstrombasis",
    "Ìpìlẹ̀ ìṣàn ìbẹ̀rẹ̀",
    "Starting current basis",
  ],
  "Entered total current (A)": [
    "Eingegebener Gesamtstrom (A)",
    "Ìṣàn àpapọ̀ tí a tẹ̀ sínú (A)",
    "Entered total current (A)",
  ],
  "Entered on-state current multiplier": [
    "Eingegebener Betriebsstrom-Multiplikator",
    "Olùsọ ìṣàn iṣẹ́ di púpọ̀ tí a tẹ̀ sínú",
    "Entered on-state current multiplier",
  ],
  "Current multiplier": [
    "Strommultiplikator",
    "Olùsọ ìṣàn di púpọ̀",
    "Current multiplier",
  ],
  "Total starting current": [
    "Gesamter Anlaufstrom",
    "Àpapọ̀ ìṣàn ìbẹ̀rẹ̀",
    "Total starting current",
  ],
  "Starting displacement PF": [
    "Verschiebungsfaktor beim Anlauf",
    "Displacement PF ìbẹ̀rẹ̀",
    "Starting displacement PF",
  ],
  "Starting method": ["Anlaufverfahren", "Ọ̀nà ìbẹ̀rẹ̀", "Starting method"],
  "Delete start event": [
    "Anlaufereignis löschen",
    "Pa ìṣẹ̀lẹ̀ ìbẹ̀rẹ̀ rẹ́",
    "Delete start event",
  ],
  "Add start event": [
    "Anlaufereignis hinzufügen",
    "Fi ìṣẹ̀lẹ̀ ìbẹ̀rẹ̀ kún un",
    "Add start event",
  ],
  "Save start events": [
    "Anlaufereignisse speichern",
    "Fi àwọn ìṣẹ̀lẹ̀ ìbẹ̀rẹ̀ pamọ́",
    "Save start events",
  ],
  "Assess start sequence": [
    "Anlaufsequenz bewerten",
    "Ṣàyẹ̀wò àtòjọ ìbẹ̀rẹ̀",
    "Check start sequence",
  ],
  "Peak starting demand": [
    "Maximale Anlaufleistung",
    "Ìbéèrè agbára ìbẹ̀rẹ̀ tó ga jù",
    "Peak starting demand",
  ],
  Timestamp: ["Zeitstempel", "Àmì àkókò", "Timestamp"],
  "Export complete start sequence": [
    "Vollständige Anlaufsequenz exportieren",
    "Gbé gbogbo àtòjọ ìbẹ̀rẹ̀ jáde",
    "Export full start sequence",
  ],
  "Authorize a process window and exact operating energy. The bounded heuristic respects on-state power, minimum uninterrupted runs, phase/site/board/circuit limits and locked or critical equipment. Preview first; applying uses the workspace undo history.":
    [
      "Geben Sie Prozessfenster und genaue Betriebsenergie frei. Die begrenzte Heuristik berücksichtigt Betriebsleistung, Mindestlaufzeiten ohne Unterbrechung, Phasen-/Standort-/Verteiler-/Stromkreisgrenzen sowie gesperrte und kritische Geräte. Prüfen Sie zuerst die Vorschau; Änderungen können rückgängig gemacht werden.",
      "Fún àkókò iṣẹ́ àti energy iṣẹ́ gangan ní àṣẹ. Ọ̀nà ìṣètò tó ní ààlà yìí tẹ̀lé agbára nígbà iṣẹ́, àkókò iṣẹ́ tó kéré jù láìdá dúró, ààlà phase/ibi/pánẹ́ẹ̀lì/síkítì àti ohun èlò tí a tì tàbí tó ṣe pàtàkì. Ṣàyẹ̀wò àwòkọ́kọ́; o lè dá ìyípadà padà.",
      "Authorize a process window and exact running energy. The bounded planner respects on-state power, minimum continuous runs, phase/site/board/circuit limits and locked or critical equipment. Preview first; you fit undo applied changes.",
    ],
  "Flexible process": [
    "Flexibler Prozess",
    "Iṣẹ́ tí àkókò rẹ̀ lè yí",
    "Flexible process",
  ],
  "Required operating energy": [
    "Erforderliche Betriebsenergie",
    "Energy iṣẹ́ tí a nílò",
    "Required running energy",
  ],
  "Minimum uninterrupted run": [
    "Mindestlaufzeit ohne Unterbrechung",
    "Àkókò iṣẹ́ tó kéré jù láìdá dúró",
    "Minimum continuous run",
  ],
  "Priority (higher first)": [
    "Priorität (höhere zuerst)",
    "Ìṣáájú (èyí tó ga kọ́kọ́)",
    "Priority (higher first)",
  ],
  "Authorization / source": [
    "Freigabe / Quelle",
    "Àṣẹ / orísun",
    "Authorization / source",
  ],
  "May split into valid run blocks": [
    "Darf in gültige Laufblöcke geteilt werden",
    "A lè pín sí àwọn àkókò iṣẹ́ tó tọ́",
    "May split into valid run blocks",
  ],
  Locked: ["Gesperrt", "Títì", "Locked"],
  "Available from (explicit offset)": [
    "Verfügbar ab (expliziter UTC-Versatz)",
    "Wà láti (UTC offset tí a sọ)",
    "Available from (enter UTC offset)",
  ],
  "Deadline / window end": [
    "Frist / Ende des Zeitfensters",
    "Àkókò ìparí / òpin àkókò",
    "Deadline / window end",
  ],
  "Add available window": [
    "Verfügbares Zeitfenster hinzufügen",
    "Fi àkókò tó wà kún un",
    "Add available time window",
  ],
  "Remove requirement": [
    "Anforderung entfernen",
    "Yọ ohun tí a béèrè kúrò",
    "Remove requirement",
  ],
  "Add flexible process": [
    "Flexiblen Prozess hinzufügen",
    "Fi iṣẹ́ tó lè yí àkókò kún un",
    "Add flexible process",
  ],
  "Save requirements": [
    "Anforderungen speichern",
    "Fi ohun tí a béèrè pamọ́",
    "Save requirements",
  ],
  "Scheduling objective": [
    "Planungsziel",
    "Ète ìṣètò àkókò",
    "Scheduling target",
  ],
  "Priority and deadline": [
    "Priorität und Frist",
    "Ìṣáájú àti àkókò ìparí",
    "Priority and deadline",
  ],
  "Lowest entered tariff": [
    "Günstigster eingegebener Tarif",
    "Tariff tí a tẹ̀ sínú tó kéré jù",
    "Lowest entered tariff",
  ],
  "Supplied-generation following": [
    "Nach eingegebener Erzeugung",
    "Tẹ̀lé agbára tí a sọ pé a máa pèsè",
    "Follow entered generation",
  ],
  "Site power limit": [
    "Standortleistungsgrenze",
    "Ààlà agbára ibi",
    "Site power limit",
  ],
  "Entered interval generation": [
    "Eingegebene Intervallerzeugung",
    "Agbára ìpèsè ní àkókò kọ̀ọ̀kan tí a tẹ̀ sínú",
    "Entered generation per interval",
  ],
  "One value for every planning interval": [
    "Ein Wert je Planungsintervall",
    "Iye kan fún àkókò ìṣètò kọ̀ọ̀kan",
    "One value for each planning interval",
  ],
  "Preview constrained schedule": [
    "Vorschau des begrenzten Zeitplans",
    "Wo àwòkọ́kọ́ ètò pẹ̀lú ààlà",
    "Preview schedule within limits",
  ],
  "Apply reviewed schedule": [
    "Geprüften Zeitplan übernehmen",
    "Lo ètò tí a ti ṣàyẹ̀wò",
    "Apply reviewed schedule",
  ],
  "Save requirements before previewing.": [
    "Speichern Sie die Anforderungen vor der Vorschau.",
    "Fi ohun tí a béèrè pamọ́ kí o tó wo àwòkọ́kọ́.",
    "Save requirements before preview.",
  ],
  "Feasible within entered constraints": [
    "Innerhalb eingegebener Grenzen durchführbar",
    "Ó ṣeé ṣe láàárín ààlà tí a tẹ̀ sínú",
    "Plan fits the entered limits",
  ],
  "Unmet or incomplete requirements": [
    "Unerfüllte oder unvollständige Anforderungen",
    "Ohun tí a béèrè kò pé tàbí a kò mú ṣẹ",
    "Unmet or incomplete requirements",
  ],
  "candidates checked": [
    "Kandidaten geprüft",
    "àwọn ètò tí a ṣàyẹ̀wò",
    "candidates checked",
  ],
  Process: ["Prozess", "Iṣẹ́", "Process"],
  Delivered: ["Geliefert", "Tí a pèsè", "Delivered"],
  Unmet: ["Nicht erfüllt", "Tí a kò mú ṣẹ", "Unmet"],
  Start: ["Beginn", "Ìbẹ̀rẹ̀", "Start"],
  End: ["Ende", "Ìparí", "End"],
  "Actual calendar period": [
    "Tatsächlicher Kalenderzeitraum",
    "Àkókò kàlẹ́ńdà gangan",
    "Actual calendar period",
  ],
  "Range start (explicit offset)": [
    "Zeitraumbeginn (expliziter UTC-Versatz)",
    "Ìbẹ̀rẹ̀ àkókò (UTC offset tí a sọ)",
    "Range start (enter UTC offset)",
  ],
  "Range end (explicit offset)": [
    "Zeitraumende (expliziter UTC-Versatz)",
    "Ìparí àkókò (UTC offset tí a sọ)",
    "Range end (enter UTC offset)",
  ],
  minutes: ["Minuten", "ìṣẹ́jú", "minutes"],
  "Explicit offsets select repeated times deliberately; elapsed duration includes daylight-saving changes.":
    [
      "Explizite UTC-Versätze wählen wiederholte Uhrzeiten eindeutig; die verstrichene Dauer berücksichtigt Sommerzeitwechsel.",
      "UTC offset tí a sọ yan èyí tí a fẹ́ nínú àkókò tó tún wá; gígùn àkókò ka ìyípadà daylight-saving sí.",
      "Explicit UTC offsets choose the intended repeated time; elapsed duration includes daylight-saving changes.",
    ],
  "Include demand, standing and tax billing lines": [
    "Leistungs-, Grundpreis- und Steuerpositionen einbeziehen",
    "Fi owó demand, owó ìdúró àti owó orí kún un",
    "Include demand, standing-charge and tax lines",
  ],
  "Calculating…": ["Berechnung läuft…", "Ìṣirò ń lọ…", "Calculating…"],
  "Run calendar and bill": [
    "Kalender und Abrechnung berechnen",
    "Ṣe ìṣirò kàlẹ́ńdà àti owó",
    "Run calendar and bill",
  ],
  "Completed calendar result": [
    "Abgeschlossenes Kalenderergebnis",
    "Èsì kàlẹ́ńdà tó parí",
    "Completed calendar result",
  ],
  "Interval peak": ["Intervallspitze", "Tí ó ga jù ní àkókò", "Interval peak"],
  "Calendar interval average power": [
    "Mittlere Leistung je Kalenderintervall",
    "Agbára àárín ní àkókò kàlẹ́ńdà kọ̀ọ̀kan",
    "Average power per calendar interval",
  ],
  "Export complete calendar": [
    "Vollständigen Kalender exportieren",
    "Gbé gbogbo kàlẹ́ńdà jáde",
    "Export full calendar",
  ],
  "Separate billing lines": [
    "Getrennte Abrechnungspositionen",
    "Àwọn ìlà owó ọ̀tọ̀ọ̀tọ̀",
    "Separate billing lines",
  ],
  "Import energy": ["Bezugsenergie", "Energy tí a gbà wọlé", "Imported energy"],
  "Export credit": [
    "Einspeisegutschrift",
    "Owó ìdínkù fún energy tí a rán jáde",
    "Export credit",
  ],
  "Standing charges": ["Grundpreise", "Owó ìdúró", "Standing charges"],
  "Demand charge": ["Leistungspreis", "Owó demand", "Demand charge"],
  Tax: ["Steuer", "Owó orí", "Tax"],
  Total: ["Gesamt", "Àpapọ̀", "Total"],
  "Complete within the entered billing model": [
    "Im eingegebenen Abrechnungsmodell vollständig",
    "Ó pé nínú àwòṣe owó tí a tẹ̀ sínú",
    "Complete within the entered billing model",
  ],
  "Incomplete billing evidence — review missing checks": [
    "Unvollständige Abrechnungsnachweise — fehlende Prüfungen ansehen",
    "Ẹ̀rí owó kò pé — ṣàyẹ̀wò ohun tí ó kù",
    "Billing evidence no complete — review missing checks",
  ],
  "Select an existing board.": [
    "Wählen Sie einen vorhandenen Verteiler.",
    "Yan pánẹ́ẹ̀lì tó wà.",
    "Choose a board wey exists.",
  ],
  "Select an existing circuit.": [
    "Wählen Sie einen vorhandenen Stromkreis.",
    "Yan síkítì tó wà.",
    "Choose a circuit wey exists.",
  ],
  "Cumulative feeder assessment": [
    "Bewertung des kumulierten Zuleitungswegs",
    "Ìṣàyẹ̀wò àpapọ̀ ọ̀nà ìpèsè",
    "Cumulative feeder check",
  ],
  "Source-to-load route": [
    "Weg von Quelle zu Last",
    "Ọ̀nà láti orísun dé ẹrù",
    "Source-to-load route",
  ],
  "Every upstream board needs its entered feeder impedance, including the source-to-main-board segment. Missing data is incomplete, never an assumed zero. Set explicit zero only for a documented ideal boundary. Shared feeders carry all descendant loads under the same scenario.":
    [
      "Für jeden vorgeschalteten Verteiler ist die Zuleitungsimpedanz erforderlich, auch von der Quelle zum Hauptverteiler. Fehlende Daten gelten als unvollständig, nicht als null. Null nur für eine dokumentierte ideale Grenze eingeben. Gemeinsame Zuleitungen tragen alle nachgeschalteten Lasten desselben Szenarios.",
      "Pánẹ́ẹ̀lì kọ̀ọ̀kan tó wà lókè nílò impedance ọ̀nà ìpèsè rẹ̀, pẹ̀lú láti orísun dé pánẹ́ẹ̀lì àkọ́kọ́. Data tí kò sí kò pé; a kò gbà á sí odo. Lo odo fún ààlà ideal tí ẹ̀rí wà nìkan. Ọ̀nà ìpèsè àjọpín gbé gbogbo ẹrù tó wà ní ìsàlẹ̀ ní scenario kan náà.",
      "Every upstream board needs entered feeder impedance, including source to main board. Missing data means incomplete, never assumed zero. Enter zero only for a documented ideal boundary. Shared feeders carry all downstream loads in the same scenario.",
    ],
  "Segment input evidence": [
    "Eingabenachweise zum Abschnitt",
    "Ẹ̀rí iye apá ọ̀nà",
    "Segment input evidence",
  ],
  "Segment to edit": [
    "Zu bearbeitender Abschnitt",
    "Apá ọ̀nà tí a fẹ́ ṣàtúnṣe",
    "Segment to edit",
  ],
  Feeder: ["Zuleitung", "Ọ̀nà ìpèsè", "Feeder"],
  "Final circuit": ["Endstromkreis", "Síkítì ìkẹyìn", "Final circuit"],
  "One-way route length": [
    "Einfache Leitungslänge",
    "Gígùn ọ̀nà lọ nìkan",
    "One-way route length",
  ],
  "Outgoing conductor resistance": [
    "Widerstand des Hinleiters",
    "Resistance okun lọ",
    "Outgoing conductor resistance",
  ],
  "Outgoing conductor reactance": [
    "Reaktanz des Hinleiters",
    "Reactance okun lọ",
    "Outgoing conductor reactance",
  ],
  "Return / neutral resistance (optional)": [
    "Rückleiter-/Neutralleiterwiderstand (optional)",
    "Resistance okun padà / neutral (àṣàyàn)",
    "Return / neutral resistance (optional)",
  ],
  "Return / neutral reactance (optional)": [
    "Rückleiter-/Neutralleiterreaktanz (optional)",
    "Reactance okun padà / neutral (àṣàyàn)",
    "Return / neutral reactance (optional)",
  ],
  "Cross-section (record only)": [
    "Querschnitt (nur Aufzeichnung)",
    "Ìwọ̀n àgbélébùú (àkọsílẹ̀ nìkan)",
    "Cross-section (record only)",
  ],
  "Sourced base ampacity": [
    "Belegte Basisstrombelastbarkeit",
    "Ampacity ìpìlẹ̀ pẹ̀lú orísun",
    "Base ampacity with source",
  ],
  "Entered voltage criterion": [
    "Eingegebenes Spannungskriterium",
    "Ìlànà voltage tí a tẹ̀ sínú",
    "Entered voltage criterion",
  ],
  "Applicable ampacity correction factors": [
    "Anwendbare Strombelastbarkeits-Korrekturfaktoren",
    "Àwọn correction factor ampacity tó wúlò",
    "Applicable ampacity correction factors",
  ],
  "Separate factors with semicolons; use explicit 1 when no derating applies.":
    [
      "Faktoren durch Semikolon trennen; ausdrücklich 1 eingeben, wenn keine Reduzierung gilt.",
      "Ya àwọn factor sọ́tọ̀ pẹ̀lú semicolon; lo 1 tí derating kò bá sí.",
      "Separate factors with semicolons; enter 1 when no derating applies.",
    ],
  "Impedance / ampacity source and conditions": [
    "Quelle und Bedingungen für Impedanz / Strombelastbarkeit",
    "Orísun àti ipò impedance / ampacity",
    "Impedance / ampacity source and conditions",
  ],
  "Return impedance left blank means equal outgoing and return conductors, not zero return impedance. Cross-section alone does not select ampacity.":
    [
      "Ein leerer Rückleiterwert bedeutet gleiche Hin- und Rückleiter, nicht Impedanz null. Der Querschnitt allein bestimmt keine Strombelastbarkeit.",
      "Tí impedance padà bá ṣófo, okun lọ àti padà ní iye kan náà; kì í ṣe odo. Ìwọ̀n àgbélébùú nìkan kò yan ampacity.",
      "Blank return impedance means equal outgoing and return conductors, not zero return impedance. Cross-section alone no select ampacity.",
    ],
  "Save segment evidence": [
    "Abschnittsnachweise speichern",
    "Fi ẹ̀rí apá ọ̀nà pamọ́",
    "Save segment evidence",
  ],
  "Remove segment evidence": [
    "Abschnittsnachweise entfernen",
    "Yọ ẹ̀rí apá ọ̀nà kúrò",
    "Remove segment evidence",
  ],
  Saved: ["Gespeichert", "A ti fi pamọ́", "Saved"],
  "Endpoint and scenario": [
    "Endpunkt und Szenario",
    "Òpin ọ̀nà àti scenario",
    "Endpoint and scenario",
  ],
  "Endpoint load": ["Last am Endpunkt", "Ẹrù ní òpin ọ̀nà", "Endpoint load"],
  "Operating scenario": [
    "Betriebsszenario",
    "Scenario iṣẹ́",
    "Operating scenario",
  ],
  "Conservative running": [
    "Konservativer Betrieb",
    "Iṣẹ́ pẹ̀lú ìṣirò on-state tó ṣọ́ra",
    "Conservative running",
  ],
  "Entered start instant": [
    "Eingegebener Anlaufzeitpunkt",
    "Àkókò ìbẹ̀rẹ̀ tí a tẹ̀ sínú",
    "Entered start instant",
  ],
  "Cumulative voltage criterion override": [
    "Abweichendes kumuliertes Spannungskriterium",
    "Ìlànà voltage àpapọ̀ àfidípò",
    "Override cumulative voltage criterion",
  ],
  "Scenario instant (optional for running)": [
    "Szenariozeitpunkt (bei Betrieb optional)",
    "Àkókò scenario (àṣàyàn fún iṣẹ́)",
    "Scenario instant (optional for running)",
  ],
  "Use an entered start event": [
    "Eingegebenes Anlaufereignis verwenden",
    "Lo ìṣẹ̀lẹ̀ ìbẹ̀rẹ̀ tí a tẹ̀ sínú",
    "Use an entered start event",
  ],
  "Select a start event": [
    "Anlaufereignis auswählen",
    "Yan ìṣẹ̀lẹ̀ ìbẹ̀rẹ̀ kan",
    "Choose a start event",
  ],
  "Without an instant, running assessment uses every assigned load at on-state current. A selected instant applies its calendar while retaining conservative duty headroom. Starting assessment requires an entered active event.":
    [
      "Ohne Zeitpunkt werden alle zugeordneten Lasten mit Betriebsstrom bewertet. Ein gewählter Zeitpunkt berücksichtigt den Kalender bei konservativer Stromreserve. Die Anlaufbewertung erfordert ein eingegebenes, aktives Ereignis.",
      "Láìsí àkókò pàtó, ìṣàyẹ̀wò lo gbogbo ẹrù tí a yàn pẹ̀lú ìṣàn nígbà iṣẹ́. Àkókò tí a yàn lo kàlẹ́ńdà rẹ̀, ṣùgbọ́n ó pa headroom duty tó ṣọ́ra mọ́. Ìṣàyẹ̀wò ìbẹ̀rẹ̀ nílò ìṣẹ̀lẹ̀ tó ń ṣẹlẹ̀ tí a tẹ̀ sínú.",
      "Without an instant, the check uses every assigned load at on-state current. A chosen instant applies its calendar while keeping conservative duty headroom. Starting check needs an entered event wey dey active.",
    ],
  "Assess complete route": [
    "Vollständigen Weg bewerten",
    "Ṣàyẹ̀wò gbogbo ọ̀nà",
    "Check complete route",
  ],
  "Route result": ["Wegeergebnis", "Èsì ọ̀nà", "Route result"],
  "Signed cumulative drop": [
    "Kumulierter Spannungsfall mit Vorzeichen",
    "Ìṣubú voltage àpapọ̀ pẹ̀lú àmì",
    "Signed cumulative drop",
  ],
  "Receiving voltage estimate": [
    "Geschätzte Empfangsspannung",
    "Voltage tí a fojú díwọ̀n ní òpin",
    "Receiving voltage estimate",
  ],
  "Total shared segment losses": [
    "Gesamtverluste gemeinsamer Abschnitte",
    "Àpapọ̀ àdánù apá ọ̀nà àjọpín",
    "Total shared segment losses",
  ],
  Segment: ["Abschnitt", "Apá ọ̀nà", "Segment"],
  Loss: ["Verlust", "Àdánù", "Loss"],
  "Voltage contributions": [
    "Spannungsbeiträge",
    "Ìpín voltage",
    "Voltage contributions",
  ],
  "Capacity check": [
    "Kapazitätsprüfung",
    "Ìṣàyẹ̀wò agbára gbígbà",
    "Capacity check",
  ],
  loads: ["Lasten", "ẹrù", "loads"],
  "Endpoint connection": [
    "Endpunktanschluss",
    "Ìsopọ̀ òpin ọ̀nà",
    "Endpoint connection",
  ],
  "Signed drop": [
    "Spannungsfall mit Vorzeichen",
    "Ìṣubú pẹ̀lú àmì",
    "Signed drop",
  ],
  "Receiving voltage": [
    "Empfangsspannung",
    "Voltage ní òpin",
    "Receiving voltage",
  ],
  "Export route evidence": [
    "Wegenachweise exportieren",
    "Gbé ẹ̀rí ọ̀nà jáde",
    "Export route evidence",
  ],
  "Supplied wind and generation limits": [
    "Eingegebener Wind und Erzeugungsgrenzen",
    "Afẹ́fẹ́ tí a tẹ̀ sínú àti ààlà ìpèsè",
    "Entered wind and generation limits",
  ],
  "Hourly wind AC output, 00:00–23:00": [
    "Stündliche Wind-AC-Leistung, 00:00–23:00",
    "Agbára AC afẹ́fẹ́ ní wákàtí, 00:00–23:00",
    "Hourly wind AC output, 00:00–23:00",
  ],
  "Wind profile source / period": [
    "Quelle / Zeitraum des Windprofils",
    "Orísun / àkókò profile afẹ́fẹ́",
    "Wind profile source / period",
  ],
  "PV inverter AC limit": [
    "PV-Wechselrichter-AC-Grenze",
    "Ààlà AC inverter PV",
    "PV inverter AC limit",
  ],
  "Grid import limit": [
    "Netzbezugsgrenze",
    "Ààlà agbára láti grid",
    "Grid import limit",
  ],
  "Grid export limit": [
    "Netzeinspeisegrenze",
    "Ààlà agbára sí grid",
    "Grid export limit",
  ],
  "Leave empty for no entered limit; zero means no allowed power.": [
    "Leer lassen, wenn keine Grenze eingegeben ist; null bedeutet keine erlaubte Leistung.",
    "Fi ṣófo tí ààlà kò bá sí; odo túmọ̀ sí pé kò sí agbára tí a yọ̀ǹda.",
    "Leave empty if no limit dey; zero means no power allowed.",
  ],
  "Storage dispatch": [
    "Speichereinsatz",
    "Ìṣètò agbára ìpamọ́",
    "Storage dispatch",
  ],
  "Dispatch objective": ["Einsatzziel", "Ète ìṣètò agbára", "Dispatch target"],
  "Self-consumption": [
    "Eigenverbrauch",
    "Lílò agbára ti ara ẹni",
    "Use your own generation",
  ],
  "Preserve critical-load reserve": [
    "Reserve für kritische Lasten erhalten",
    "Pa àfipamọ́ fún ẹrù pàtàkì mọ́",
    "Keep reserve for critical loads",
  ],
  "Entered time-of-use charging": [
    "Laden nach eingegebenen Zeitfenstern",
    "Ṣíṣaja ní àkókò tí a tẹ̀ sínú",
    "Charge in entered time windows",
  ],
  "Grid peak shaving": [
    "Netzspitzenbegrenzung",
    "Dídín peak grid kù",
    "Cut grid peaks",
  ],
  "Grid-connected reserve SOC": [
    "Reserve-SOC bei Netzanschluss",
    "Reserve SOC nígbà ìsopọ̀ grid",
    "Reserve SOC while grid dey connected",
  ],
  "Grid-import peak target": [
    "Zielwert der Netzbezugsspitze",
    "Ète peak agbára láti grid",
    "Grid-import peak target",
  ],
  "Reserve is an energy floor while grid connected; an outage may use reserve down to the absolute minimum SOC. Each conversion loss is applied once. Peak targets can remain unmet when storage power or energy is insufficient.":
    [
      "Die Reserve ist eine Energieuntergrenze bei Netzanschluss; bei Ausfall kann sie bis zum absoluten Mindest-SOC genutzt werden. Jeder Umwandlungsverlust wird einmal erfasst. Bei unzureichender Speicherleistung oder -energie können Spitzenziele verfehlt werden.",
      "Reserve jẹ́ ààlà energy ìsàlẹ̀ nígbà ìsopọ̀ grid; nígbà ìdálẹ́kun iná, a lè lò ó títí dé minimum SOC gangan. A ka àdánù ìyípadà kọ̀ọ̀kan lẹ́ẹ̀kan. Ète peak lè má ṣẹ tí agbára tàbí energy ìpamọ́ kò bá tó.",
      "Reserve is the energy floor while grid dey connected; outage fit use reserve down to absolute minimum SOC. Each conversion loss counts once. Peak target fit remain unmet if storage power or energy no reach.",
    ],
  "Explicitly permit grid charging in entered windows": [
    "Netzladung in eingegebenen Zeitfenstern ausdrücklich erlauben",
    "Yọ̀ǹda ṣíṣaja láti grid ní àkókò tí a tẹ̀ sínú",
    "Explicitly allow grid charging in entered windows",
  ],
  "Charge-window start": [
    "Beginn des Ladefensters",
    "Ìbẹ̀rẹ̀ àkókò ṣaja",
    "Charging-window start",
  ],
  "Charge-window end": [
    "Ende des Ladefensters",
    "Ìparí àkókò ṣaja",
    "Charging-window end",
  ],
  "Target SOC": ["Ziel-SOC", "SOC tí a fẹ́ dé", "Target SOC"],
  "Remove charging window": [
    "Ladefenster entfernen",
    "Yọ àkókò ṣaja kúrò",
    "Remove charging window",
  ],
  "Add grid-charge window": [
    "Netzladefenster hinzufügen",
    "Fi àkókò ṣaja grid kún un",
    "Add grid-charging window",
  ],
  "Backup source and load priority": [
    "Ersatzstromquelle und Lastpriorität",
    "Orísun ìrànwọ́ àti ìṣáájú ẹrù",
    "Backup source and load priority",
  ],
  "Use evidenced source and explicit outage shedding": [
    "Belegte Quelle und expliziten Lastabwurf bei Ausfall verwenden",
    "Lo orísun pẹ̀lú ẹ̀rí àti yíyọ ẹrù tí a sọ nígbà ìdálẹ́kun",
    "Use evidenced source and entered outage shedding",
  ],
  "Entered island-forming source": [
    "Eingegebene netzbildende Inselquelle",
    "Orísun tó lè dá island grid sílẹ̀ tí a tẹ̀ sínú",
    "Entered island-forming source",
  ],
  "Select an evidenced source": [
    "Quelle mit Nachweisen auswählen",
    "Yan orísun pẹ̀lú ẹ̀rí",
    "Choose a source with evidence",
  ],
  "Additional restart delay": [
    "Zusätzliche Wiederanlaufverzögerung",
    "Àfikún ìdádúró ìtúnbẹ̀rẹ̀",
    "Additional restart delay",
  ],
  "Serve only loads marked critical": [
    "Nur als kritisch markierte Lasten versorgen",
    "Pèsè fún ẹrù tí a samì pàtàkì nìkan",
    "Supply only loads marked critical",
  ],
  "Require entered black-start capability": [
    "Eingegebene Schwarzstartfähigkeit voraussetzen",
    "Béèrè agbára black-start tí a tẹ̀ sínú",
    "Require entered black-start capability",
  ],
  "Add a load to the priority order": [
    "Last zur Prioritätsreihenfolge hinzufügen",
    "Fi ẹrù kún àtòjọ ìṣáájú",
    "Add a load to the priority order",
  ],
  "Move up": ["Nach oben", "Gbé sókè", "Move up"],
  Remove: ["Entfernen", "Yọ kúrò", "Remove"],
  "Loads outside the selected source boundary, incompatible phases, missing transfer/black-start evidence and restart delays prevent backup supply. Whole loads are shed in the entered priority order. No generator energy is invented from a source nameplate; generation comes from the entered profiles.":
    [
      "Lasten außerhalb der gewählten Quellengrenze, unpassende Phasen, fehlende Umschalt-/Schwarzstartnachweise und Wiederanlaufverzögerungen verhindern Ersatzversorgung. Ganze Lasten werden nach eingegebener Priorität abgeworfen. Aus einem Typenschild wird keine Generatorenergie abgeleitet; Erzeugung stammt aus eingegebenen Profilen.",
      "Ẹrù tó wà lóde ààlà orísun, phase tí kò bá mu, ẹ̀rí transfer/black-start tí kò sí àti ìdádúró ìtúnbẹ̀rẹ̀ dènà ìpèsè ìrànwọ́. A yọ gbogbo ẹrù ní àtòjọ ìṣáájú tí a tẹ̀ sínú. A kò dá energy generator láti nameplate; profile tí a tẹ̀ sínú ni ìpèsè wá láti.",
      "Loads outside the chosen source boundary, incompatible phases, missing transfer/black-start evidence and restart delays block backup supply. Whole loads shed in the entered priority order. Source nameplate no invent generator energy; generation comes from entered profiles.",
    ],
  "Dispatch period": [
    "Einsatzzeitraum",
    "Àkókò ìṣètò agbára",
    "Dispatch period",
  ],
  "Use actual timestamped calendar range": [
    "Tatsächlichen Kalenderzeitraum mit Zeitstempeln verwenden",
    "Lo àkókò kàlẹ́ńdà gangan pẹ̀lú timestamp",
    "Use actual timestamped calendar range",
  ],
  "Dispatch range start (explicit offset)": [
    "Einsatzbeginn (expliziter UTC-Versatz)",
    "Ìbẹ̀rẹ̀ ìṣètò (UTC offset tí a sọ)",
    "Dispatch range start (enter UTC offset)",
  ],
  "Dispatch range end (explicit offset)": [
    "Einsatzende (expliziter UTC-Versatz)",
    "Ìparí ìṣètò (UTC offset tí a sọ)",
    "Dispatch range end (enter UTC offset)",
  ],
  "Representative local date for rules and tariffs": [
    "Repräsentatives lokales Datum für Regeln und Tarife",
    "Ọjọ́ agbègbè àpẹẹrẹ fún òfin àti tariff",
    "Representative local date for rules and tariffs",
  ],
  "Outage starts (explicit offset)": [
    "Ausfallbeginn (expliziter UTC-Versatz)",
    "Ìbẹ̀rẹ̀ ìdálẹ́kun (UTC offset tí a sọ)",
    "Outage starts (enter UTC offset)",
  ],
  "Outage ends (explicit offset)": [
    "Ausfallende (expliziter UTC-Versatz)",
    "Ìparí ìdálẹ́kun (UTC offset tí a sọ)",
    "Outage ends (enter UTC offset)",
  ],
  "Cancel simulation": [
    "Simulation abbrechen",
    "Fagilé ìṣirò àwòṣe",
    "Cancel simulation",
  ],
  "Deliberately shed energy": [
    "Bewusst abgeworfene Energie",
    "Energy ẹrù tí a mọ̀ọ́mọ̀ yọ",
    "Deliberately shed energy",
  ],
  "Critical unserved energy": [
    "Nicht versorgte kritische Energie",
    "Energy pàtàkì tí a kò pèsè",
    "Critical unserved energy",
  ],
  "Grid charging": ["Netzladung", "Ṣíṣaja láti grid", "Grid charging"],
  "PV + wind generation": [
    "PV- und Winderzeugung",
    "Ìpèsè PV àti afẹ́fẹ́",
    "PV + wind generation",
  ],
  "Gold: supplied generation · Violet: load": [
    "Gold: eingegebene Erzeugung · Violett: Last",
    "Góòlù: ìpèsè tí a tẹ̀ sínú · Àlùkò: ẹrù",
    "Gold: entered generation · Violet: load",
  ],
  "Follow supplied generation": [
    "Eingegebener Erzeugung folgen",
    "Tẹ̀lé ìpèsè tí a tẹ̀ sínú",
    "Follow entered generation",
  ],
  "Charging tariff / calendar date": [
    "Ladetarif / Kalenderdatum",
    "Tariff ṣaja / ọjọ́ kàlẹ́ńdà",
    "Charging tariff / calendar date",
  ],
  "Charging connection": ["Ladeanschluss", "Ìsopọ̀ ṣaja", "Charging connection"],
  "Balanced three phase": [
    "Symmetrisch dreiphasig",
    "Phase mẹ́ta tí ó dọ́gba",
    "Balanced three phase",
  ],
  "Required energy basis": [
    "Basis der erforderlichen Energie",
    "Ìpìlẹ̀ energy tí a nílò",
    "Required energy basis",
  ],
  "Entered battery-delivered energy": [
    "Eingegebene an die Batterie gelieferte Energie",
    "Energy sí battery tí a tẹ̀ sínú",
    "Entered energy delivered to battery",
  ],
  "Usable capacity and SOC change": [
    "Nutzbare Kapazität und SOC-Änderung",
    "Capacity tó ṣeé lò àti ìyípadà SOC",
    "Usable capacity and SOC change",
  ],
  "Usable vehicle battery capacity": [
    "Nutzbare Fahrzeugbatteriekapazität",
    "Capacity battery ọkọ̀ tó ṣeé lò",
    "Usable vehicle battery capacity",
  ],
  "Arrival SOC": ["Ankunfts-SOC", "SOC nígbà dídé", "Arrival SOC"],
  "Departure target SOC": [
    "Ziel-SOC bei Abfahrt",
    "SOC tí a fẹ́ nígbà lílọ",
    "Departure target SOC",
  ],
  "Minimum charging power": [
    "Mindestladeleistung",
    "Agbára ṣaja tó kéré jù",
    "Minimum charging power",
  ],
  "Tariff dates and weekdays use local calendar time. Overlaps are rejected. Choose an explicit base-rate fallback or require complete band coverage. Overview remains a repeated-day estimate; the calendar bill applies actual aligned or rolling demand windows.":
    [
      "Tarifdaten und Wochentage verwenden lokale Kalenderzeit. Überlappungen werden abgewiesen. Wählen Sie einen expliziten Basistarif oder vollständige Tarifabdeckung. Die Übersicht bleibt eine Schätzung wiederholter Tage; die Kalenderabrechnung nutzt tatsächliche ausgerichtete oder gleitende Leistungsfenster.",
      "Ọjọ́ àti ọjọ́ ọ̀sẹ̀ tariff lo àkókò agbègbè. A kọ ìbòra ara wọn. Yan base rate àfidípò tàbí béèrè kí gbogbo àkókò ní band. Àkótán jẹ́ ìṣirò ọjọ́ tó ń tún wá; owó kàlẹ́ńdà lo demand window aligned tàbí rolling gangan.",
      "Tariff dates and weekdays use local calendar time. Overlaps no dey allowed. Choose explicit base-rate fallback or require full band coverage. Overview stays a repeated-day estimate; calendar billing uses actual aligned or rolling demand windows.",
    ],
  "Active tariff weekdays": [
    "Aktive Tarifwochentage",
    "Ọjọ́ ọ̀sẹ̀ tí tariff wúlò",
    "Active tariff weekdays",
  ],
  "Demand and billing-period rules": [
    "Leistungs- und Abrechnungszeitraumregeln",
    "Òfin demand àti àkókò owó",
    "Demand and billing-period rules",
  ],
  "Demand averaging method": [
    "Methode der Leistungsmittelung",
    "Ọ̀nà àárín demand",
    "Demand averaging method",
  ],
  "Aligned intervals": [
    "Ausgerichtete Intervalle",
    "Àwọn àkókò aligned",
    "Aligned intervals",
  ],
  "Rolling windows": [
    "Gleitende Zeitfenster",
    "Àwọn àkókò rolling",
    "Rolling windows",
  ],
  "Demand window": ["Leistungsfenster", "Àkókò demand", "Demand window"],
  "Rolling step": ["Gleitschritt", "Ìgbésẹ̀ rolling", "Rolling step"],
  "Demand billing period": [
    "Leistungsabrechnungszeitraum",
    "Àkókò owó demand",
    "Demand billing period",
  ],
  "Selected billing period": [
    "Gewählter Abrechnungszeitraum",
    "Àkókò owó tí a yàn",
    "Selected billing period",
  ],
  "Each local calendar month": [
    "Jeder lokale Kalendermonat",
    "Oṣù kàlẹ́ńdà agbègbè kọ̀ọ̀kan",
    "Each local calendar month",
  ],
  "Alignment origin (optional UTC offset)": [
    "Ausrichtungsursprung (optional mit UTC-Versatz)",
    "Ìpìlẹ̀ alignment (UTC offset àṣàyàn)",
    "Alignment origin (optional UTC offset)",
  ],
  "Net bill including export credit": [
    "Nettobetrag einschließlich Einspeisegutschrift",
    "Owó net pẹ̀lú ìdínkù export",
    "Net bill including export credit",
  ],
  "Import, demand and standing charges": [
    "Bezugs-, Leistungs- und Grundpreise",
    "Owó import, demand àti ìdúró",
    "Import, demand and standing charges",
  ],
  "Standing-charge day basis": [
    "Tagesbasis des Grundpreises",
    "Ìpìlẹ̀ ọjọ́ fún owó ìdúró",
    "Standing-charge day basis",
  ],
  "Elapsed 24-hour periods": [
    "Verstrichene 24-Stunden-Zeiträume",
    "Àwọn àkókò wákàtí 24 tó kọjá",
    "Elapsed 24-hour periods",
  ],
  "Each local calendar date touched": [
    "Jedes berührte lokale Kalenderdatum",
    "Ọjọ́ kàlẹ́ńdà agbègbè kọ̀ọ̀kan tí ó wọlé",
    "Each local calendar date touched",
  ],
  "Tariff coverage": [
    "Tarifabdeckung",
    "Bí tariff ṣe bo àkókò",
    "Tariff coverage",
  ],
  "Explicit base-rate fallback": [
    "Expliziter Basistarif als Rückfall",
    "Base rate àfidípò tí a sọ",
    "Explicit base-rate fallback",
  ],
  "Require complete bands": [
    "Vollständige Tarifbandabdeckung verlangen",
    "Béèrè band tó bo gbogbo àkókò",
    "Require complete bands",
  ],
  "Demand-charge time restrictions": [
    "Zeitbeschränkungen des Leistungspreises",
    "Ààlà àkókò owó demand",
    "Demand-charge time restrictions",
  ],
  "Eligible demand start hour (optional)": [
    "Beginn der Leistungsbewertung (optional)",
    "Wákàtí ìbẹ̀rẹ̀ demand tó yẹ (àṣàyàn)",
    "Eligible demand start hour (optional)",
  ],
  "Eligible demand end hour (optional)": [
    "Ende der Leistungsbewertung (optional)",
    "Wákàtí ìparí demand tó yẹ (àṣàyàn)",
    "Eligible demand end hour (optional)",
  ],
  "Eligible demand weekdays": [
    "Wochentage der Leistungsbewertung",
    "Ọjọ́ ọ̀sẹ̀ demand tó yẹ",
    "Eligible demand weekdays",
  ],
  Sunday: ["Sonntag", "Ọjọ́ Àìkú", "Sunday"],
  Monday: ["Montag", "Ọjọ́ Ajé", "Monday"],
  Tuesday: ["Dienstag", "Ọjọ́ Ìṣẹ́gun", "Tuesday"],
  Wednesday: ["Mittwoch", "Ọjọ́rú", "Wednesday"],
  Thursday: ["Donnerstag", "Ọjọ́bọ", "Thursday"],
  Friday: ["Freitag", "Ọjọ́ Ẹtì", "Friday"],
  Saturday: ["Samstag", "Ọjọ́ Àbámẹ́ta", "Saturday"],
};
