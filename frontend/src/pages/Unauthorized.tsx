import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <main className="unauthorized-page">
      <h1>Sign-in required</h1>
      <p>Please sign in with Google to view or manage your events.</p>
      <Link to="/home">Return home</Link>
    </main>
  );
}
