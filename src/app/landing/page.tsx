import Link from 'next/link';
import FooterBackground from './footer-background';

export default function LandingPage() {
  return (
    <footer className="footer" aria-label="Footer">
      <FooterBackground />
      <div className="jobs">
        <span className="tag">have a fresh idea?</span>
        <span className="headline job-title">imagination<br />meets craft</span>
        <div className="footer-nav">
          <Link href="/login" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 700 }}>
            Login →
          </Link>
          <span>Made</span>
          <span>Story</span>
          <span>In the lab</span>
        </div>
      </div>
      <div className="contact">
        <span className="tag">say hey</span>
        <div className="headline contact-links">
          <span>let’s team up!</span>
          <span>bring us your idea*</span>
        </div>
        <p className="note">*good things start with one spark. let’s make yours.</p>
        <div className="socials">
          <span aria-label="LinkedIn"><img src="/linkedin.svg" alt="" width="35" height="35" /></span>
          <span aria-label="Instagram"><img src="/instagram.svg" alt="" width="35" height="35" /></span>
          <span aria-label="TikTok"><img src="/tiktok.svg" alt="" width="35" height="35" /></span>
        </div>
      </div>
    </footer>
  );
}
