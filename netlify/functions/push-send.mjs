
import { getStore } from "@netlify/blobs";
import webpush from "web-push";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { text, secret } = await req.json();

    if (!process.env.PUSH_ADMIN_SECRET || secret !== process.env.PUSH_ADMIN_SECRET) {
      return Response.json({ ok:false, error:"Neplatný push klíč." }, { status:401 });
    }
    if (!text?.trim()) {
      return Response.json({ ok:false, error:"Chybí text upozornění." }, { status:400 });
    }

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      return Response.json({ ok:false, error:"Na Netlify chybí VAPID klíče." }, { status:500 });
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:0km@example.com",
      publicKey,
      privateKey
    );

    const store = getStore({ name:"push-subscriptions", consistency:"strong" });
    const { blobs } = await store.list();
    if (!blobs.length) {
      return Response.json({ ok:false, error:"Tínka zatím nepovolila upozornění na žádném zařízení." }, { status:409 });
    }

    const payload = JSON.stringify({
      title:"0 KM 🚐",
      body:text.trim(),
      url:"https://nas-van.netlify.app/"
    });

    let sent=0, failed=0;
    for (const entry of blobs) {
      try {
        const subscription = await store.get(entry.key, { type:"json", consistency:"strong" });
        if (!subscription) continue;
        await webpush.sendNotification(subscription, payload, { TTL: 60 * 60 });
        sent++;
      } catch (error) {
        failed++;
        console.error("Push failed", entry.key, error?.statusCode || error?.message || error);
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          try { await store.delete(entry.key); } catch {}
        }
      }
    }

    return Response.json({ ok: sent > 0, sent, failed, error: sent ? undefined : "Upozornění se nepodařilo doručit." });
  } catch (error) {
    console.error(error);
    return Response.json({ ok:false, error:"Odeslání selhalo." }, { status:500 });
  }
};
