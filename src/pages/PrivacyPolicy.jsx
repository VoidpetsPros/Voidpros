import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../hooks/ThemeContext";
import BackButton from "../components/BackButton";

const Section = ({ title, children }) => {
  const { CREAM, MUTED } = useTheme();
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 17, color: CREAM, margin: "0 0 10px" }}>{title}</p>
      <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
};

export default function PrivacyPolicy() {
  const { CREAM, MUTED, GOLD } = useTheme();
  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 640, margin: "0 auto" }}>
      <BackButton />
      <p style={{ fontFamily: "Georgia, serif", fontSize: 26, color: CREAM, margin: "0 0 6px" }}>Privacy Policy</p>
      <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 32px" }}>Last updated: 09/09/2026</p>

      <Section title="1. Who we are">
        <p>
          voidpros ("we," "us," "our") is an independent, fan-made companion website for the mobile
          game Voidpet Dungeon. We are not affiliated with, endorsed by, or sponsored by the
          developers or publishers of Voidpet Dungeon. All trademarks and game content referenced
          on this site belong to their respective owners. This policy explains what information we
          collect through voidpros, how we use it, and the choices you have.
        </p>
      </Section>

      <Section title="2. Scope of this policy">
        <p>
          This policy applies to information collected through voidpros.com and any related
          services we operate. It does not apply to third-party sites or services you may reach
          through links on voidpros, including the developers of the underlying game — we
          encourage you to review the privacy practices of any third-party service you use.
        </p>
      </Section>

      <Section title="3. Information we collect">
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>Account information:</strong> email address, username, and password. Your password is handled entirely by our authentication provider (Supabase) using industry-standard hashing — we never see or store your raw password.</p>
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>Gameplay data you enter:</strong> which pets and items you tell us you own, used to match you with relevant builds and to power the collection features of the site.</p>
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>User-generated content:</strong> build submissions, screenshots you upload, notes, comments, votes, and challenge requests and attempts.</p>
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>Payment information:</strong> if you subscribe, payments are processed entirely by Stripe. We never receive or store your full card number — only a token confirming that you're subscribed, along with limited billing metadata like the last four digits of your card, for support and fraud-prevention purposes.</p>
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>Sign-in data from Google:</strong> if you choose to sign in with Google, Google shares your name, email address, and profile picture with us for the purpose of creating and logging into your account.</p>
        <p style={{ marginBottom: 10 }}><strong style={{ color: CREAM }}>Cookies and local storage:</strong> we use cookies and browser local storage that are strictly necessary to keep you signed in and to remember basic preferences (like light/dark theme). We do not currently use third-party advertising or cross-site tracking cookies.</p>
        <p><strong style={{ color: CREAM }}>Basic usage and technical data:</strong> standard technical logs such as timestamps, error logs, IP address, and browser/device information, used to operate, secure, and troubleshoot the service.</p>
      </Section>

      <Section title="4. How we use your information">
        <p style={{ marginBottom: 10 }}>We use your information to:</p>
        <p style={{ marginBottom: 6 }}>• Create and maintain your account, and authenticate you when you sign in</p>
        <p style={{ marginBottom: 6 }}>• Match you with builds that use pets and items you own, and power search, collection, and requests</p>
        <p style={{ marginBottom: 6 }}>• Process and display your submissions, comments, votes, and leaderboard standing</p>
        <p style={{ marginBottom: 6 }}>• Process subscription payments and send related transactional communications (for example, payment receipts, which are sent by Stripe)</p>
        <p style={{ marginBottom: 6 }}>• Moderate content, investigate suspected abuse, and enforce our Terms of Service</p>
        <p style={{ marginBottom: 6 }}>• Maintain the security, integrity, and reliability of the service, including detecting and preventing fraud on the leaderboard and trial system</p>
        <p>• Communicate with you about your account, such as confirming your email address or responding to a support request</p>
        <p style={{ marginTop: 10 }}>We do not sell your personal information to anyone, and we do not use your data to serve third-party advertising.</p>
      </Section>

      <Section title="5. Legal bases for processing (EEA/UK users)">
        <p>
          If you're located in the European Economic Area or the United Kingdom, we rely on the
          following legal bases to process your information: performance of a contract (to provide
          the service and process subscription payments you request), legitimate interests (to
          secure the service, prevent fraud, and improve the product), and consent (for optional
          features, such as choosing to sign in with Google). You can withdraw consent for any
          consent-based processing at any time by adjusting your account settings or contacting us.
        </p>
      </Section>

      <Section title="6. How we share information">
        <p style={{ marginBottom: 10 }}>We share information only in the following circumstances:</p>
        <p style={{ marginBottom: 6 }}>• <strong style={{ color: CREAM }}>Service providers</strong> who help us operate voidpros — currently Supabase (database, authentication, and file storage), Stripe (payment processing), and, if you choose to sign in that way, Google (authentication).</p>
        <p style={{ marginBottom: 6 }}>• <strong style={{ color: CREAM }}>Legal reasons</strong> — if we believe disclosure is required by law, subpoena, or other legal process, or is necessary to protect the rights, property, or safety of voidpros, our users, or the public.</p>
        <p style={{ marginBottom: 6 }}>• <strong style={{ color: CREAM }}>Business transfers</strong> — if voidpros is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction, subject to this policy or a successor policy.</p>
        <p>We do not sell your personal information, and we do not share it with third parties for their own independent marketing purposes.</p>
      </Section>

      <Section title="7. What's public on voidpros">
        <p style={{ marginBottom: 10 }}>
          voidpros is a public community site by design. Your username, verified submissions,
          leaderboard rank, comments, and votes are visible to other users and, in the case of
          floor search results and leaderboards, to visitors who haven't signed in.
        </p>
        <p>
          Choosing to post a submission anonymously hides your username from other users on public
          pages for that item, but it does not hide it from our administrators, and it does not
          remove that submission from counting toward your leaderboard totals under your account.
          See our Terms of Service for more detail on how anonymous posting works.
        </p>
      </Section>

      <Section title="8. Data retention">
        <p>
          We keep your account information for as long as your account exists. Uploaded
          screenshots and submission data are generally retained as part of the public record of
          verified builds, even if you later delete your account, unless you specifically request
          their removal. Basic technical logs are retained for a limited period for security and
          troubleshooting purposes and are then deleted or anonymized in the ordinary course of
          business.
        </p>
      </Section>

      <Section title="9. International data transfers">
        <p>
          Our service providers may process and store information in the United States or other
          countries outside of where you live. Where required, we rely on appropriate safeguards,
          such as our providers' standard contractual clauses or equivalent mechanisms, to protect
          information transferred internationally.
        </p>
      </Section>

      <Section title="10. Security">
        <p>
          We use reasonable technical measures — encrypted connections, access controls, and
          database-level security rules — to protect your information. No online service can
          guarantee absolute security, and we can't promise that unauthorized access, hacking,
          data loss, or other breaches will never occur, but we take reasonable steps to reduce
          that risk and will notify affected users as required by applicable law if a breach
          occurs.
        </p>
      </Section>

      <Section title="11. Your rights and choices">
        <p style={{ marginBottom: 10 }}>Depending on where you live, you may have the right to:</p>
        <p style={{ marginBottom: 6 }}>• Access the personal information we hold about you</p>
        <p style={{ marginBottom: 6 }}>• Correct inaccurate information (many fields, like your username, can be updated directly in Settings)</p>
        <p style={{ marginBottom: 6 }}>• Request deletion of your account and associated personal information</p>
        <p style={{ marginBottom: 6 }}>• Object to, or request that we restrict, certain uses of your information</p>
        <p style={{ marginBottom: 10 }}>• Request a copy of your information in a portable format</p>
        <p>
          To exercise any of these rights, contact us at voidpetsranking@gmail.com. We'll respond
          within a reasonable time and in accordance with applicable law, though we may need to
          retain certain records where we're legally required to (for example, for tax,
          fraud-prevention, or dispute-resolution purposes).
        </p>
      </Section>

      <Section title="12. California privacy rights">
        <p>
          If you're a California resident, you may have additional rights under the California
          Consumer Privacy Act (CCPA), including the right to know what personal information we
          collect, the right to request deletion, and the right to not be discriminated against
          for exercising these rights. We do not sell personal information as defined by the CCPA.
          You can exercise these rights the same way described in Section 11.
        </p>
      </Section>

      <Section title="13. European and UK privacy rights">
        <p>
          If you're located in the EEA or UK, in addition to the rights listed in Section 11, you
          have the right to lodge a complaint with your local data protection supervisory authority
          if you believe we've processed your information unlawfully.
        </p>
      </Section>

      <Section title="14. Children's privacy">
        <p>
          This service is not directed at children under 13, and we do not knowingly collect
          personal information from children under 13. If you believe a child under 13 has
          provided us with personal information, please contact us at voidpetsranking@gmail.com
          and we will investigate and delete it as appropriate.
        </p>
      </Section>

      <Section title="15. Changes to this policy">
        <p>
          We may update this policy from time to time to reflect changes in our practices or for
          legal reasons. If we make material changes, we'll update the "Last updated" date at the
          top of this page, and in some cases may provide additional notice within the service.
        </p>
      </Section>

      <Section title="16. Contact us">
        <p>Questions about this policy, or want to exercise any of the rights described above? Reach us at voidpetsranking@gmail.com.</p>
      </Section>

      <p style={{ fontSize: 12.5, color: MUTED, marginTop: 40 }}>
        See also our <Link to="/terms" style={{ color: GOLD }}>Terms of Service</Link>.
      </p>
    </div>
  );
}
