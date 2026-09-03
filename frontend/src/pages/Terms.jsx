import React from "react";
import { Link } from "react-router-dom";

function Terms() {
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
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: September 2024</p>

        <section>
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using StreamBox, you agree to be bound by these Terms of Service
            and our Privacy Policy. If you do not agree to these terms, please do not use the
            service.
          </p>
        </section>

        <section>
          <h2>2. Eligibility &amp; Accounts</h2>
          <p>
            You must be at least 13 years of age to create an account. Accounts for children
            (under 13) and teens (13&ndash;17) must be set up with a parent or guardian, who
            is responsible for setting the age-group content filter and the parental control PIN.
          </p>
          <p>
            You are responsible for keeping your account credentials confidential and for all
            activity under your account. Notify us immediately if you believe your account has
            been compromised.
          </p>
        </section>

        <section>
          <h2>3. Premium Subscription &amp; Payments</h2>
          <p>
            Some titles are marked as Premium and require an active subscription. Premium is a
            recurring monthly subscription billed in XAF (2,000 XAF/month) through CamPay Mobile
            Money (MTN &amp; Orange Cameroon).
          </p>
          <p>
            By confirming a payment you authorise the charge and agree to the applicable pricing.
            Your subscription stays active until it expires; you may renew at any time. Refunds
            are handled on a case-by-case basis in line with applicable law.
          </p>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>
            You agree not to: upload or share unlawful, inappropriate, or harmful content; attempt
            to bypass age-group filtering or parental controls; copy, redistribute, or resell
            StreamBox content; interfere with the service's security or availability; or misuse
            personal data of other users.
          </p>
        </section>

        <section>
          <h2>5. Content &amp; Moderation</h2>
          <p>
            StreamBox sources content from third-party services (including YouTube) and applies
            automated moderation to keep the catalogue family-friendly and age appropriate. We
            may remove or block content at our discretion to comply with the law and our safety
            standards.
          </p>
        </section>

        <section>
          <h2>6. Disclaimer of Warranties</h2>
          <p>
            The service is provided "as is" without warranties of any kind, express or implied.
            We do not guarantee uninterrupted or error-free operation of the service.
          </p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, StreamBox shall not be liable for any indirect,
            incidental, special, or consequential damages arising out of or related to your use of
            the service.
          </p>
        </section>

        <section>
          <h2>8. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will post any changes on this page.
            Continued use of the service after changes constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            Questions about these Terms? Contact us through the platform's support channels.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Terms;
