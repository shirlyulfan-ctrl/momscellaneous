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
  .select(`
    id,
    customer_total,
    status,
    provider_id,
    provider:provider_profiles!bookings_provider_id_fkey (
      stripe_account_id
    )
  `)
  .eq("id", booking_id)
  .single();


    if (error || !booking) {
      console.error("Booking load error:", error);
      return { statusCode: 404, body: "Booking not found" };
    }

    if (!booking.customer_total || Number(booking.customer_total) <= 0) {
      return { statusCode: 400, body: "Invalid booking total" };
    }

    // OPTIONAL: require provider connected before checkout
    // If you want customers to still pay before provider connects, remove this check.
    const providerStripeAccountId =
  (booking as any)?.provider?.stripe_account_id ?? null;


    if (!providerStripeAccountId) {
      return {
        statusCode: 400,
        body: "Provider not connected to Stripe yet.",
      };
    }

    const amountCents = Math.round(Number(booking.customer_total) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Momscellaneous Booking",
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.PUBLIC_SITE_URL}/booking-success?booking=${booking.id}`,
      cancel_url: `${process.env.PUBLIC_SITE_URL}/booking-cancel?booking=${booking.id}`,
      metadata: { booking_id: booking.id },
    });

    // Save session id
    const { error: upErr } = await supabase
      .from("bookings")
      .update({
        stripe_checkout_session_id: session.id,
        status: "pending_payment",
      })
      .eq("id", booking.id);

    if (upErr) console.error("Failed to update booking:", upErr);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err: any) {
    console.error("Checkout error:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
