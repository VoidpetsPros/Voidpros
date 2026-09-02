import React from "react";
import { Link } from "react-router-dom";
import { PANEL, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <p style={{ fontFamily: "Georgia, serif", fontSize: 17, color: CREAM, margin: "0 0 10px" }}>{title}</p>
    <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.7 }}>{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 640, margin: "0 auto" }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 26, color: CREAM, margin: "0 0 6px" }}>Privacy Policy</p>
      <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 32px" }}>Last updated: [DATE]</p>

      <Section title="1. Who we are">
        <p>
          voidpros ("we," "us," "our") is an independent, fan-made companion website for the mobile
          game Voidpet Dungeon. We are not affiliated with, endorsed by, or sponsored by the
          developers or publishers of Voidpet Dungeon. All trademarks and game content referenced
          on this site belong to their respective owners.
        </p>
      </Section>

      <Section title="2. Information we collect">
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>Account information:</strong> email address, username, and password (handled securely by our authentication provider; we never see or store your raw password).</p>
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>Gameplay data you enter:</strong> which pets and items you tell us you own, used only to match you with relevant builds.</p>
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>User-generated content:</strong> build submissions, screenshots you upload, comments, and votes.</p>
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>Payment information:</strong> if you subscribe, payments are processed entirely by Stripe. We never receive or store your card number — only a confirmation that you're subscribed.</p>
        <p><strong style={{ color: CREAM }}>Basic usage data:</strong> standard technical logs (e.g. timestamps, error logs) needed to keep the service running.</p>
      </Section>

      <Section title="3. How we use your information">
        <p>
          We use your information to operate the service — matching you to builds, processing
          submissions, running the subscription, moderating content, and communicating with you
          about your account. We do not sell your personal information to anyone.
        </p>
      </Section>

      <Section title="4. Third-party services we rely on">
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>Supabase</strong> — hosts our database, authentication, and file storage.</p>
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>Stripe</strong> — processes all subscription payments.</p>
        <p><strong style={{ color: CREAM }}>Google</strong> — if you choose to sign in with Google, Google shares your name, email, and profile picture with us for that purpose.</p>
      </Section>

      <Section title="5. Data retention & deletion">
        <p>
          We keep your account information for as long as your account exists. If you'd like your
          account and associated data deleted, contact us at [SUPPORT EMAIL] and we'll process
          your request within a reasonable time, except where we're required to retain certain
          records (e.g. for tax or fraud-prevention purposes).
        </p>
      </Section>

      <Section title="6. Your rights">
        <p>
          Depending on where you live, you may have rights to access, correct, or delete your
          personal information, or to object to certain uses of it. Contact us at
          [SUPPORT EMAIL] to exercise these rights.
        </p>
      </Section>

      <Section title="7. Children's privacy">
        <p>
          This service is not directed at children under 13, and we do not knowingly collect
          personal information from children under 13. If you believe a child has provided us
          with personal information, please contact us and we will delete it.
        </p>
      </Section>

      <Section title="8. Security">
        <p>
          We use reasonable technical measures (encrypted connections, access controls, and
          database-level security rules) to protect your information. No online service can
          guarantee absolute security, but we take reasonable steps to protect your data.
        </p>
      </Section>

      <Section title="9. Changes to this policy">
        <p>
          We may update this policy from time to time. If we make material changes, we'll update
          the date at the top of this page.
        </p>
      </Section>

      <Section title="10. Contact us">
        <p>Questions about this policy? Reach us at [SUPPORT EMAIL].</p>
      </Section>

      <p style={{ fontSize: 12.5, color: MUTED, marginTop: 40 }}>
        See also our <Link to="/terms" style={{ color: GOLD }}>Terms of Service</Link>.
      </p>
    </div>
  );
}
