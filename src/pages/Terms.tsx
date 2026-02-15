import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TERMS_VERSION } from "@/lib/legalVersions";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-10 shadow-card">
            <h1 className="text-3xl font-bold text-foreground">Terms & Conditions</h1>
            <p className="text-muted-foreground mt-2">Version: {TERMS_VERSION}</p>

            <div className="prose prose-neutral max-w-none mt-6">
              <h2>Important: Safety & Background Checks</h2>
              <p>
                Momscellaneous is a marketplace that helps connect users and independent service
                providers. Momscellaneous does not conduct background checks, identity checks, or
                screening on providers unless explicitly stated otherwise. Users are strongly advised
                to conduct their own screening, interviews, reference checks, and background checks
                before engaging any provider.
              </p>

              <h2>No Employment Relationship</h2>
              <p>
                Providers are independent third parties and are not employees, agents, or
                representatives of Momscellaneous. Momscellaneous does not supervise, direct, or
                control providers’ services.
              </p>

              <h2>Platform Role; No Liability for Provider Services</h2>
              <p>
                Momscellaneous does not provide childcare, home services, or any professional
                services. Any services are provided solely by third-party providers. To the maximum
                extent permitted by law, Momscellaneous is not responsible for the conduct, acts,
                omissions, or services of providers or users, and disclaims liability for any injury,
                loss, damage, or dispute arising from interactions or services booked through the
                platform.
              </p>

              <h2>User Responsibilities</h2>
              <ul>
                <li>Verify provider identity, qualifications, experience, and references.</li>
                <li>Run background checks if you believe appropriate.</li>
                <li>Use good judgment and appropriate safety measures.</li>
              </ul>

              <h2>Payments, Fees, and Holds</h2>
              <p>
                Payments may be processed via a third-party payment processor. Platform fees may
                apply. Momscellaneous may hold funds until the service time completes and then
                release payout to the provider (less fees), subject to the payment processor’s
                policies and any dispute/chargeback process.
              </p>

              <h2>Disputes</h2>
              <p>
                Disputes between users and providers should be resolved directly. Momscellaneous may
                assist with limited support but does not guarantee outcomes.
              </p>

              <h2>Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Momscellaneous shall not be liable for any
                indirect, incidental, consequential, special, exemplary, or punitive damages, or any
                loss of profits, data, goodwill, or other intangible losses.
              </p>

              <h2>Changes</h2>
              <p>
                We may update these Terms from time to time. When the version changes, you may be
                required to re-accept the updated Terms to continue using features such as booking.
              </p>

              <h2>Contact</h2>
              <p>
                For support, contact Momscellaneous customer service through the site.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
