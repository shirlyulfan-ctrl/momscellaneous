import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler = async () => {
  try {
    const nowIso = new Date().toISOString();

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        provider_payout,
        stripe_payment_intent_id,
        stripe_transfer_id,
        end_at,
        provider_profiles:provider_id (
          stripe_account_id
        )
      `
      )
      .eq("status", "paid")
      .is("stripe_transfer_id", null)
      .lte("end_at", nowIso)
      .limit(50);

    if (error) {
      console.error(error);
      return { statusCode: 500, body: "Failed to load bookings" };
    }

    for (const b of bookings ?? []) {
      const dest = (b as any)?.provider_profiles?.stripe_account_id;
      if (!dest) continue;

      const amountCents = Math.round(Number(b.provider_payout) * 100);

      // Transfer from your platform balance to connected account
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: "usd",
        destination: dest,
        metadata: { booking_id: b.id },
      });

      await supabase
        .from("bookings")
        .update({
          status: "completed",
          stripe_transfer_id: transfer.id,
        })
        .eq("id", b.id);
    }

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
