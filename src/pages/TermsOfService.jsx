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

export default function TermsOfService() {
  const { CREAM, MUTED, GOLD } = useTheme();
  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 640, margin: "0 auto" }}>
      <BackButton />
      <p style={{ fontFamily: "Georgia, serif", fontSize: 26, color: CREAM, margin: "0 0 6px" }}>Terms of Service</p>
      <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 32px" }}>Last updated: 09/09/2026</p>

      <Section title="1. Acceptance of these terms">
        <p>
          By creating an account or using voidpros, you agree to these Terms of Service and to
          our Privacy Policy, which is incorporated into these terms by reference. If you don't
          agree to all of these terms, don't create an account and don't use the service. If you
          are using voidpros on behalf of someone else or letting someone else use your account,
          you're responsible for making sure they follow these terms too.
        </p>
      </Section>

      <Section title="2. Who can use voidpros">
        <p style={{ marginBottom: 10 }}>
          You must be at least 13 years old to create an account. If you are between 13 and the
          age of legal majority where you live, you confirm that a parent or guardian has reviewed
          and agreed to these terms on your behalf, or that you otherwise have their permission to
          use the service.
        </p>
        <p>
          You also confirm that you have the legal capacity to enter into these terms, that you
          are not barred from using the service under the laws of your country of residence or any
          other applicable jurisdiction, and that you are not on any government sanctions or
          restricted-party list.
        </p>
      </Section>

      <Section title="3. What voidpros is">
        <p>
          voidpros is an independent, fan-made companion tool for the mobile game Voidpet Dungeon.
          We are not affiliated with, endorsed by, sponsored by, or in any way officially connected
          to the developers or publishers of Voidpet Dungeon, or to any of their subsidiaries or
          affiliates. Any trademarks, game names, character names, or game content referenced here
          belong to their respective owners and are used only for identification and commentary
          purposes. The underlying game itself may change at any time in ways outside of our
          control, and we make no representation about how long voidpros will remain useful or
          accurate relative to the current state of that game.
        </p>
      </Section>

      <Section title="4. Your account">
        <p style={{ marginBottom: 10 }}>
          You're responsible for keeping your login credentials secure and for anything that
          happens under your account, whether or not you authorized it, except to the extent
          caused by our own security failure. Please provide accurate information when you sign
          up and keep it up to date. You agree to notify us promptly at voidpetsranking@gmail.com
          if you believe your account has been compromised.
        </p>
        <p style={{ marginBottom: 10 }}>
          Each person may maintain one account. Creating multiple accounts to get around usage
          limits, the free trial, submission review, or the leaderboard system is a violation of
          these terms and may result in some or all of the affected accounts being suspended.
        </p>
        <p>
          You may delete your account at any time from Settings, or by contacting us. Deleting
          your account does not automatically entitle you to a refund of any amount already paid
          — see Section 11 below.
        </p>
      </Section>

      <Section title="5. Acceptable use">
        <p style={{ marginBottom: 10 }}>You agree not to:</p>
        <p style={{ marginBottom: 6 }}>• Submit fake, fraudulent, or misleading build submissions</p>
        <p style={{ marginBottom: 6 }}>• Harass, abuse, threaten, or impersonate other users or our staff</p>
        <p style={{ marginBottom: 6 }}>• Post hateful, obscene, sexually explicit, or illegal content</p>
        <p style={{ marginBottom: 6 }}>• Attempt to manipulate leaderboard rank, votes, confirmations, or the trial/subscription system through technical exploitation, including but not limited to creating duplicate accounts, using automated tools or bots, or exploiting bugs</p>
        <p style={{ marginBottom: 6 }}>• Scrape, crawl, or systematically extract data from the service using automated means without our prior written permission</p>
        <p style={{ marginBottom: 6 }}>• Interfere with or disrupt the service, its servers, or the networks connected to it</p>
        <p style={{ marginBottom: 6 }}>• Attempt to gain unauthorized access to any account, system, or data</p>
        <p style={{ marginBottom: 6 }}>• Reverse engineer, decompile, or attempt to extract the source code of the service, except where applicable law expressly permits it</p>
        <p>• Use the service for any purpose that violates applicable local, state, national, or international law</p>
      </Section>

      <Section title="6. Your content">
        <p style={{ marginBottom: 10 }}>
          You retain ownership of the builds, screenshots, notes, and comments you submit
          ("Your Content"). By submitting Your Content, you grant us a worldwide, non-exclusive,
          royalty-free, sublicensable license to host, store, reproduce, display, adapt, and
          distribute Your Content within the service and in connection with operating and
          promoting the service, including on the public floor-search results, leaderboards, and
          community pages.
        </p>
        <p style={{ marginBottom: 10 }}>
          You're solely responsible for making sure you actually have the right to share what you
          upload, and that it doesn't infringe anyone else's rights or violate any law. We do not
          pre-screen all content before it's posted, but we may review, edit, refuse, or remove
          Your Content at our discretion, particularly where it violates these terms.
        </p>
        <p>
          When you choose to post a submission anonymously, that setting affects how your username
          is displayed to other users on public pages. It does not restrict our administrators
          from seeing the real account behind a submission for moderation, fraud-prevention, or
          leaderboard-integrity purposes, as described in our Privacy Policy.
        </p>
      </Section>

      <Section title="7. Content moderation">
        <p>
          We review submitted builds and challenge attempts before they count as verified. We may
          reject, remove, or edit any content, and may suspend or terminate accounts, at our
          discretion — particularly for fraudulent submissions, abuse, or violations of these
          terms. We're under no obligation to review submissions within any particular timeframe,
          to explain the reason for a rejection, or to reinstate content once removed.
        </p>
      </Section>

      <Section title="8. Leaderboards and rewards">
        <p style={{ marginBottom: 10 }}>
          The Completions and Challenges leaderboards, and any associated reward (currently, a
          free month of the Unlimited plan for the top 3 ranked users in each category each
          month), are a promotional feature that we may modify, pause, or discontinue at any time
          without notice. Being ranked on a leaderboard does not guarantee that a reward will be
          issued, and any reward is granted at our sole discretion.
        </p>
        <p style={{ marginBottom: 10 }}>
          Rewards have no cash value, cannot be exchanged, transferred, or redeemed for cash, and
          are subject to whatever additional conditions we communicate at the time they're
          awarded. If we determine that a ranking was achieved through fraudulent, duplicated, or
          manipulated submissions, or through any violation of Section 5, we may disqualify the
          affected account from that period's rewards, remove the reward if already granted, and
          take any other action available to us under these terms.
        </p>
        <p>
          Submissions posted anonymously still count toward leaderboard rankings and totals, using
          the real account behind them, even though the username shown to other users elsewhere on
          the site may say "Anonymous."
        </p>
      </Section>

      <Section title="9. Subscriptions, billing, and free trials">
        <p style={{ marginBottom: 10 }}>
          Our paid subscription ("Unlimited") is billed on a recurring monthly basis through
          Stripe, our third-party payment processor, at the price displayed at checkout. Your
          subscription renews automatically at the start of each billing period until you cancel,
          and you authorize us (through Stripe) to charge your payment method on file for each
          renewal.
        </p>
        <p style={{ marginBottom: 10 }}>
          If we offer a free trial, a valid payment method is required to start it, and your
          payment method will be charged automatically when the trial ends unless you cancel
          before the trial period is over. It is your responsibility to track when your trial
          ends and to cancel before then if you do not want to be charged; forgetting to cancel is
          not, by itself, grounds for a refund.
        </p>
        <p style={{ marginBottom: 10 }}>
          We may change our subscription pricing or the features included in a plan at any time.
          For existing subscribers, we'll provide reasonable advance notice before a price change
          takes effect on your next renewal; continuing your subscription after that point means
          you accept the new price.
        </p>
        <p>
          You can cancel anytime through the "Manage billing" option in your account. Cancelling
          stops future renewals — it does not, by itself, entitle you to a refund for the current
          or any prior billing period. See Section 11 for our full refund policy.
        </p>
      </Section>

      <Section title="10. Cancellation">
        <p>
          When you cancel, your Unlimited plan benefits continue until the end of the billing
          period you already paid for, after which your account reverts to the Free plan and will
          not be charged again. We do not prorate or refund any unused portion of a billing
          period when you cancel partway through it, except where required by law.
        </p>
      </Section>

      <Section title="11. Refund policy">
        <p style={{ marginBottom: 10 }}>
          <strong style={{ color: CREAM }}>All subscription charges are final.</strong> Because
          Unlimited includes an immediate, ongoing benefit (item visibility, unlimited requests,
          and access to the rest of the paid feature set) from the moment your billing period
          starts, we do not issue refunds for: deciding you no longer want the service, forgetting
          to cancel a free trial before it converted to a paid subscription, dissatisfaction with
          builds, leaderboard results, or any other user-generated content, partial use of a
          billing period after you cancel, or accidental purchases caused by your own actions.
        </p>
        <p style={{ marginBottom: 10 }}>
          We expect the large majority of billing inquiries to fall into one of the categories
          above and to not result in a refund. The limited circumstances in which we will consider
          a refund include:
        </p>
        <p style={{ marginBottom: 6 }}>• A charge you did not authorize — for example, a stolen or compromised payment card — which we've been able to verify with our payment processor</p>
        <p style={{ marginBottom: 6 }}>• A clear, verifiable technical error on our end that resulted in a duplicate or incorrect charge</p>
        <p style={{ marginBottom: 6 }}>• Any situation where a refund is required by the law of your jurisdiction</p>
        <p style={{ marginBottom: 10 }}>
          Refund requests should be sent to voidpetsranking@gmail.com before you file a chargeback
          or dispute with your bank or card issuer, so we have a chance to resolve the issue
          directly. If you file a chargeback for a charge that isn't fraudulent or erroneous without
          contacting us first, we may suspend or terminate your account, and may dispute the
          chargeback with your payment provider using records of your account's usage of the
          service.
        </p>
        <p>
          Approving a refund in one instance does not obligate us to approve a similar request in
          the future, and does not waive any of the rights described in this section.
        </p>
      </Section>

      <Section title="12. No affiliation, no guarantees about game accuracy">
        <p>
          Builds and strategies on this site are submitted by other players and reviewed by our
          team, but we can't guarantee they'll work for you, that the underlying game won't change
          and make them outdated, or that any particular strategy is optimal, safe to use, or free
          of errors. Use any information on the service at your own judgment and at your own risk.
        </p>
      </Section>

      <Section title="13. Our intellectual property">
        <p>
          Aside from Your Content and the underlying game content referenced in Section 3, the
          voidpros name, logo, site design, layout, and underlying software are owned by us or
          our licensors and are protected by copyright, trademark, and other intellectual property
          laws. You may not copy, modify, distribute, sell, or lease any part of the service or
          its software, except as these terms expressly allow.
        </p>
      </Section>

      <Section title="14. Copyright complaints">
        <p>
          If you believe content on voidpros infringes your copyright, contact us at
          voidpetsranking@gmail.com with (a) a description of the copyrighted work you believe was
          infringed, (b) the specific location on voidpros of the material you believe is
          infringing, (c) your contact information, and (d) a statement that you have a good-faith
          belief the use is unauthorized. We will review valid notices and may remove or disable
          access to the material in question.
        </p>
      </Section>

      <Section title="15. Disclaimer of warranties">
        <p>
          The service is provided "as is" and "as available," without warranties of any kind,
          whether express, implied, or statutory, including but not limited to implied warranties
          of merchantability, fitness for a particular purpose, title, and non-infringement. We do
          not warrant that the service will be uninterrupted, secure, error-free, or that any
          defects will be corrected.
        </p>
      </Section>

      <Section title="16. Limitation of liability">
        <p style={{ marginBottom: 10 }}>
          To the fullest extent permitted by law, we and our officers, employees, and contractors
          will not be liable for any indirect, incidental, special, consequential, exemplary, or
          punitive damages, or for any loss of profits, data, goodwill, or other intangible
          losses, arising from or related to your use of, or inability to use, the service — even
          if we've been advised of the possibility of such damages.
        </p>
        <p>
          Our total aggregate liability to you for any claim arising out of or relating to these
          terms or the service is limited to the greater of (a) the amount you paid us in the 12
          months before the claim arose, or (b) fifty US dollars ($50).
        </p>
      </Section>

      <Section title="17. Indemnification">
        <p>
          You agree to defend, indemnify, and hold us harmless from any claims, damages,
          liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of
          or related to your violation of these terms, Your Content, or your use of the service.
        </p>
      </Section>

      <Section title="18. Termination">
        <p style={{ marginBottom: 10 }}>
          We may suspend or terminate your access to the service at any time, with or without
          notice, for violating these terms or for any other reason at our discretion, including
          discontinuing the service entirely. You may stop using the service and delete your
          account at any time.
        </p>
        <p>
          Sections of these terms that by their nature should survive termination — including, at
          minimum, Sections 6, 11, 13, 15, 16, 17, 19, and 20 — will survive.
        </p>
      </Section>

      <Section title="19. Governing law and disputes">
        <p style={{ marginBottom: 10 }}>
          These terms are governed by the laws of the State of Florida, United States of America,
          without regard to its conflict-of-law principles. If a dispute arises, we encourage you
          to contact us first at voidpetsranking@gmail.com so we can try to resolve it informally.
        </p>
        <p>
          Any dispute that can't be resolved informally will be subject to the exclusive
          jurisdiction of the state and federal courts located in Florida, and you consent to
          personal jurisdiction in those courts.
        </p>
      </Section>

      <Section title="20. General provisions">
        <p style={{ marginBottom: 10 }}>
          <strong style={{ color: CREAM }}>Severability.</strong> If any provision of these terms
          is found unenforceable, the remaining provisions will remain in full effect, and the
          unenforceable provision will be replaced with one that most closely reflects its
          original intent.
        </p>
        <p style={{ marginBottom: 10 }}>
          <strong style={{ color: CREAM }}>No waiver.</strong> Our failure to enforce any right or
          provision of these terms is not a waiver of that right or provision.
        </p>
        <p style={{ marginBottom: 10 }}>
          <strong style={{ color: CREAM }}>Assignment.</strong> We may assign or transfer these
          terms, in whole or in part, at our discretion, including in connection with a merger,
          acquisition, or sale of assets. You may not assign these terms without our prior written
          consent.
        </p>
        <p>
          <strong style={{ color: CREAM }}>Entire agreement.</strong> These terms, together with
          our Privacy Policy, make up the entire agreement between you and us regarding the
          service, and supersede any prior agreements on the same subject.
        </p>
      </Section>

      <Section title="21. Changes to these terms">
        <p>
          We may update these terms from time to time. If we make material changes, we'll update
          the "Last updated" date at the top of this page, and in some cases may provide additional
          notice. Continued use of the service after changes take effect means you accept the
          updated terms.
        </p>
      </Section>

      <Section title="22. Contact">
        <p>Questions about these terms? Reach us at voidpetsranking@gmail.com.</p>
      </Section>

      <p style={{ fontSize: 12.5, color: MUTED, marginTop: 40 }}>
        See also our <Link to="/privacy" style={{ color: GOLD }}>Privacy Policy</Link>.
      </p>
    </div>
  );
}
