import { Link } from 'react-router-dom';
import logo from '../assets/logo.webp';

// Fill in the real details from the MDRRMC office.
const CONTACT = {
  office: 'MDRRMC Office, Municipality of President Carlos P. Garcia',
  phone: '',   // e.g. '0917 000 0000'
  email: '',   // e.g. 'mdrrmc@example.gov.ph'
  hours: 'Open 24 hours for emergencies',
};
const LOCATION = ['President Carlos P. Garcia (Pitogo)', 'Province of Bohol, Philippines'];

const SERVICES = [
  {
    title: 'Incident Reporting',
    text: 'Report a fire, medical emergency, accident or flood with a description, a photo and your GPS location.',
    icon: <path d="M12 3l9 16H3L12 3zM12 10v4M12 17h.01" />,
  },
  {
    title: 'Live Status Tracking',
    text: 'Follow your report from Pending to Verified, Dispatched and Resolved. The status updates automatically.',
    icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  },
  {
    title: 'Responder Dispatch',
    text: 'Barangay officials send the nearest available responder, using GIS-based tracking on the map.',
    icon: <><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  },
  {
    title: 'Notifications',
    text: 'Get updates about your reports so you always know when help is on the way.',
    icon: <><path d="M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7" /><path d="M10 20a2 2 0 004 0" /></>,
  },
];

const STEPS = [
  { n: 1, title: 'You report', text: 'Choose the incident type, add details and share your location.' },
  { n: 2, title: 'Barangay verifies', text: 'A barangay official reviews your report.' },
  { n: 3, title: 'Responder is sent', text: 'The nearest available responder is dispatched to you. Serious cases go to the MDRRMC.' },
  { n: 4, title: 'Resolved', text: 'The responder updates the status until the incident is resolved.' },
];

const css = `
.sv, .sv * { box-sizing: border-box; }
.sv { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --red:#d92d20; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 22px; color: var(--ink); font-family: inherit; }
.sv h1, .sv h2, .sv h3, .sv p { margin: 0; }
.sv a { text-decoration: none; }

.sv-banner { display: flex; align-items: center; gap: 18px; padding: 26px 24px; border-radius: 20px; color: #fff;
  background: radial-gradient(circle at 100% 0%, rgba(245,179,1,.28), transparent 42%), linear-gradient(135deg, var(--blue), var(--navy));
  border-bottom: 4px solid var(--gold); }
.sv-logo { width: 82px; height: 82px; flex-shrink: 0; object-fit: contain; background: #fff; border-radius: 50%; padding: 4px;
  box-shadow: 0 4px 14px rgba(0,0,0,.3), 0 0 0 3px var(--gold); }
.sv-eyebrow { font-size: .75rem; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); font-weight: 700; margin-bottom: 4px !important; }
.sv-banner h1 { font-size: 1.7rem; line-height: 1.2; color: #fff; }
.sv-banner p.sv-sub { color: rgba(255,255,255,.88); margin-top: 4px !important; }

.sv-title { font-size: 1.2rem; margin-bottom: 12px !important; }
.sv-title::after { content: ''; display: block; width: 40px; height: 3px; margin-top: 6px; background: var(--gold); border-radius: 2px; }

.sv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; }
.sv-card { padding: 20px; background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,.06);
  transition: transform .12s, box-shadow .15s, border-color .15s; }
.sv-card:hover { transform: translateY(-2px); border-color: #c7d2f0; box-shadow: 0 8px 22px rgba(15,37,87,.12); }
.sv-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 12px; margin-bottom: 12px; background: #eef2ff; color: var(--blue); }
.sv-card h3 { font-size: 1rem; margin-bottom: 4px !important; color: var(--navy); }
.sv-card p { font-size: .9rem; color: var(--muted); line-height: 1.5; }

.sv-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
.sv-step { padding: 18px; background: #fff; border: 1px solid var(--line); border-radius: 16px; }
.sv-step-n { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; margin-bottom: 10px;
  background: var(--navy); color: var(--gold); font-weight: 800; }
.sv-step h3 { font-size: .98rem; margin-bottom: 2px !important; }
.sv-step p { font-size: .88rem; color: var(--muted); line-height: 1.5; }

.sv-about { padding: 22px; background: #fff; border: 1px solid var(--line); border-left: 5px solid var(--gold); border-radius: 16px; }
.sv-about p { color: #475467; line-height: 1.65; }
.sv-about p + p { margin-top: 10px !important; }
.sv-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.sv-tag { padding: 5px 12px; border-radius: 999px; background: #eef2ff; color: var(--blue); font-size: .8rem; font-weight: 700; }

.sv-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
.sv-info { padding: 20px; background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
.sv-info h3 { font-size: 1rem; color: var(--navy); margin-bottom: 10px !important; }
.sv-info dl { margin: 0; }
.sv-info dl div { padding: 8px 0; border-top: 1px solid #edf0f4; }
.sv-info dl div:first-child { border-top: 0; padding-top: 0; }
.sv-info dt { font-size: .78rem; color: var(--muted); }
.sv-info dd { margin: 2px 0 0; font-size: .92rem; font-weight: 600; }
.sv-info dd.na { color: var(--muted); font-weight: 400; }

.sv-cta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; padding: 22px; border-radius: 16px;
  background: #fef3f2; border: 1px solid #fecdca; }
.sv-cta h3 { font-size: 1.05rem; color: #b42318; }
.sv-cta p { font-size: .88rem; color: #7a271a; margin-top: 2px !important; }
.sv-btn { padding: 13px 24px; border-radius: 12px; color: #fff !important; font-weight: 800; letter-spacing: .03em; text-transform: uppercase;
  background: linear-gradient(135deg, #f04438, var(--red)); box-shadow: 0 6px 16px rgba(217,45,32,.35); transition: transform .12s, box-shadow .15s; }
.sv-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(217,45,32,.42); }
.sv a:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }

@media (max-width: 520px) {
  .sv-banner { flex-direction: column; text-align: center; }
  .sv-banner h1 { font-size: 1.45rem; }
  .sv-btn { width: 100%; text-align: center; }
}
@media (prefers-reduced-motion: reduce) { .sv-card, .sv-btn { transition: none; } }
`;

export default function ResidentServices() {
  const contactRows = [
    ['Office', CONTACT.office],
    ['Phone', CONTACT.phone],
    ['Email', CONTACT.email],
    ['Hours', CONTACT.hours],
  ];

  return (
    <div className="sv">
      <style>{css}</style>

      <header className="sv-banner">
        <img src={logo} alt="Seal of the Municipality of President Carlos P. Garcia" className="sv-logo" />
        <div>
          <p className="sv-eyebrow">SmartResQ · Resident Portal</p>
          <h1>Services &amp; About Us</h1>
          <p className="sv-sub">Municipality of President Carlos P. Garcia, Bohol</p>
        </div>
      </header>

      <section>
        <h2 className="sv-title">Our Services</h2>
        <div className="sv-grid">
          {SERVICES.map((s) => (
            <article key={s.title} className="sv-card">
              <div className="sv-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  {s.icon}
                </svg>
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="sv-title">How It Works</h2>
        <div className="sv-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="sv-step">
              <div className="sv-step-n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="sv-title">About SmartResQ</h2>
        <div className="sv-about">
          <p>
            SmartResQ is an Emergency Dispatch and Incident Management System with GIS-based responder
            tracking for the barangays of President Carlos P. Garcia, Bohol. It replaces slow, manual
            reporting by phone call or text message with one place where emergencies are reported,
            verified, dispatched and tracked.
          </p>
          <p>
            The system works together with the Municipal Disaster Risk Reduction and Management Council
            (MDRRMC), so the barangay and the municipality can see ongoing incidents and respond faster.
          </p>
          <div className="sv-tags">
            <span className="sv-tag">Barangay Officials</span>
            <span className="sv-tag">Responders</span>
            <span className="sv-tag">MDRRMC</span>
            <span className="sv-tag">Residents</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="sv-title">Contact &amp; Location</h2>
        <div className="sv-two">
          <div className="sv-info">
            <h3>Contact</h3>
            <dl>
              {contactRows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd className={v ? '' : 'na'}>{v || 'Not available yet'}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="sv-info">
            <h3>Location</h3>
            <dl>
              <div><dt>Municipality</dt><dd>{LOCATION[0]}</dd></div>
              <div><dt>Province</dt><dd>{LOCATION[1]}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="sv-cta">
        <div>
          <h3>In an emergency?</h3>
          <p>Report it now. For a life-threatening emergency, also call 911.</p>
        </div>
        <Link to="/resident/report" className="sv-btn">Report Emergency</Link>
      </section>
    </div>
  );
}