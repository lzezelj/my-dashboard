import Calendar from '../components/Calendar';
import GoogleLoginButton from '../components/GoogleLoginButton';
import type { AuthUser } from '../services/authentication.api';

type HomeProps = {
  user: AuthUser | null;
  onLogin: (user: AuthUser) => void;
};

export default function Home({ user, onLogin }: HomeProps) {
  if (!user) {
    return (
      <main className="home-landing">
        <section className="home-landing__hero">
          <p className="home-landing__eyebrow">Personal dashboard</p>
          <h1>Keep your plans in one place.</h1>
          <p className="home-landing__copy">
            Organize appointments, birthdays, movies, tasks, and more. See what is coming up, manage
            events, and keep your schedule clear.
          </p>
          <div className="home-landing__login">
            <GoogleLoginButton onLogin={onLogin} />
          </div>
        </section>
        <section className="home-landing__features" aria-label="Dashboard features">
          <article>
            <h2>Plan ahead</h2>
            <p>See upcoming events and your selected day at a glance.</p>
          </article>
          <article>
            <h2>Stay organized</h2>
            <p>Manage every kind of personal event from one dashboard.</p>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="home-dashboard">
      <h1>Welcome back{user.name ? `, ${user.name}` : ''}</h1>
      <Calendar />
    </main>
  );
}
