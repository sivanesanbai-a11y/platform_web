import Link from 'next/link';
import FooterBackground from './footer-background';
import BrandLogo from './brand-logo';
import "./landing.css";

export default function LandingPage() {
  return (
    <footer className="footer" aria-label="Footer">
      <FooterBackground />
      <div className="jobs">
        <span className="tag">NUNES Operations</span>
        <span className="headline job-title">imagination<br />meets craft</span>
        <div className="footer-nav">
          <Link href="/login" style={{ color: '#080909', textDecoration: 'none', fontWeight: 800, background: '#ffffff', padding: '6px 16px', borderRadius: '999px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'inline-block' }}>
            Login →
          </Link>
          <span>Operations</span>
          <span>Instruments</span>
          <span>Workshop</span>
        </div>
      </div>
      <div className="logo" role="img" aria-label="Nunes logo">
        <BrandLogo />
      </div>
      <div className="contact">
        <span className="tag">NUNES Platform</span>
        <div className="headline contact-links">
          <span>Enterprise Portal</span>
          <span>Calibrations &amp; Service</span>
        </div>
        <p className="note">*Precision instrumentation and operational excellence.</p>
        <div className="socials" style={{ marginTop: '1.2vw' }}>
          <span aria-label="LinkedIn"><img src="/linkedin.svg" alt="" width="35" height="35" /></span>
          <span aria-label="Instagram"><img src="/instagram.svg" alt="" width="35" height="35" /></span>
          <span aria-label="TikTok"><img src="/tiktok.svg" alt="" width="35" height="35" /></span>
        </div>
      </div>
    </footer>
  );
}
