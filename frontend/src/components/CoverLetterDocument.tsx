type CoverLetterDocumentProps = {
  content: string;
};

const lines = (block: string) => block.split('\n');

export default function CoverLetterDocument({ content }: CoverLetterDocumentProps) {
  const blocks = content.split(/\n\s*\n/);
  const sender = lines(blocks[0] ?? '');
  const recipient = lines(blocks[1] ?? '');
  const date = blocks[2] ?? '';
  const subject = blocks[3] ?? '';
  const salutation = blocks[4] ?? '';
  const body = blocks.slice(5);

  return (
    <article className="cover-letter-document">
      <header className="cover-letter-document__header">
        <address className="cover-letter-document__sender">
          <strong>{sender[0]}</strong>
          {sender.slice(1).map((line) =>
            line.includes('@') ? (
              <a key={line} href={`mailto:${line}`}>
                {line}
              </a>
            ) : (
              <span key={line}>{line}</span>
            ),
          )}
        </address>
      </header>

      <address className="cover-letter-document__recipient">
        {recipient.map((line, index) =>
          index === 0 ? <strong key={line}>{line}</strong> : <span key={line}>{line}</span>,
        )}
      </address>
      <p className="cover-letter-document__date">{date}</p>
      <h1>{subject}</h1>
      <p>{salutation},</p>

      {body.map((block, index) => {
        if (block.startsWith('Website:')) {
          const [websiteLine = '', usernameLine = '', passwordLine = ''] = lines(block);
          const website = websiteLine.replace(/^Website:\s*/, '');
          return (
            <section className="cover-letter-document__access" key={block}>
              <strong>Persönlicher Demo-Zugang</strong>
              <dl>
                <div>
                  <dt>Website</dt>
                  <dd>
                    <a href={website} target="_blank" rel="noreferrer">
                      {website}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Benutzername</dt>
                  <dd>{usernameLine.replace(/^Benutzername:\s*/, '')}</dd>
                </div>
                <div>
                  <dt>Passwort</dt>
                  <dd>{passwordLine.replace(/^Passwort:\s*/, '')}</dd>
                </div>
              </dl>
            </section>
          );
        }
        return (
          <p
            className={index === body.length - 1 ? 'cover-letter-document__signature' : undefined}
            key={block}
          >
            {block}
          </p>
        );
      })}
    </article>
  );
}
