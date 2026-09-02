import React from "react";
import { Link } from "react-router-dom";
import { CREAM, MUTED, GOLD } from "../lib/theme";

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <p style={{ fontFamily: "Georgia, serif", fontSize: 17, color: CREAM, margin: "0 0 10px" }}>{title}</p>
    <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.7 }}>{children}</div>
  </div>
);

export default function TermsOfService() {
  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 640, margin: "0 auto" }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 26, color: CREAM, margin: "0 0 6px" }}>Terms of Service</p>
      <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 32px" }}>Last updated: 09/02/2026</p>

      <Section title="1. Acceptance of these terms">
        <p>
          By creating an account or using voidpros, you agree to these Terms of Service. If you
          don't agree, please don't use the service.
        </p>
      </Section>

      <Section title="2. What voidpros is">
        <p>
          voidpros is an independent, fan-made companion tool for the mobile game Voidpet Dungeon.
          We are not affiliated with, endorsed by, or sponsored by the developers or publishers of
          Voidpet Dungeon. Any trademarks, game names, or game content referenced here belong to
          their respective owners.
        </p>
      </Section>

      <Section title="3. Your account">
        <p>
          You're responsible for keeping your login credentials secure and for anything that
          happens under your account. Please provide accurate information when you sign up.
        </p>
      </Section>

      <Section title="4. Acceptable use">
        <p style={{ marginBottom: 10 }}>You agree not to:</p>
        <p style={{ marginBottom: 6 }}>• Submit fake, fraudulent, or misleading build submissions</p>
        <p style={{ marginBottom: 6 }}>• Upload screenshots that aren't your own gameplay</p>
        <p style={{ marginBottom: 6 }}>• Harass, abuse, or impersonate other users</p>
        <p style={{ marginBottom: 6 }}>• Post hateful, obscene, or illegal content</p>
        <p>• Attempt to manipulate karma, votes, confirmations, or the trial/subscription system through technical exploitation</p>
      </Section>

      <Section title="5. Your content">
        <p>
          You retain ownership of the builds, screenshots, and comments you submit. By submitting
          them, you grant us a license to display, store, and distribute that content within the
          service. You're responsible for making sure you actually have the right to share what
          you upload.
        </p>
      </Section>

      <Section title="6. Subscriptions & payments">
        <p style={{ marginBottom: 10 }}>
          Our paid subscription is billed monthly through Stripe at the price shown at checkout.
          Your subscription renews automatically each month until you cancel.
        </p>
        <p style={{ marginBottom: 10 }}>
          You can cancel anytime through the "Manage billing" option in your account — your
          subscription benefits continue until the end of the current billing period, after which
          it will not renew.
        </p>
        <p>
          We may change subscription pricing with reasonable advance notice. Except where required
          by law, payments are non-refundable for partial billing periods.
        </p>
      </Section>

      <Section title="7. Content moderation">
        <p>
          We review submitted builds before they appear in search. We may reject, remove, or edit
          any content, and may suspend or terminate accounts, at our discretion — particularly for
          fraudulent submissions, abuse, or violations of these terms.
        </p>
      </Section>

      <Section title="8. No affiliation, no guarantees about game accuracy">
        <p>
          Builds and strategies on this site are submitted by other players and reviewed by our
          team, but we can't guarantee they'll work for you, that the game won't change and make
          them outdated, or that any particular strategy is optimal. Use at your own judgment.
        </p>
      </Section>

      <Section title="9. Disclaimer & limitation of liability">
        <p style={{ marginBottom: 10 }}>
          The service is provided "as is" without warranties of any kind. To the fullest extent
          permitted by law, we are not liable for any indirect, incidental, or consequential
          damages arising from your use of the service.
        </p>
        <p>
          Our total liability to you for any claim relating to the service is limited to the
          amount you paid us in the 12 months before the claim arose.
        </p>
      </Section>

      <Section title="10. Termination">
        <p>
          We may suspend or terminate your access to the service at any time for violating these
          terms. You may stop using the service and delete your account at any time.
        </p>
      </Section>

      <Section title="11. Governing law">
        <p>These terms are governed by the laws of Florida/United States Of America, without regard to conflict-of-law principles.</p>
      </Section>

      <Section title="12. Changes to these terms">
        <p>We may update these terms from time to time. Continued use of the service after changes means you accept the updated terms.</p>
      </Section>

      <Section title="13. Contact">
        <p>Questions about these terms? Reach us at voidpetsranking@gmail.com.</p>
      </Section>

      <p style={{ fontSize: 12.5, color: MUTED, marginTop: 40 }}>
        See also our <Link to="/privacy" style={{ color: GOLD }}>Privacy Policy</Link>.
      </p>
    </div>
  );
}
