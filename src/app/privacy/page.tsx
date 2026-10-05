import { HEAD_OFFICE } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy — Devbhoomi Electrics",
  description: "How the Devbhoomi Electrics app and website collect, use, share, and protect your information.",
};

const EFFECTIVE_DATE = "5 October 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-3xl space-y-7 px-5 py-10">
      <div className="space-y-2">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Back to Devbhoomi Electrics
        </Link>
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-muted">Effective date: {EFFECTIVE_DATE}</p>
      </div>

      <p className="text-[15px] leading-relaxed">
        This Privacy Policy explains how {HEAD_OFFICE.name} (&quot;we&quot;, &quot;us&quot;) collects, uses, shares, and protects
        information when you use the Devbhoomi Electrics Android app and website (together, the &quot;Service&quot;). The Service
        lets you browse electric scooters, save a cart and wishlist, send order queries, chat with sellers, list scooters as a
        seller, and apply to become a retail partner.
      </p>

      <Section title="1. Information we collect">
        <p>
          <strong className="text-foreground">Account information.</strong> When you sign up or sign in, we collect your name,
          email address, and password (handled securely by Firebase Authentication; we never see or store your password). If you
          use Google sign-in, we receive your name, email address, and Google account identifier from Google. You may optionally
          add a mobile number, which also lets you log in with your mobile number.
        </p>
        <p>
          <strong className="text-foreground">Information you provide while using the Service.</strong> This includes:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your selected city, used to show scooters available near you.</li>
          <li>Saved delivery addresses (label, street, city, state, PIN code, phone).</li>
          <li>Cart items and wishlist items.</li>
          <li>Order queries, including the scooters and range options you chose, your note to the seller, and your city.</li>
          <li>Chat messages you send to sellers or buyers about a product or order.</li>
          <li>
            Retail partner applications (name, mobile, email, city, area, shop name, and any details you write about your
            experience).
          </li>
          <li>
            If you list scooters as a seller: product details, prices, stock, photos you upload, and your seller name shown on
            listings.
          </li>
        </ul>
        <p>
          <strong className="text-foreground">Photos.</strong> The app only accesses photos you choose yourself through the system
          photo picker when creating a listing. We do not access your photo library otherwise.
        </p>
        <p>
          <strong className="text-foreground">Technical information.</strong> Our service providers may automatically process
          limited technical data needed to run the Service securely, such as device or browser type, IP address, and app
          integrity signals used to prevent abuse.
        </p>
        <p>
          We do <strong className="text-foreground">not</strong> collect your precise or approximate device location, contacts,
          call logs, SMS, or payment card details. The Service does not process online payments.
        </p>
      </Section>

      <Section title="2. How we use your information">
        <ul className="list-disc space-y-1 pl-5">
          <li>To create and manage your account and let you sign in.</li>
          <li>To show scooters available in your city and keep your cart, wishlist, and addresses in sync across devices.</li>
          <li>To send your order queries and chat messages to the relevant seller and deliver their replies to you.</li>
          <li>To let sellers publish and manage their scooter listings.</li>
          <li>To review retail partner applications and contact applicants.</li>
          <li>To provide customer support, keep the Service secure, and prevent fraud or misuse.</li>
        </ul>
        <p>We do not sell your personal information and we do not use it for advertising.</p>
      </Section>

      <Section title="3. How we share your information">
        <p>
          <strong className="text-foreground">With sellers.</strong> When you send an order query, the seller(s) of the scooters
          in your cart receive your name, email address, mobile number (if added), city, the items you selected, and your note.
          When you chat with a seller, they see your name and messages. Sellers may be Devbhoomi Electrics or independent sellers
          listing on the Service.
        </p>
        <p>
          <strong className="text-foreground">With buyers.</strong> If you are a seller, buyers see your seller name and listing
          details, and the messages you send them.
        </p>
        <p>
          <strong className="text-foreground">With our administrators.</strong> Retail partner applications are visible only to
          Devbhoomi Electrics administrators.
        </p>
        <p>
          <strong className="text-foreground">With service providers.</strong> We use Google Firebase (Firebase Authentication,
          Cloud Firestore, Cloud Storage, and Firebase App Hosting), provided by Google LLC, to host the Service and store data on
          our behalf. Google processes this data under its own terms and privacy policy (
          <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            policies.google.com/privacy
          </a>
          ).
        </p>
        <p>
          <strong className="text-foreground">For legal reasons.</strong> We may disclose information if required by law, or to
          protect the rights, safety, and property of our users, the public, or Devbhoomi Electrics.
        </p>
      </Section>

      <Section title="4. Data security">
        <p>
          All data is sent over encrypted connections (HTTPS/TLS) and stored on Google Cloud infrastructure, which encrypts data
          at rest. Access to your data is restricted by security rules so that, for example, only you can read your cart,
          addresses, and wishlist, and only the buyer and seller in a chat can read its messages. No method of transmission or
          storage is completely secure, but we work to protect your information.
        </p>
      </Section>

      <Section title="5. Data retention and deletion">
        <p>
          We keep your account information and content for as long as your account is active. You can delete saved addresses,
          remove wishlist and cart items, and edit your profile at any time inside the app or website. Sellers can move listings to
          trash and delete them permanently.
        </p>
        <p>
          You can delete your account at any time from <strong className="text-foreground">Account → Delete account</strong> in the
          app or website. This immediately deletes your sign-in account, profile, addresses, cart, wishlist, partner applications,
          and any scooters and photos you listed as a seller. You can also email us at{" "}
          <a href={`mailto:${HEAD_OFFICE.email}?subject=Account%20deletion%20request`} className="text-primary hover:underline">
            {HEAD_OFFICE.email}
          </a>{" "}
          with the subject &quot;Account deletion request&quot; and we will do it within 30 days. Full steps are on our{" "}
          <Link href="/delete-account" className="text-primary hover:underline">
            account deletion page
          </Link>
          .
        </p>
        <p>
          Order queries and chat messages already delivered to sellers stay in their records; on request we will remove or anonymise
          them within 30 days, except limited information we must keep by law.
        </p>
      </Section>

      <Section title="6. Your choices and rights">
        <p>
          You can access and update your profile and addresses in the Account section, choose whether to add a mobile number, and
          stop using the Service at any time. You can request a copy, correction, or deletion of your personal data by contacting us.
          We will respond in accordance with applicable law, including India&apos;s Digital Personal Data Protection Act, 2023.
        </p>
      </Section>

      <Section title="7. Children's privacy">
        <p>
          The Service is intended for users aged 18 and above and is not directed at children. We do not knowingly collect personal
          information from children. If you believe a child has provided us with personal information, please contact us and we will
          delete it.
        </p>
      </Section>

      <Section title="8. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. The updated version will be posted on this page with a new effective
          date. Significant changes will be highlighted in the app or on our website.
        </p>
      </Section>

      <Section title="9. Contact us">
        <p>If you have questions or requests about this Privacy Policy or your data, contact us:</p>
        <address className="not-italic">
          <strong className="text-foreground">{HEAD_OFFICE.name}</strong>
          <br />
          {HEAD_OFFICE.address}
          <br />
          Email:{" "}
          <a href={`mailto:${HEAD_OFFICE.email}`} className="text-primary hover:underline">
            {HEAD_OFFICE.email}
          </a>
          <br />
          Phone:{" "}
          <a href={HEAD_OFFICE.phoneHref} className="text-primary hover:underline">
            {HEAD_OFFICE.phone}
          </a>
          <br />
          <a href={HEAD_OFFICE.mapUrl} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            View on Google Maps
          </a>
        </address>
      </Section>
    </main>
  );
}
