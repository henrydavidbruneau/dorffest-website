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
      // Absätze als Abschnitte, damit einzelne Passagen fett sein können (wie im Design)
      absaetze: [
        [
          { text: 'Letztes Jahr haben wir zum ersten Mal das Dorffest „Königsdorf rückt zusammen“ veranstaltet, um gemeinsam mit vielen Einzelpersonen und Vereinen aus dem Dorf einen wunderbaren Tag voller Freude, Austausch und neuer Begegnungen zu erleben. Das hat uns allen so viel Spaß gemacht, dass schnell klar war: ' },
          { text: 'Das müssen wir wiederholen!', fett: true },
          { text: ' Und nicht nur das, wir wollen noch mehr solcher Veranstaltungen in Königsdorf auf die Beine stellen, bei denen alle herzlich eingeladen sind, sich einzubringen und ihren ganz eigenen Beitrag zu leisten.' },
        ],
        [
          { text: 'Wir glauben fest an die Kraft der Gemeinschaft und sind uns sicher, dass wir zusammen noch viele schöne Momente erleben und selbst in schwierigen Zeiten hier in unserem Ort eine Oase der Zuversicht finden werden. Wir freuen uns darauf ' },
          { text: '– und vor allem freuen wir uns auf euch!', fett: true },
        ],
      ] as { text: string, fett?: boolean }[][],
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

  ueberUns: {
    meta: 'Wer wir sind: Nachbar*innen, die Königsdorf gemeinsam gestalten – mit Festen, Kultur und Begegnung. Offen, solidarisch, demokratisch.',
    zusatz: 'über uns',
    intro: 'Wir möchten in einem Königsdorf leben, in dem Menschen einander kennen, sich zugehörig fühlen und das Leben vor Ort mitgestalten können.',
    absaetze: [
      'Deshalb organisieren wir Feste, Kulturveranstaltungen und gemeinsame Aktionen. Wir schaffen Gelegenheiten, miteinander ins Gespräch zu kommen, etwas auszuprobieren und eigene Ideen einzubringen. Dabei möchten wir auch Menschen erreichen, die bisher wenig Kontakt zum Vereinsleben haben.',
      'Wir knüpfen an das vielfältige Engagement in Königsdorf an und tragen mit unseren Ideen dazu bei. Zusammenarbeit mit anderen Vereinen und Initiativen gehört für uns dazu.',
    ],
    // Leitbild: Abschnitte, hervorgehobene Wörter in Orange
    leitbild: [
      { text: 'Uns verbindet die Überzeugung, dass ein gutes Zusammenleben von ' },
      { text: 'Respekt, Solidarität und Beteiligung', hervor: true },
      { text: ' lebt. Wir stehen für Demokratie und die gleiche Würde aller Menschen. Rassismus und Diskriminierung haben bei uns keinen Platz.' },
    ] as { text: string, hervor?: boolean }[],
    schluss: 'Unser Verein bietet einen Rahmen, um gemeinsam etwas auf die Beine zu stellen: mit Menschen, die Lust auf Königsdorf haben, unterschiedlichen Fähigkeiten und der Freude daran, zusammen etwas zu bewegen.',
    ideen: {
      absaetze: [
        'Du hast Lust, Menschen kennenzulernen und in Königsdorf etwas auf die Beine zu stellen? Bei „Königsdorf rückt zusammen“ gestalten wir gemeinsam Feste, Kulturveranstaltungen und Aktionen, die Menschen zusammenbringen.',
        'Ob du eigene Ideen mitbringst, gerne organisierst oder bei einer Veranstaltung mit anpackst: Du kannst deine Fähigkeiten einbringen und gemeinsam mit anderen Neues ausprobieren.',
        'Uns verbindet der Wunsch nach einem offenen, solidarischen und demokratischen Zusammenleben. Dafür möchten wir Königsdorf gemeinsam gestalten.',
      ],
      aufruf: 'Werde Mitglied und gestalte mit uns, was als Nächstes entsteht.',
      knopf: 'Mehr erfahren',
    },
    ausweis: {
      zusatz: 'Lass uns gemeinsam was bewegen!',
      label: 'Wie heißt du?',
      knopf: 'Antrag starten',
    },
  },

  mitmachen: {
    meta: 'So machst du bei Königsdorf rückt zusammen mit: beim offenen Plenum, beim Dorffest 2027, mit eigenen Ideen – auch ohne Mitgliedschaft.',
    intro: 'Wir sind eine offene Gruppe und organisieren uns vor allem über unser regelmäßiges Plenum. Dort und in unserer Orga-WhatsApp-Gruppe treffen wir alle Entscheidungen gemeinsam.',
    intro2: 'Zum Plenum kann jede*r jederzeit dazukommen und mitwirken – auch ohne Mitgliedschaft. In die Orga-Gruppe kommen Vereinsmitglieder.',
    plenum: {
      text: 'Einmal im Monat besprechen wir Ideen, planen die nächsten Aktionen und verteilen Aufgaben. Meistens online, manchmal vor Ort. Komm einfach dazu!',
      formTitel: 'Erinnere mich!',
      formText: 'Wir schicken dir den Termin und den Link zum Plenum.',
    },
    wege: [
      { titel: 'Zum Plenum kommen', text: 'Einmal im Monat, meistens online. Hier entscheiden wir gemeinsam – sei dabei, auch ohne Mitgliedschaft.', link: '#plenum', linkText: 'Zum Plenum' },
      { titel: 'Beim Dorffest anpacken', text: 'Aufbau, Buffet, Kinderprogramm, Abbau: Für das Dorffest 2027 brauchen wir viele helfende Hände.', link: '#dorffest', linkText: 'Zum Aufruf' },
      { titel: 'Eigene Idee einbringen', text: 'Du hast eine Idee für eine Aktion, einen Workshop oder ein Angebot? Schreib sie uns – wir helfen beim Umsetzen.', link: '#idee', linkText: 'Idee einreichen' },
      { titel: 'Mitglied werden', text: 'Als Mitglied unterstützt du den Verein und kommst in unsere Orga-Gruppe.', link: '/mitglied-werden', linkText: 'Mitglied werden' },
    ],
    dorffest: {
      zusatz: 'am 07.09.2027',
      text: 'Gerade für das nächste Dorffest freuen wir uns über viele helfende Hände. Ideen und Angebote kannst du schon jetzt einbringen – beim letzten Mal ist zum Beispiel der Kleidertausch erst über unseren Mitmach-Aufruf entstanden.',
    },
    idee: {
      titel: 'Deine Idee',
      text: 'Beschreib kurz, was du vorhast oder was du anbieten möchtest. Wir melden uns bei dir.',
    },
    ideenwand: {
      zusatz: 'Ideenwand',
      titel: 'Was fehlt dir in Königsdorf?',
      text: 'Kleine Wünsche, große Träume – pinn sie an die Wand.',
    },
    kontakt: 'Alle anderen Fragen und Anfragen gern an',
  },

  mitgliedWerden: {
    meta: 'Werde Mitglied bei Königsdorf rückt zusammen e.V. – als Fördermitglied oder reguläres Mitglied.',
    intro: 'Mit deiner Mitgliedschaft machst du möglich, was wir im Dorf auf die Beine stellen. Mitmachen kannst du übrigens auch ohne Mitgliedschaft – beim offenen Plenum ist jede*r willkommen.',
    foerder: {
      titel: 'Fördermitglied',
      text: 'Du unterstützt den Verein finanziell – dein Beitrag ist steuerlich absetzbar.',
    },
    regulaer: {
      titel: 'Reguläres Mitglied',
      text: 'Du hast Stimmrecht bei den offiziellen Vereinssitzungen. Das meiste entscheiden wir aber ohnehin gemeinsam im offenen Plenum.',
      voraussetzung: 'Voraussetzung: Du warst mindestens einmal bei einem Plenum dabei.',
    },
  },

  dorfanzeiger: {
    beschreibung: 'Der Königsdorfer Dorfanzeiger: Rückblicke, Ideen und Gedanken zum Zusammenleben im Dorf – von Nachbar*innen für Nachbar*innen.',
    newsletterText: 'Neue Termine, Aktionen und Gesucht-Zettel kommen direkt zu dir – per Infochannel oder E-Mail.',
    newsletterLabel: 'Schick mir die Neuigkeiten an:',
  },

  fuss: {
    gruss: '– eure Nachbar*innen von Rückt Zusammen',
    newsletterLabel: 'Bleib auf dem Laufenden:',
  },
} as const
