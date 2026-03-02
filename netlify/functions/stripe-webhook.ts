// netlify/functions/stripe-webhook.ts
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Server-side DB updates require service role
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Netlify may base64-encode the body; Stripe signature verification requires the exact raw payload
function getRawBody(event: any): string {
  if (event.isBase64Encoded) {
    return Buffer.from(event.body || "", "base64").toString("utf8");
  }
  return event.body || "";
}

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const sig =
      event.headers?.["stripe-signature"] ||
      event.headers?.["Stripe-Signature"] ||
      event.headers?.["STRIPE-SIGNATURE"];

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return {
        statusCode: 400,
        body: "Missing stripe-signature/STRIPE_WEBHOOK_SECRET",
      };
    }

    const rawBody = getRawBody(event);

    // Verify signature
    const stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    switch (stripeEvent.type) {
      // Checkout completed: mark booking as paid
      case "checkout.session.completed": {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;

        const booking_id = session.metadata?.booking_id || null;
        if (!booking_id) break;

        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : null;

        // Optional: retrieve PI to grab charge id + amount_received
        let chargeId: string | null = null;
        let amountReceived: number | null = null;

        if (paymentIntentId) {
          try {
            const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
              expand: ["latest_charge"],
            });

            amountReceived =
              typeof pi.amount_received === "number" ? pi.amount_received : null;

            const latestCharge = pi.latest_charge as Stripe.Charge | null;
            if (latestCharge && typeof latestCharge.id === "string") {
              chargeId = latestCharge.id;
            }
          } catch (e) {
            // Not fatal — still mark paid because session completed
            console.error("PI retrieve failed:", e);
          }
        }

        const updatePayload: any = {
          status: "paid",
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId ?? "",
          // Optional columns (remove if you don't have them)
          stripe_charge_id: chargeId,
          stripe_amount_received_cents: amountReceived,
        };

        const { error } = await supabase
          .from("bookings")
          .update(updatePayload)
          .eq("id", booking_id);

        if (error) console.error("Supabase update error (paid):", error);

        break;
      }

      // Checkout expired (customer never completed payment)
      case "checkout.session.expired": {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const booking_id = session.metadata?.booking_id || null;

        if (booking_id) {
          const { error } = await supabase
            .from("bookings")
            .update({ status: "payment_expired", stripe_checkout_session_id: session.id })
            .eq("id", booking_id);

          if (error) console.error("Supabase update error (expired):", error);
        }
        break;
      }

      // Payment failed (rare with Checkout, but safe to handle)
      case "payment_intent.payment_failed": {
        const pi = stripeEvent.data.object as Stripe.PaymentIntent;
        const booking_id = (pi.metadata?.booking_id as string | undefined) || null;

        if (booking_id) {
          const { error } = await supabase
            .from("bookings")
            .update({
              status: "payment_failed",
              stripe_payment_intent_id: pi.id,
            })
            .eq("id", booking_id);

          if (error) console.error("Supabase update error (failed):", error);
        }
        break;
      }

      // Full or partial refund
      case "charge.refunded": {
        const charge = stripeEvent.data.object as Stripe.Charge;
        const booking_id = (charge.metadata?.booking_id as string | undefined) || null;

        if (booking_id) {
          const { error } = await supabase
            .from("bookings")
            .update({
              status: "refunded",
              stripe_charge_id: charge.id,
            })
            .eq("id", booking_id);

          if (error) console.error("Supabase update error (refunded):", error);
        }
        break;
      }

      // Dispute created (chargeback)
      case "charge.dispute.created": {
        const dispute = stripeEvent.data.object as Stripe.Dispute;
        // Dispute metadata is not always present; you may need to look up the charge
        const chargeId =
          typeof dispute.charge === "string" ? dispute.charge : null;

        if (chargeId) {
          try {
            const ch = await stripe.charges.retrieve(chargeId);
            const booking_id = (ch.metadata?.booking_id as string | undefined) || null;

            if (booking_id) {
              const { error } = await supabase
                .from("bookings")
                .update({
                  status: "disputed",
                  stripe_charge_id: ch.id,
                })
                .eq("id", booking_id);

              if (error) console.error("Supabase update error (disputed):", error);
            }
          } catch (e) {
            console.error("Dispute charge lookup failed:", e);
          }
        }
        break;
      }

      default:
        // ignore others
        break;
    }

    return { statusCode: 200, body: "ok" };
  } catch (err: any) {
    console.error("Webhook error:", err?.message || err);
    return { statusCode: 400, body: `Webhook Error: ${err?.message || "Unknown error"}` };
  }
};