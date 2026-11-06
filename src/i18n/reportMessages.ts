export const reportMessages: Record<string, [string, string, string]> = {
  "Not available": ["Nicht verfügbar", "Kò sí", "No dey available"],
  "Installed power": [
    "Installierte Leistung",
    "Agbára tí a fi sílẹ̀",
    "Installed power",
  ],
  "On-state operating demand": [
    "Leistungsbedarf im eingeschalteten Zustand",
    "Ìbéèrè agbára nígbà ìṣiṣẹ́",
    "Demand while loads dey on",
  ],
  "Net apparent power": [
    "Resultierende Scheinleistung",
    "Agbára tí ó hàn ní àpapọ̀",
    "Net apparent power",
  ],
  "Daily energy estimate": [
    "Täglicher Energiebedarf, Schätzung",
    "Àfojúsùn agbára ojoojúmọ́",
    "Estimated daily energy",
  ],
  "Daily energy cost estimate": [
    "Geschätzte tägliche Energiekosten",
    "Àfojúsùn owó agbára ojoojúmọ́",
    "Estimated daily energy cost",
  ],
  "Profile peak": ["Profilspitze", "Oke àtòjọ agbára", "Profile peak"],
  "Phase imbalance": ["Phasenunsymmetrie", "Àìdọ́gba fésì", "Phase imbalance"],
  Source: ["Quelle", "Orísun", "Source"],
  Load: ["Verbraucher", "Ẹrù", "Load"],
  "Board and phase values describe the entered model. Missing cable and device evidence remains unresolved.":
    [
      "Verteiler- und Phasenwerte beschreiben das eingegebene Modell. Fehlende Kabel- und Gerätenachweise bleiben offen.",
      "Iye pánẹ́lì àti fésì sọ nípa àwòṣe tí a tẹ sílẹ̀. Ẹ̀rí okun àti ẹ̀rọ tí kò sí ṣì jẹ́ àìpé.",
      "Board and phase values describe the entered model. Missing cable and device evidence still remain unresolved.",
    ],
  "No circuits have been entered.": [
    "Es wurden keine Stromkreise eingegeben.",
    "A kò tíì tẹ àyíká kankan sílẹ̀.",
    "No circuit don enter yet.",
  ],
  "Design current": ["Auslegungsstrom", "Ìṣàn ìṣètò", "Design current"],
  "Source-to-load route assessment": [
    "Bewertung des Weges von der Quelle zum Verbraucher",
    "Àyẹ̀wò ipa láti orísun dé ẹrù",
    "Source-to-load route assessment",
  ],
  "Nominal-current radial phasor model. A missing upstream segment makes the route total unavailable; it is not treated as zero.":
    [
      "Radiales Zeigermodell mit nominalen Strömen. Ein fehlender vorgelagerter Abschnitt macht den Gesamtweg nicht auswertbar; er wird nicht als null behandelt.",
      "Àwòṣe phasor radial pẹ̀lú ìṣàn ìwọ̀n. Bí apá òkè kò bá sí, àpapọ̀ ipa kò sí; a kò fi òdo rọ́pò rẹ̀.",
      "Radial phasor model uses nominal current. Missing upstream segment means route total no dey available; we no count am as zero.",
    ],
  "Peak real power": [
    "Spitzenwirkleistung",
    "Oke agbára gidi",
    "Peak real power",
  ],
  "Peak apparent power": [
    "Spitzenscheinleistung",
    "Oke agbára tí ó hàn",
    "Peak apparent power",
  ],
  "Evaluated sequence energy": [
    "Energie der ausgewerteten Sequenz",
    "Agbára àtẹ̀lé tí a ṣàyẹ̀wò",
    "Energy for evaluated sequence",
  ],
  "No timestamped start events were entered. Motor-start sequence results are unavailable.":
    [
      "Keine Startvorgänge mit Zeitstempel eingegeben. Ergebnisse einer Motorstartsequenz sind nicht verfügbar.",
      "A kò tẹ ìbẹ̀rẹ̀ pẹ̀lú àkókò sílẹ̀. Èsì àtẹ̀lé ìbẹ̀rẹ̀ mọ́tò kò sí.",
      "No timestamped start events entered. Motor-start sequence results no dey available.",
    ],
  "Starting-event values use entered current multipliers and starting power factors. They do not predict electromagnetic transients or generator voltage/frequency dips.":
    [
      "Startwerte verwenden eingegebene Stromfaktoren und Anlaufleistungsfaktoren. Sie sagen keine elektromagnetischen Transienten oder Spannungs-/Frequenzeinbrüche eines Generators voraus.",
      "Iye ìbẹ̀rẹ̀ lo ìlọ́po ìṣàn àti PF ìbẹ̀rẹ̀ tí a tẹ sílẹ̀. Wọn kò sọ ìyípadà electromagnetic kúkúrú tàbí ìṣubú fọ́ltèjì/ìgbòhùnsáfẹ́fẹ́ jenerétọ̀.",
      "Starting values use entered current multipliers and starting PF. Dem no predict electromagnetic transients or generator voltage/frequency dips.",
    ],
  "Operational carbon factor": [
    "Emissionsfaktor im Betrieb",
    "Ìwọ̀n erogba ní ìṣiṣẹ́",
    "Operational carbon factor",
  ],
  "Daily carbon estimate": [
    "Geschätzte tägliche Emissionen",
    "Àfojúsùn erogba ojoojúmọ́",
    "Daily carbon estimate",
  ],
  "Actual elapsed hours": [
    "Tatsächlich verstrichene Stunden",
    "Wákàtí gidi tí ó kọjá",
    "Actual elapsed hours",
  ],
  "Energy charge": ["Energieentgelt", "Owó agbára", "Energy charge"],
  "Export credit": [
    "Einspeisegutschrift",
    "Owó ẹ̀san agbára ìjáde",
    "Export credit",
  ],
  Total: ["Gesamt", "Àpapọ̀", "Total"],
  "No completed calendar simulation was supplied. Daily values are representative estimates, not a calendar bill.":
    [
      "Keine abgeschlossene Kalendersimulation vorhanden. Tageswerte sind repräsentative Schätzungen und keine kalenderbezogene Abrechnung.",
      "Kò sí ìṣírò kàlẹ́ńdà tí ó parí. Iye ọjọ́ jẹ́ àfojúsùn àpẹẹrẹ, kì í ṣe ìwé owó kàlẹ́ńdà.",
      "No completed calendar simulation supplied. Daily values na representative estimates, no be calendar bill.",
    ],
  "PV performance ratio": [
    "PV-Performance-Ratio",
    "Ìpín ìmúṣẹ PV",
    "PV performance ratio",
  ],
  "Initial / minimum / maximum SOC": [
    "Anfänglicher / minimaler / maximaler SOC",
    "SOC ìbẹ̀rẹ̀ / kékeré jù / púpọ̀ jù",
    "Initial / minimum / maximum SOC",
  ],
  "Charge / discharge power": [
    "Lade- / Entladeleistung",
    "Agbára gbígba / tújáde",
    "Charge / discharge power",
  ],
  "Charge / discharge efficiency": [
    "Lade- / Entladewirkungsgrad",
    "Ìmúṣẹ gbígba / tújáde",
    "Charge / discharge efficiency",
  ],
  "Entered island capability": [
    "Eingegebene Inselbetriebsfähigkeit",
    "Àgbára iṣẹ́ láìsí nẹ́tíwọ́ọ̀kì tí a tẹ sílẹ̀",
    "Entered island capability",
  ],
  Generation: ["Erzeugung", "Ìpèsè agbára", "Generation"],
  Charge: ["Laden", "Gbígba agbára", "Charge"],
  Discharge: ["Entladen", "Títú agbára jáde", "Discharge"],
  "Unserved energy": [
    "Nicht versorgte Energie",
    "Agbára tí a kò pèsè",
    "Unserved energy",
  ],
  "Curtailed energy": [
    "Abgeregelte Energie",
    "Agbára tí a dín kù",
    "Curtailed energy",
  ],
  "Final stored energy": [
    "Gespeicherte Endenergie",
    "Agbára tí ó kù ní ìpamọ́",
    "Final stored energy",
  ],
  "No completed chronological dispatch was supplied. Installed capacity alone does not establish import, export or outage service.":
    [
      "Kein abgeschlossener chronologischer Energieflusslauf vorhanden. Installierte Kapazität allein belegt keinen Bezug, keine Einspeisung und keine Versorgung bei Netzausfall.",
      "Kò sí ètò pínpín agbára àtẹ̀lé àkókò tí ó parí. Ìwọ̀n tí a fi sílẹ̀ nìkan kò fi ìwọlé, ìjáde tàbí ìpèsè nígbà ìṣòro hàn.",
      "No completed chronological dispatch supplied. Installed capacity alone no establish import, export or outage service.",
    ],
  "No completed charging plan was supplied. Entered requirements are not evidence of delivered energy.":
    [
      "Kein abgeschlossener Ladeplan vorhanden. Eingegebene Anforderungen belegen keine gelieferte Energie.",
      "Kò sí ètò gbígba agbára tí ó parí. Ohun tí a béèrè kò jẹ́ ẹ̀rí agbára tí a pèsè.",
      "No completed charging plan supplied. Entered requirements no be evidence of delivered energy.",
    ],
  "No comparison snapshot was supplied. Open or select a saved scenario before exporting a comparison.":
    [
      "Kein Vergleichssnapshot vorhanden. Vor dem Export ein gespeichertes Szenario öffnen oder auswählen.",
      "Kò sí ẹ̀dà ìfiwéra. Ṣí tàbí yan àṣàyàn tí a pamọ́ kí o tó gba ìfiwéra.",
      "No comparison snapshot supplied. Open or select saved scenario before comparison export.",
    ],
  "Differences use the first listed project as the reference. Each scenario retains its own revision and entered assumptions.":
    [
      "Differenzen beziehen sich auf das zuerst aufgeführte Projekt. Jedes Szenario behält seine Revision und Eingabeannahmen.",
      "Ìyàtọ̀ lo iṣẹ́ àkọ́kọ́ bí ìtọ́kasí. Àṣàyàn kọ̀ọ̀kan pa àtúnṣe àti àfojúsùn rẹ̀ mọ́.",
      "Differences use first project as reference. Each scenario keeps its own revision and entered assumptions.",
    ],
  "Entered customer-bill prices are separate from engineering quantities. Review any overridden quantities and source revision before procurement.":
    [
      "Eingegebene Kundenbelegpreise sind von technischen Mengen getrennt. Geänderte Mengen und Quellenrevision vor der Beschaffung prüfen.",
      "Owó ìwé oníbàárà yàtọ̀ sí iye ìmọ̀-ẹ̀rọ. Ṣàyẹ̀wò iye tí a yí àti àtúnṣe orísun kí o tó rà.",
      "Customer-bill prices are separate from engineering quantities. Review changed quantities and source revision before buying.",
    ],
  "Manually entered": [
    "Manuell eingegeben",
    "A tẹ sílẹ̀ pẹ̀lú ọwọ́",
    "Manually entered",
  ],
  File: ["Datei", "Fáìlì", "File"],
  "Saved at": ["Gespeichert am", "Àkókò ìfipamọ́", "Saved at"],
  "No validated saved measurement dataset was supplied.": [
    "Kein validierter gespeicherter Messdatensatz vorhanden.",
    "Kò sí dátà ìwọ̀n tí a ṣàyẹ̀wò tí a sì pamọ́.",
    "No validated saved measurement dataset supplied.",
  ],
  "Observed totals cover supplied intervals only. Missing intervals are not filled with assumed measurements.":
    [
      "Beobachtete Summen umfassen nur gelieferte Intervalle. Fehlende Intervalle werden nicht mit angenommenen Messungen aufgefüllt.",
      "Àpapọ̀ tí a wọn bo àárín àkókò tí a pèsè nìkan. A kò fi ìwọ̀n àfojúsùn kún ibi tí dátà sọnù.",
      "Observed totals cover supplied intervals only. Missing intervals no dey filled with assumed readings.",
    ],
  "Actual calendar intervals": [
    "Tatsächliche Kalenderintervalle",
    "Àárín àkókò kàlẹ́ńdà gidi",
    "Actual calendar intervals",
  ],
  "The PDF shows at most the first 96 intervals; export CSV or the frozen JSON snapshot for the complete series.":
    [
      "Das PDF zeigt höchstens die ersten 96 Intervalle; für die vollständige Reihe CSV oder den eingefrorenen JSON-Snapshot exportieren.",
      "PDF fi ó pọ̀ jù àárín àkókò 96 àkọ́kọ́ hàn; gba CSV tàbí ẹ̀dà JSON tí a dì mú fún àtòjọ pátápátá.",
      "PDF shows at most first96 intervals; export CSV or frozen JSON snapshot for complete series.",
    ],
  "Representative daily profile; not timestamped measurement data. Export the complete machine-readable series alongside this report.":
    [
      "Repräsentatives Tagesprofil, keine Messdaten mit Zeitstempel. Die vollständige maschinenlesbare Reihe zusammen mit dem Bericht exportieren.",
      "Àpẹẹrẹ ọjọ́ kan; kì í ṣe dátà ìwọ̀n pẹ̀lú àkókò. Gba àtòjọ pátápátá tí ẹ̀rọ lè kà pẹ̀lú ìròyìn.",
      "Representative daily profile; no be timestamped measurement data. Export complete machine-readable series with this report.",
    ],
  "No issues were emitted for the entered model; this is not installation certification.":
    [
      "Für das eingegebene Modell wurden keine Probleme ausgegeben; dies ist keine Installationszertifizierung.",
      "Kò sí ìṣòro tí àwòṣe fi hàn; èyí kì í ṣe ìjẹ́rìísí fífi ẹ̀rọ sílẹ̀.",
      "No issues emitted for entered model; this no be installation certification.",
    ],
  "The PDF contains the model's vector topology with a legend and readable overlapping pages when required. Cable quantities use entered lengths, not diagram geometry.":
    [
      "Das PDF enthält die Vektortopologie mit Legende und bei Bedarf lesbaren überlappenden Seiten. Kabelmengen beruhen auf eingegebenen Längen, nicht auf Zeichnungsgeometrie.",
      "PDF ní ìsopọ̀ vector pẹ̀lú àlàyé àti ojú ìwé tó wọ ara wọn tí ó ṣeé kà bí ó bá yẹ. Iye okun lo gígùn tí a tẹ sílẹ̀, kì í ṣe àwòrán.",
      "PDF contains model vector topology, legend and readable overlapping pages when needed. Cable quantities use entered lengths, no be diagram geometry.",
    ],
  "Calculation summary": [
    "Berechnungsübersicht",
    "Àkótán ìṣírò",
    "Calculation summary",
  ],
  "Load schedule": ["Verbraucherliste", "Àtòjọ ẹrù", "Load schedule"],
  "Board and phase summary": [
    "Verteiler- und Phasenübersicht",
    "Àkótán pánẹ́lì àti fésì",
    "Board and phase summary",
  ],
  "Circuit schedule": ["Stromkreisliste", "Àtòjọ àyíká", "Circuit schedule"],
  "Cable, protection and feeder checks": [
    "Kabel-, Schutz- und Zuleitungsprüfungen",
    "Àyẹ̀wò okun, ààbò àti ìpèsè",
    "Cable, protection and feeder checks",
  ],
  "Motor starts and supply capacity": [
    "Motorstarts und Versorgungskapazität",
    "Ìbẹ̀rẹ̀ mọ́tò àti agbára ìpèsè",
    "Motor starts and supply capacity",
  ],
  "Energy, tariffs and carbon": [
    "Energie, Tarife und Emissionen",
    "Agbára, owó àti erogba",
    "Energy, tariffs and carbon",
  ],
  "Renewables and storage evidence": [
    "Nachweise für Erzeugung und Speicher",
    "Ẹ̀rí agbára àtúnṣe àti ìpamọ́",
    "Renewables and storage evidence",
  ],
  "Charging requirements and feasibility": [
    "Ladeanforderungen und Machbarkeit",
    "Ìbéèrè gbígba agbára àti ṣíṣeéṣe",
    "Charging requirements and feasibility",
  ],
  "Scenario comparison": [
    "Szenarienvergleich",
    "Ìfiwéra àṣàyàn",
    "Scenario comparison",
  ],
  "Vector single-line diagram": [
    "Vektor-Einliniendiagramm",
    "Àwòrán ìlà kan vector",
    "Vector single-line diagram",
  ],
  "Measurement provenance": [
    "Herkunft der Messdaten",
    "Orísun ìwọ̀n",
    "Measurement provenance",
  ],
  "Time-series evidence": [
    "Zeitreihennachweise",
    "Ẹ̀rí àtòjọ àkókò",
    "Time-series evidence",
  ],
  "Issues and incomplete checks": [
    "Probleme und unvollständige Prüfungen",
    "Ìṣòro àti àyẹ̀wò tí kò pé",
    "Issues and incomplete checks",
  ],
  "Methods, assumptions and sources": [
    "Methoden, Annahmen und Quellen",
    "Ọ̀nà, àfojúsùn àti orísun",
    "Methods, assumptions and sources",
  ],
  "Design current (A)": [
    "Auslegungsstrom (A)",
    "Ìṣàn ìṣètò (A)",
    "Design current (A)",
  ],
  "On-state current (A)": [
    "Betriebsstrom (A)",
    "Ìṣàn ní ìṣiṣẹ́ (A)",
    "Current while on (A)",
  ],
  "kWh/day": ["kWh/Tag", "kWh/ọjọ́", "kWh/day"],
  "Protection (A)": ["Schutzgerät (A)", "Ẹ̀rọ ààbò (A)", "Protection (A)"],
  "Cable (m)": ["Kabel (m)", "Okun (m)", "Cable (m)"],
  Parent: ["Übergeordnet", "Ẹni òkè", "Parent"],
  "Rating (A)": ["Nennstrom (A)", "Ìwọ̀n ìṣàn (A)", "Rating (A)"],
  "Used / ways": ["Belegt / Plätze", "Tí a lò / ààyè", "Used / ways"],
  "Feeder (m)": ["Zuleitung (m)", "Okun ìpèsè (m)", "Feeder (m)"],
  Check: ["Prüfung", "Àyẹ̀wò", "Check"],
  Assessment: ["Bewertung", "Àyẹ̀wò èsì", "Assessment"],
  "Value / limit": ["Wert / Grenze", "Iye / ààlà", "Value / limit"],
  "Method and evidence": [
    "Methode und Nachweis",
    "Ọ̀nà àti ẹ̀rí",
    "Method and evidence",
  ],
  Endpoint: ["Endpunkt", "Òpin ipa", "Endpoint"],
  "Drop (V)": ["Spannungsfall (V)", "Ìṣubú fọ́ltèjì (V)", "Drop (V)"],
  "Drop (%)": ["Spannungsfall (%)", "Ìṣubú fọ́ltèjì (%)", "Drop (%)"],
  "Receiving (V)": [
    "Empfangsspannung (V)",
    "Fọ́ltèjì tí a gbà (V)",
    "Receiving (V)",
  ],
  "Loss (W)": ["Verlust (W)", "Ìpàdánù (W)", "Loss (W)"],
  "Input mode": ["Eingabeart", "Ọ̀nà ìwọlé", "Input mode"],
  "Starting multiplier": [
    "Anlaufstromfaktor",
    "Ìlọ́po ìbẹ̀rẹ̀",
    "Starting multiplier",
  ],
  "Starting PF / seconds": [
    "Anlauf-PF / Sekunden",
    "PF ìbẹ̀rẹ̀ / ìṣẹ́jú-àáyá",
    "Starting PF / seconds",
  ],
  Timestamp: ["Zeitstempel", "Àmì àkókò", "Timestamp"],
  "Duration (s)": ["Dauer (s)", "Gígùn àkókò (s)", "Duration (s)"],
  "Entered value / estimate": [
    "Eingegebener Wert / Schätzung",
    "Iye tí a tẹ / àfojúsùn",
    "Entered value / estimate",
  ],
  "Calendar result": ["Kalenderergebnis", "Èsì kàlẹ́ńdà", "Calendar result"],
  "Bill component": ["Abrechnungsbestandteil", "Apá ìwé owó", "Bill component"],
  "Demand period": [
    "Leistungszeitraum",
    "Àkókò ìbéèrè agbára",
    "Demand period",
  ],
  "Peak kW": ["Spitze kW", "Oke kW", "Peak kW"],
  "Window start": ["Fensterbeginn", "Ìbẹ̀rẹ̀ àárín àkókò", "Window start"],
  "Window end": ["Fensterende", "Òpin àárín àkókò", "Window end"],
  "Entered value": ["Eingegebener Wert", "Iye tí a tẹ sílẹ̀", "Entered value"],
  Flow: ["Energiefluss", "Ìṣàn agbára", "Flow"],
  Session: ["Ladevorgang", "Ìgbà gbígba agbára", "Session"],
  "Arrival / deadline": [
    "Ankunft / Frist",
    "Ìdé / àkókò ìparí",
    "Arrival / deadline",
  ],
  "Required battery kWh": [
    "Benötigte Batterie-kWh",
    "kWh bátìrì tí a nílò",
    "Required battery kWh",
  ],
  "Charger / vehicle kW": [
    "Ladegerät / Fahrzeug kW",
    "Ẹ̀rọ gbígba / ọkọ̀ kW",
    "Charger / vehicle kW",
  ],
  "Meter kWh": ["Zähler-kWh", "kWh mítà", "Meter kWh"],
  "Delivered kWh": ["Gelieferte kWh", "kWh tí a pèsè", "Delivered kWh"],
  "Unmet kWh": ["Nicht erfüllte kWh", "kWh tí a kò pèsè", "Unmet kWh"],
  Feasibility: ["Machbarkeit", "Ṣíṣeéṣe", "Feasibility"],
  Feasible: ["Machbar", "Ó ṣeé ṣe", "E feasible"],
  Infeasible: ["Nicht machbar", "Kò ṣeé ṣe", "E no feasible"],
  "Project / revision": [
    "Projekt / Revision",
    "Iṣẹ́ / àtúnṣe",
    "Project / revision",
  ],
  "Design kW": ["Auslegungs-kW", "kW ìṣètò", "Design kW"],
  "Daily kWh": ["Tägliche kWh", "kWh ojoojúmọ́", "Daily kWh"],
  "Energy difference": [
    "Energiedifferenz",
    "Ìyàtọ̀ agbára",
    "Energy difference",
  ],
  Item: ["Position", "Ohun èlò", "Item"],
  Unit: ["Einheit", "Ẹyọ", "Unit"],
  "Source IDs": ["Quellen-IDs", "ID orísun", "Source IDs"],
  Evidence: ["Nachweis", "Ẹ̀rí", "Evidence"],
  "Entered priced line": [
    "Eingegebene bepreiste Position",
    "Ìlà owó tí a tẹ sílẹ̀",
    "Entered priced line",
  ],
  "Source revision": ["Quellenrevision", "Àtúnṣe orísun", "Source revision"],
  "Local time": ["Ortszeit", "Àkókò agbègbè", "Local time"],
  "Average kW": ["Mittlere kW", "kW àárín", "Average kW"],
  "Interval kWh": ["Intervall-kWh", "kWh àárín àkókò", "Interval kWh"],
  Hours: ["Stunden", "Wákàtí", "Hours"],
  "Model hour": ["Modellstunde", "Wákàtí àwòṣe", "Model hour"],
  "Severity / assessment": [
    "Schweregrad / Bewertung",
    "Ìpele / àyẹ̀wò",
    "Severity / assessment",
  ],
  Message: ["Meldung", "Ìfiranṣẹ́", "Message"],
  "Entity ID": ["Objekt-ID", "ID ohun", "Entity ID"],
  "Source type": ["Quellenart", "Irú orísun", "Source type"],
  "Reference / date": ["Referenz / Datum", "Ìtọ́kasí / ọjọ́", "Reference / date"],
  "Single-line diagram": [
    "Einliniendiagramm",
    "Àwòrán ìlà kan",
    "Single-line diagram",
  ],
  Tile: ["Kachel", "Apá ojú ìwé", "Tile"],
  "Entered topology; not installation certification": [
    "Eingegebene Topologie; keine Installationszertifizierung",
    "Ìsopọ̀ tí a tẹ sílẹ̀; kì í ṣe ìjẹ́rìísí fífi sílẹ̀",
    "Entered topology; no be installation certification",
  ],
  Note: ["Notiz", "Àkọsílẹ̀", "Note"],
  "Overlapping vector tiles preserve readable labels. Full connection details and notes follow.":
    [
      "Überlappende Vektorseiten erhalten lesbare Beschriftungen. Vollständige Verbindungsdetails und Notizen folgen.",
      "Ojú ìwé vector tí wọ́n wọ ara wọn pa àmì tí ó ṣeé kà mọ́. Àlàyé ìsopọ̀ àti àkọsílẹ̀ pátápátá tẹ̀lé.",
      "Overlapping vector pages keep labels readable. Full connection details and notes follow.",
    ],
  "Diagram legend & source details": [
    "Diagrammlegende und Quellenangaben",
    "Àlàyé àwòrán àti orísun",
    "Diagram legend and source details",
  ],
  "Source → distribution board → circuit → load. Lines represent modeled electrical relationships; they do not measure cable length.":
    [
      "Quelle → Verteiler → Stromkreis → Verbraucher. Linien zeigen modellierte elektrische Beziehungen; sie messen keine Kabellängen.",
      "Orísun → pánẹ́lì → àyíká → ẹrù. Ìlà fi ìsopọ̀ iná àwòṣe hàn; wọn kì í wọn gígùn okun.",
      "Source → board → circuit → load. Lines show modeled electrical links; dem no measure cable length.",
    ],
  piece: ["Stück", "ẹyọ", "piece"],
  source: ["Quelle", "orísun", "source"],
  board: ["Verteiler", "pánẹ́lì", "board"],
  circuit: ["Stromkreis", "àyíká", "circuit"],
  load: ["Verbraucher", "ẹrù", "load"],
  measured: ["gemessen", "tí a wọn", "measured"],
  entered: ["eingegeben", "tí a tẹ sílẹ̀", "entered"],
  simulated: ["simuliert", "tí a ṣírò ní àfarawé", "simulated"],
  assumed: ["angenommen", "àfojúsùn", "assumed"],
  "not-applicable": ["nicht anwendbar", "kò kan èyí", "no apply"],
  nameplate: ["Typenschild", "àwo ìwọ̀n ẹ̀rọ", "nameplate"],
  datasheet: ["Datenblatt", "ìwé dátà ẹ̀rọ", "datasheet"],
  estimate: ["Schätzung", "àfojúsùn", "estimate"],
  user: ["Benutzereingabe", "ìwọlé olùlò", "user input"],
  "Resolve invalid numeric draft fields before calculating the bill.": [
    "Ungültige Zahlenentwürfe vor der Belegberechnung korrigieren.",
    "Ṣàtúnṣe ààyè nọ́ńbà àìtọ́ kí o tó ṣírò ìwé owó.",
    "Correct invalid numeric drafts before calculating bill.",
  ],
  "Review this saved numeric draft before using the amount.": [
    "Diesen gespeicherten Zahlenentwurf vor Verwendung des Betrags prüfen.",
    "Ṣàyẹ̀wò àkọ́kọ́ nọ́ńbà tí a pamọ́ kí o tó lo owó náà.",
    "Review this saved numeric draft before using amount.",
  ],
  "Enter at least one numeric value.": [
    "Mindestens einen Zahlenwert eingeben.",
    "Tẹ ó kéré tán iye nọ́ńbà kan sílẹ̀.",
    "Enter at least one numeric value.",
  ],
  "A numeric list is limited to 4,096 values.": [
    "Eine Zahlenliste ist auf 4.096 Werte begrenzt.",
    "Àtòjọ nọ́ńbà ní ààlà iye 4,096.",
    "Numeric list limited to4,096 values.",
  ],
};
