export default function Privacy() {
  return (
    <main className="legal-page">
      <article className="legal-document">
        <h1>Privacy Policy</h1>
        <p className="legal-document__updated">Last updated: 26 October 2026</p>
        <p>This policy explains how Calendar Dashboard processes personal data.</p>

        <h2>1. Controller</h2>
        <address>
          Lovro Zezelj
          <br />
          Sprollstraße 10/1
          <br />
          72108 Rottenburg am Neckar, Germany
          <br />
          Email: lovro.zezelj@gmail.com
        </address>

        <h2>2. Data we process</h2>
        <ul>
          <li>
            for Google accounts, the Google account identifier, verified email address and display
            name;
          </li>
          <li>
            for operator-created demo accounts, a demo username, optional company and application
            details (such as company address, salutation, position and job-listing source), and a
            salted, one-way password hash; the plaintext password is not stored;
          </li>
          <li>
            calendar content, including titles, dates, times, descriptions, locations, links,
            categories, repetition information and completion status;
          </li>
          <li>
            when you import ICS data, the original event component and interoperability metadata
            contained in the selected event;
          </li>
          <li>technical request data such as IP address, browser information and timestamps;</li>
          <li>
            your email address, message content and related correspondence when you contact us;
          </li>
          <li>
            an authentication token in the HTTP-only <code>auth_token</code> cookie.
          </li>
        </ul>
        <p>
          JSON and ICS files are processed to preview and save the events you select. The app does
          not request access to your Google Calendar and does not receive your Google password.
          Calendar entries and imported files can contain information about other people or
          sensitive matters. Only enter or import such information when you are entitled to do so.
        </p>

        <h2>3. Purposes and legal bases</h2>
        <ul>
          <li>
            Account creation, authentication and calendar functionality: Article 6(1)(b) GDPR.
          </li>
          <li>
            Providing operator-created demo access to portfolio reviewers: Article 6(1)(f) GDPR,
            based on the legitimate interest in presenting and allowing evaluation of the project.
          </li>
          <li>
            Security, abuse prevention and reliable operation: Article 6(1)(f) GDPR, based on our
            legitimate interest in operating and protecting the service.
          </li>
          <li>
            Responding to messages and support requests: Article 6(1)(b) GDPR where the request
            concerns the service, and otherwise Article 6(1)(f) GDPR based on our legitimate
            interest in responding to correspondence.
          </li>
          <li>Compliance with legal obligations where applicable: Article 6(1)(c) GDPR.</li>
        </ul>
        <p>
          To prevent abuse, the backend temporarily counts requests associated with an IP address
          within a 15-minute period. These in-memory counters expire automatically and are not used
          for advertising or profiling.
        </p>

        <h2>4. Authentication cookie</h2>
        <p>
          The app sets one HTTP-only cookie named <code>auth_token</code>. It is required to keep
          you signed in, expires after 24 hours and is not used for advertising or analytics. As it
          is necessary to provide the requested authenticated service, it is used without consent
          under section 25(2)(2) TDDDG. Google Identity Services may use its own necessary storage
          during sign-in.
        </p>

        <h2>5. Authentication</h2>
        <p>
          Google Identity Services provides sign-in. The Google component is loaded when a sign-in
          button is displayed. Loading or using it may send technical information, including your IP
          address, to Google. After successful sign-in, we receive an ID token and store your Google
          account identifier, verified email address and, when supplied, display name. Google
          processes data under its own responsibility. See the{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            Google Privacy Policy
          </a>
          .
        </p>
        <p>
          The operator may create isolated demo accounts for portfolio reviewers. Reviewers sign in
          using the supplied demo username and password. Passwords are processed only to verify the
          login and are stored solely as salted one-way hashes. Demo accounts and all events created
          in them can be deleted by the operator or by the signed-in reviewer.
        </p>

        <h2>6. Hosting and recipients</h2>
        <ul>
          <li>
            Cloudflare, Inc. delivers and hosts the frontend and may process request and security
            data. See the{' '}
            <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">
              Cloudflare Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="https://www.cloudflare.com/cloudflare-customer-dpa/"
              target="_blank"
              rel="noreferrer"
            >
              Cloudflare DPA
            </a>
            .
          </li>
          <li>
            Hetzner Online GmbH hosts the backend and PostgreSQL database. Hetzner processes
            account, calendar, demo-account/application and technical request data on our behalf
            under a data processing agreement pursuant to Article 28 GDPR.
            The processing location depends on the Hetzner server location selected for this
            service. See the{' '}
            <a
              href="https://www.hetzner.com/legal/privacy-policy/"
              target="_blank"
              rel="noreferrer"
            >
              Hetzner Privacy Policy
            </a>{' '}
            and{' '}
            <a href="https://www.hetzner.com/AV/DPA_en.pdf" target="_blank" rel="noreferrer">
              Hetzner Data Processing Agreement
            </a>
            .
          </li>
          <li>
            Google Ireland Limited/Google LLC provides Google Identity Services and the Gmail
            service used for contact correspondence.
          </li>
        </ul>
        <p>
          Hetzner states that data on non-cloud products is processed and stored within the EU; for
          cloud products, the processing location depends on the selected location. Cloudflare and
          Google may process data internationally under the safeguards described in their privacy
          documentation, including applicable transfer safeguards.
        </p>

        <h2>7. Retention, export and deletion</h2>
        <p>
          Account and calendar data remain in the active database while your account exists.
          Deleting an event removes it from that database. Deleting your account removes the account
          and its calendar data and clears the authentication cookie. You can first export your
          calendar as JSON or ICS.
        </p>
        <p>
          Company and application details associated with a demo account remain until the operator
          deletes that demo account, normally after the relevant application process has ended.
        </p>
        <p>
          Database backups are created for disaster recovery and may retain account and calendar
          data for a limited period after deletion from the active database. Hetzner, Cloudflare and
          Google may also retain operational logs or copies under their respective contracts and
          retention schedules. Their exact deletion delay is not controlled by this app. Information
          may be retained where legally required or needed for legal claims.
        </p>
        <p>
          Contact correspondence is retained only as long as needed to answer and handle the
          request, unless legal retention duties or the establishment, exercise or defence of legal
          claims require longer storage.
        </p>

        <h2>8. Your rights</h2>
        <p>
          Subject to the applicable conditions, Articles 15–21 GDPR provide rights to access,
          rectification, erasure, restriction, portability and objection. Consent can be withdrawn
          for future processing where consent is the legal basis. You may complain to a data
          protection supervisory authority, particularly in the member state of your residence,
          workplace or the alleged infringement.
        </p>

        <h2>9. Required data and automated decisions</h2>
        <p>
          Google identity data is required for a Google account. A demo username and password are
          required to authenticate a demo account. Calendar data is otherwise supplied voluntarily,
          although required form fields must be provided to create an event. We do not use automated
          decision-making or profiling under Article 22 GDPR.
        </p>

        <h2>10. Changes</h2>
        <p>
          This notice will be updated if the app, providers, retention practices or applicable legal
          requirements change.
        </p>
      </article>
    </main>
  );
}
