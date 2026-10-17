// Längere, im Code gepflegte Texte gesammelt an einer Stelle,
// damit ein späterer Umzug nach Directus trivial ist.
export const texte = {
  meta: {
    beschreibung:
      'Königsdorf rückt zusammen e.V.: Nachbar*innen, die Feste, Treffpunkte und Hilfe im Dorf organisieren. Offen für alle, von uns für uns.',
  },

  start: {
    hero: {
      zusatz: 'Verein für Zusammenhalt',
      text: 'Wir sind Nachbarinnen und Nachbarn, die Feste, Treffpunkte und Hilfe im Dorf organisieren – offen für alle, von uns für uns. Wie möchtest du dabei sein?',
      knopfInfochannel: 'Zum Infochannel',
      knopfWasWirTun: 'Was wir tun',
      hierEntlang: 'hier entlang',
    },
    wasWirTun: {
      zusatz: '& wo du mitmachst',
      punkte: [
        { titel: 'Zusammen feiern', text: 'Dorffeste, Konzerte und Kultur – gemeinsam organisieren und schöne Momente miteinander teilen.' },
        { titel: 'Begegnung ermöglichen', text: 'Beim Kleidertausch, Workshop oder gemeinsamen Essen neue Menschen kennenlernen und ins Gespräch kommen.' },
        { titel: 'Eigene Ideen verwirklichen', text: 'Eine Aktion starten, ein Angebot ausprobieren, ein Projekt auf die Beine stellen – mit Unterstützung aus dem Verein.' },
        { titel: 'Gemeinsam entscheiden', text: 'In offenen Plena Ideen besprechen, Vorhaben entwickeln und die nächsten Schritte gemeinsam festlegen.' },
      ],
      haltung: 'Uns verbindet ein respektvolles, solidarisches und demokratisches Miteinander. Rassismus und Ausgrenzung haben bei uns keinen Platz.',
      knopf: 'Mehr erfahren',
    },
    wasKommt: {
      zusatz: 'Terminkalender',
      absaetze: [
        'Letztes Jahr haben wir zum ersten Mal das Dorffest „Königsdorf rückt zusammen“ veranstaltet, um gemeinsam mit vielen Einzelpersonen und Vereinen aus dem Dorf einen wunderbaren Tag voller Freude, Austausch und neuer Begegnungen zu erleben. Das hat uns allen so viel Spaß gemacht, dass schnell klar war: Das müssen wir wiederholen! Und nicht nur das, wir wollen noch mehr solcher Veranstaltungen in Königsdorf auf die Beine stellen, bei denen alle herzlich eingeladen sind, sich einzubringen und ihren ganz eigenen Beitrag zu leisten.',
        'Wir glauben fest an die Kraft der Gemeinschaft und sind uns sicher, dass wir zusammen noch viele schöne Momente erleben und selbst in schwierigen Zeiten hier in unserem Ort eine Oase der Zuversicht finden werden.',
      ],
      schluss: 'Wir freuen uns darauf – und vor allem freuen wir uns auf euch!',
      newsletterTitel: 'Neue Termine ins Postfach',
      newsletterText: 'Verpass keine unserer Veranstaltungen und meld dich für unser Rundschreiben an! Abmelden geht jederzeit.',
    },
    wasBisherGeschah: {
      text: 'In unserem Dorfanzeiger blicken wir auf vergangene Veranstaltungen zurück und teilen Ideen und Gedanken zum Zusammenleben im Dorf. Ihr möchtet etwas ansprechen, eine Erfahrung teilen oder einen Gedanken einbringen? Wir freuen uns über eure Gastartikel und Leserbriefe!',
      zusatz: 'Neues aus dem',
      titel: 'Königsdorfer Dorfanzeiger',
      link: 'zur ganzen Ausgabe',
    },
    nimmDirEinen: {
      text: 'Bei uns kann jeder und jede einfach mitmachen, auch ohne Vereinsmitgliedschaft. Wir freuen uns auf alle, die Lust haben, mit uns gemeinsam etwas im Dorf auf die Beine zu stellen.',
      zettelZusatz: 'gesucht:',
      zettelTitel: 'Du!',
      zettelText: 'Komm zu einem unserer offenen Treffen und lern uns kennen!',
      abreisser: 'Mitmachen',
    },
    fragen: {
      notiz: 'Schreib uns einfach:',
    },
  },

  fuss: {
    gruss: '– eure Nachbar*innen von Rückt Zusammen',
    newsletterLabel: 'Bleib auf dem Laufenden:',
  },
} as const
