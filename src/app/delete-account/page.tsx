import { HEAD_OFFICE } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Delete your account — Devbhoomi Electrics",
  description: "How to delete your Devbhoomi Electrics account and the data associated with it.",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function DeleteAccount() {
  const mail = `mailto:${HEAD_OFFICE.email}?subject=Account%20deletion%20request`;
  return (
    <main className="mx-auto max-w-3xl space-y-7 px-5 py-10">
      <div className="space-y-2">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Back to Devbhoomi Electrics
        </Link>
        <h1 className="text-3xl font-semibold">Delete your Devbhoomi Electrics account</h1>
        <p className="text-sm text-muted">
          Applies to the Devbhoomi Electrics Android app and website, operated by {HEAD_OFFICE.name}.
        </p>
      </div>

      <Section title="Option 1: Delete it yourself (immediate)">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open the Devbhoomi Electrics app or website and sign in.</li>
          <li>
            Go to <strong className="text-foreground">Account</strong> and tap{" "}
            <strong className="text-foreground">Delete account</strong> (also available under{" "}
            <strong className="text-foreground">Help &amp; support</strong>).
          </li>
          <li>Confirm with your password, or with Google if you signed in with Google.</li>
          <li>Tap <strong className="text-foreground">Delete my account</strong>. Your account and data are deleted right away.</li>
        </ol>
      </Section>

      <Section title="Option 2: Ask us to delete it">
        <p>
          If you can&apos;t sign in or no longer have the app, email{" "}
          <a href={mail} className="text-primary hover:underline">
            {HEAD_OFFICE.email}
          </a>{" "}
          from the email address on your account with the subject &quot;Account deletion request&quot;. We may ask you to confirm you
          own the account. We complete requests within 30 days.
        </p>
      </Section>

      <Section title="What is deleted">
        <ul className="list-disc space-y-1 pl-5">
          <li>Your sign-in account and profile: name, email address, mobile number and city.</li>
          <li>Saved addresses, cart items and wishlist.</li>
          <li>Retail partner applications you submitted.</li>
          <li>Scooters you listed as a seller, including the photos you uploaded.</li>
        </ul>
      </Section>

      <Section title="What may be kept">
        <p>
          Order queries and chat messages you already sent are shared with the seller you contacted and stay in their records. Ask us
          by email and we will remove or anonymise them within 30 days, unless we must keep limited information to meet legal or
          tax obligations. Backups held by our hosting provider (Google Firebase) are overwritten within their standard cycle.
        </p>
      </Section>

      <p className="text-sm text-muted">
        See our{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>{" "}
        for more about how we handle your data.
      </p>
    </main>
  );
}
