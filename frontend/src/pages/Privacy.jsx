import React from "react";
import { Link } from "react-router-dom";

function Privacy() {
  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <div className="landing-logo">
          Stream<span>Box</span>
        </div>
        <div className="landing-nav-right">
          <Link to="/login" className="landing-nav-link">Sign In</Link>
          <Link to="/register" className="landing-cta-btn">Get Started</Link>
        </div>
      </nav>

      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: September 2024</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide when you create an account, such as your username,
            email address, age group, and parental control PIN. We also collect usage data such as
            your watch history and list of saved titles to improve your experience.
          </p>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>
            We use your information to: provide and personalise the service, enforce age-group
            filtering and parental controls, process premium payments, send service notifications,
            and improve the catalogue and recommendations.
          </p>
        </section>

        <section>
          <h2>3. Parental Controls &amp; Children's Privacy</h2>
          <p>
            For accounts belonging to children (under 13) and teens (13&ndash;17), a parent or
            guardian sets the age-group filter and a 4-digit PIN required to change it. We are
            committed to protecting children's privacy and only show content appropriate to the
            selected age group. Parental PINs are stored in encrypted form and are never revealed.
          </p>
        </section>

        <section>
          <h2>4. Payments</h2>
          <p>
            Premium purchases are processed through CamPay Mobile Money (MTN &amp; Orange Cameroon).
            Payment reference numbers and transaction status are recorded for accounting and to
            manage your subscription. We do not store your mobile-money PIN.
          </p>
        </section>

        <section>
          <h2>5. Third-Party Content</h2>
          <p>
            StreamBox streams content hosted by third-party services such as YouTube. Your use of
            such content is also subject to the third party's own terms and privacy practices,
            which we do not control.
          </p>
        </section>

        <section>
          <h2>6. Data Sharing</h2>
          <p>
            We do not sell your personal information. We share data only with service providers
            necessary to operate the platform (hosting, payments, content delivery) and where
            required by law.
          </p>
        </section>

        <section>
          <h2>7. Data Security</h2>
          <p>
            We take reasonable technical and organisational measures to protect your information.
            However, no method of transmission over the internet is 100% secure, and we cannot
            guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>8. Your Rights</h2>
          <p>
            Depending on applicable law, you may have the right to access, correct, or delete your
            personal information, and to object to or restrict certain processing. You can update
            profile details in your account settings.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            For privacy questions or requests, contact us through the platform's support channels.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Privacy;
