import { Link } from 'react-router-dom';
import ImportPreview from '../components/ImportPreview';
import IcsImportPreview from '../components/IcsImportPreview';
export default function Import() {
  return (
    <main className="import-page">
      <Link to="/events">Back to events</Link>
      <section id="ics-import">
        <IcsImportPreview />
      </section>
      <section id="json-import">
        <ImportPreview />
      </section>
    </main>
  );
}
