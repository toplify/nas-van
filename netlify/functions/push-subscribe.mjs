
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const subscription = await req.json();
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return Response.json({ ok:false, error:"Invalid subscription" }, { status:400 });
    }

    const key = "sub-" + createHash("sha256").update(subscription.endpoint).digest("hex");
    const store = getStore({ name:"push-subscriptions", consistency:"strong" });
    await store.setJSON(key, subscription);

    return Response.json({ ok:true });
  } catch (error) {
    console.error(error);
    return Response.json({ ok:false, error:"Subscription failed" }, { status:500 });
  }
};
