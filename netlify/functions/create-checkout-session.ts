// netlify/functions/create-checkout-session.ts
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Body = {
  booking_id: string;
};

const PLATFORM_FEE_RATE = 0.075; // 7.5%

function toCents(amount: number) {
  return Math.round(amount * 100);
}

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body: Body = JSON.parse(event.body || "{}");
    const booking_id = body.booking_id;

    if (!booking_id) return { statusCode: 400, body: "Missing booking_id" };

    // Load booking + provider stripe account
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        customer_total,
        status,
        provider_id,
        provider:provider_profiles!bookings_provider_id_fkey (
          stripe_account_id
        )
      `
      )
      .eq("id", booking_id)
      .single();

    if (error || !booking) {
      console.error("Booking load error:", error);
      return { statusCode: 404, body: "Booking not found" };
    }

    const customerTotal = Number((booking as any).customer_total);
    if (!Number.isFinite(customerTotal) || customerTotal <= 0) {
      return { statusCode: 400, body: "Invalid booking total" };
    }

    const providerStripeAccountId =
      (booking as any)?.provider?.stripe_account_id ?? null;

    if (!providerStripeAccountId) {
      return {
        statusCode: 400,
        body: "Provider not connected to Stripe yet.",
      };
    }

    // NEW: Verify connected account is fully enabled before allowing checkout
    try {
      const acct = await stripe.accounts.retrieve(providerStripeAccountId);
      const chargesEnabled = !!(acct as any).charges_enabled;
      const payoutsEnabled = !!(acct as any).payouts_enabled;

      if (!chargesEnabled || !payoutsEnabled) {
        return {
          statusCode: 400,
          body: "Provider Stripe onboarding not complete yet (charges/payouts not enabled).",
        };
      }
    } catch (e: any) {
      console.error("Stripe account retrieve failed:", e?.message || e);
      return {
        statusCode: 400,
        body: "Could not verify provider Stripe account status.",
      };
    }

    const totalCents = toCents(customerTotal);

    // Platform fee (7.5% of total)
    let platformFeeCents = Math.round(totalCents * PLATFORM_FEE_RATE);

    // Safety guards
    if (!Number.isFinite(platformFeeCents) || platformFeeCents < 0) {
      platformFeeCents = 0;
    }
    // Stripe requires application fee <= amount
    if (platformFeeCents >= totalCents) {
      // keep at least 50 cents for provider payout
      platformFeeCents = Math.max(0, totalCents - 50);
    }

    const providerPayoutCents = totalCents - platformFeeCents;

    // Destination charge: provider gets transfer automatically; platform keeps app fee
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Momscellaneous Booking" },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: providerStripeAccountId,
        },
        metadata: {
          booking_id: booking.id,
          provider_id: String((booking as any).provider_id ?? ""),
          total_cents: String(totalCents),
          platform_fee_cents: String(platformFeeCents),
          provider_payout_cents: String(providerPayoutCents),
        },
      },
      success_url: `${process.env.PUBLIC_SITE_URL}/booking-success?booking=${booking.id}`,
      cancel_url: `${process.env.PUBLIC_SITE_URL}/booking-cancel?booking=${booking.id}`,
      metadata: {
        booking_id: booking.id,
        provider_id: String((booking as any).provider_id ?? ""),
        total_cents: String(totalCents),
        platform_fee_cents: String(platformFeeCents),
        provider_payout_cents: String(providerPayoutCents),
      },
    });

    // Save session id + fee breakdown (optional columns)
    const updatePayload: any = {
      stripe_checkout_session_id: session.id,
      status: "pending_payment",
      // optional bookkeeping fields:
      stripe_total_cents: totalCents,
      stripe_platform_fee_cents: platformFeeCents,
      stripe_provider_payout_cents: providerPayoutCents,
    };

    const { error: upErr } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", booking.id);

    if (upErr) console.error("Failed to update booking:", upErr);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err: any) {
    console.error("Checkout error:", err);
    const msg =
      typeof err?.message === "string" ? err.message : "Internal Server Error";
    return { statusCode: 500, body: msg };
  }
};