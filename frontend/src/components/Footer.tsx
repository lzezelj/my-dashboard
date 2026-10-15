import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <Link to="/home">Home</Link>
      <Link to="/privacy">Privacy Policy</Link>
      <Link to="/imprint">Impressum</Link>
    </footer>
  );
}
