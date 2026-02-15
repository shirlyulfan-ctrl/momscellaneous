import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PROVIDER_AGREEMENT_VERSION } from "@/lib/legalVersions";

export default function ProviderAgreementPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-10 shadow-card">
            <h1 className="text-3xl font-bold text-foreground">Provider Agreement</h1>
            <p className="text-muted-foreground mt-2">Version: {PROVIDER_AGREEMENT_VERSION}</p>

            <div className="prose prose-neutral max-w-none mt-6">
              <h2>Independent Contractor</h2>
              <p>
                Providers are independent contractors and not employees of Momscellaneous. Providers
                control how they perform services, set their availability, and provide services at
                their own risk and responsibility.
              </p>

              <h2>No Background Checks by Platform</h2>
              <p>
                Momscellaneous does not conduct background checks on providers and does not certify
                or endorse providers. Providers agree they are solely responsible for truthfulness
                of profile information and compliance with applicable laws.
              </p>

              <h2>Platform Fees</h2>
              <p>
                Momscellaneous charges a platform fee. Fees may be included in the amount paid by
                the customer. Payouts to providers may be the provider base amount less applicable
                fees and payment processor charges.
              </p>

              <h2>Payout Timing; Holds</h2>
              <p>
                Momscellaneous may hold customer funds until completion of the booked service time,
                then release payout to the provider, subject to dispute/chargeback risk and the
                payment processor’s policies.
              </p>

              <h2>Provider Responsibilities</h2>
              <ul>
                <li>Provide services safely, professionally, and lawfully.</li>
                <li>Maintain appropriate insurance if applicable.</li>
                <li>Communicate clearly with customers.</li>
                <li>Maintain accurate availability and pricing.</li>
              </ul>

              <h2>Limitation of Liability; Indemnity</h2>
              <p>
                Provider agrees to indemnify and hold Momscellaneous harmless from claims arising
                from Provider’s services, conduct, omissions, or violations of law.
              </p>

              <h2>Termination</h2>
              <p>
                Momscellaneous may suspend or terminate provider access for policy violations or
                risk to users/platform, in its discretion.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
