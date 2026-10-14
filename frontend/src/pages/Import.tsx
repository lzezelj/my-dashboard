import { Link } from 'react-router-dom';
import ImportPreview from '../components/ImportPreview';
import IcsImportPreview from '../components/IcsImportPreview';
export default function Import() {
  return (
    <main className="import-page">
      <Link to="/edit">Back to events</Link>
      <IcsImportPreview />
      <ImportPreview />
    </main>
  );
}
