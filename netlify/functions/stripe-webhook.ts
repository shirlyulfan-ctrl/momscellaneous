import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler = async (event: any) => {
  try {
    const sig = event.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    if (!sig || !webhookSecret) return { statusCode: 400, body: "Missing signature/secret" };

    const stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const booking_id = session.metadata?.booking_id;

      if (booking_id) {
        await supabase
          .from("bookings")
          .update({
            status: "paid",
            stripe_payment_intent_id: String(session.payment_intent ?? ""),
          })
          .eq("id", booking_id);
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};
