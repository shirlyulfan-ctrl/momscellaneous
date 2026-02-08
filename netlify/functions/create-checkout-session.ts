import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler = async (event: any) => {
  try {
    const { booking_id } = JSON.parse(event.body || "{}");

    if (!booking_id) {
      return {
        statusCode: 400,
        body: "Missing booking_id",
      };
    }

    // 1) Load booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        customer_total,
        provider_id,
        provider_profiles (
          stripe_account_id
        )
      `
      )
      .eq("id", booking_id)
      .single();

    if (error || !booking) {
      console.error(error);
      return { statusCode: 404, body: "Booking not found" };
    }

    const amountCents = Math.round(Number(booking.customer_total) * 100);

    if (!amountCents || amountCents <= 0) {
      return { statusCode: 400, body: "Invalid booking amount" };
    }

    // 2) Create Stripe Checkout Session
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
      cancel_url: `${process.env.PUBLIC_SITE_URL}/booking-cancel`,
      metadata: {
        booking_id: booking.id,
      },
    });

    // 3) Save Stripe IDs
    await supabase
      .from("bookings")
      .update({
        stripe_checkout_session_id: session.id,
        status: "pending_payment",
      })
      .eq("id", booking.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Checkout error:", err);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
