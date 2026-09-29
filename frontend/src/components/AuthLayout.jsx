import { Link } from 'react-router-dom';
import { Code2, Sparkles, Brain, Zap } from 'lucide-react';
import './auth.css';

function AuthLayout({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <div className="auth-grid-bg" aria-hidden />
        <div className="auth-brand-content">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Code2 size={26} strokeWidth={2.5} />
            </div>
            <span className="auth-logo-text">
              Code<span>Prep</span>
            </span>
          </div>

          <h1 className="auth-headline">Level up your DSA journey</h1>
          <p className="auth-tagline">
            Practice curated problems, run code instantly, and get AI hints tuned for your approach.
          </p>

          <ul className="auth-features">
            <li>
              <Sparkles size={18} />
              Fine-tuned AI tutor on every problem
            </li>
            <li>
              <Brain size={18} />
              Hints & approaches without spoiling solutions
            </li>
            <li>
              <Zap size={18} />
              Monaco editor with run & submit
            </li>
          </ul>

          <pre className="auth-code-snippet" aria-hidden>
            <code>
              <span className="kw">function</span>{' '}
              <span className="fn">solve</span>(nums) {'{'}
              {'\n'}  <span className="kw">return</span>{' '}
              <span className="str">"you got this"</span>;
              {'\n}'}
            </code>
          </pre>
        </div>
      </aside>

      <section className="auth-form-panel">
        <div className="auth-card">
          <h2 className="auth-card-title">{title}</h2>
          <p className="auth-card-subtitle">{subtitle}</p>
          {children}
          <p className="auth-footer">
            {footerText}
            <Link to={footerLink}>{footerLabel}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default AuthLayout;
