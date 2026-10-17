import type { DemoAccount } from '../services/authentication.api';

export type CreatedCredentials = { account: DemoAccount; password: string };

export function createGermanCoverLetter(
  credentials: CreatedCredentials,
  applicationUrl: string,
  date = new Date(),
) {
  const { account, password } = credentials;
  const company = account.name || '[Unternehmen]';
  const position = account.applicationPosition || '[Position]';
  const salutation = (account.applicationSalutation || 'Sehr geehrte Damen und Herren').replace(
    /,\s*$/,
    '',
  );
  const sourceSentence = account.applicationSource
    ? `Über ${account.applicationSource} habe ich erfahren, dass Sie Verstärkung als ${position} suchen.`
    : `Mit großem Interesse bewerbe ich mich bei Ihnen als ${position}.`;
  const companyAddress = account.applicationCompanyAddress
    ? `\n${account.applicationCompanyAddress}`
    : '';
  const formattedDate = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);

  return `Lovro Zezelj
Sprollstraße 10/1
72108 Rottenburg am Neckar
0178 2015086
lovro.zezelj@gmail.com

${company}${companyAddress}

Rottenburg am Neckar, ${formattedDate}

Bewerbung als ${position}

${salutation},

${sourceSentence} Als Informatik-Absolvent möchte ich meine technischen Kenntnisse nun gezielt in der Praxis einsetzen und mich als ${position} weiterentwickeln.

Durch mein Studium und eigene Projekte habe ich praktische Erfahrung in der Softwareentwicklung und Fehleranalyse gesammelt. Dabei arbeitete ich unter anderem mit C++, JavaScript, TypeScript, Python, React, Node.js, relationalen Datenbanken und Docker. Besonders liegen mir die strukturierte Analyse technischer Probleme und die Entwicklung zuverlässiger Lösungen.

Ein aktuelles Beispiel ist meine selbst entwickelte Full-Stack-Kalenderanwendung „Calendar Dashboard“ mit React, TypeScript, Node.js, Express und PostgreSQL. Sie unterstützt Google- und Demo-Authentifizierung, wiederkehrende Termine, JSON- und ICS-Importe und -Exporte sowie automatisierte Tests. Auch Absicherung, Datenschutz und die Bereitstellung über Cloudflare und Railway habe ich eigenständig umgesetzt. Dabei vertiefte ich insbesondere meine Kenntnisse in Datenmodellierung, API-Entwicklung, Tests und der Bearbeitung von Randfällen.

Für einen unmittelbaren Einblick in die Anwendung habe ich für Sie einen persönlichen, leeren Demo-Zugang eingerichtet:

Website: ${applicationUrl}
Benutzername: ${account.demoUsername}
Passwort: ${password}

Der Zugang ist ausschließlich für die Prüfung meiner Bewerbung vorgesehen und wird nach Abschluss des Bewerbungsverfahrens gelöscht.

Ich arbeite mich schnell in neue Themen ein, bin zuverlässig und gehe Aufgaben selbstständig und lösungsorientiert an. Gerne möchte ich meine Kenntnisse in Ihr Team einbringen und mich fachlich weiterentwickeln.

Über die Einladung zu einem persönlichen Gespräch freue ich mich sehr.

Mit freundlichen Grüßen

Lovro Zezelj`;
}
