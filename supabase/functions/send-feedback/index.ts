// Supabase Edge Function: nimmt Feedback-Nachrichten angemeldeter Nutzer:innen
// entgegen, speichert sie in public.feedback (RLS-geschützt über das
// weitergereichte Nutzer-JWT) und benachrichtigt den Entwickler per E-Mail
// über Resend (https://resend.com).
//
// Benötigte Secrets (einmalig setzen):
//   supabase secrets set RESEND_API_KEY=re_xxx
//   supabase secrets set FEEDBACK_TO_EMAIL=deine@adresse.de
// SUPABASE_URL / SUPABASE_ANON_KEY sind von der Plattform automatisch gesetzt.
//
// Deploy: supabase functions deploy send-feedback

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_MESSAGE_LENGTH = 2000

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonError('Nicht angemeldet.', 401)

    const { message } = await req.json()
    if (typeof message !== 'string' || !message.trim()) {
      return jsonError('Nachricht darf nicht leer sein.', 400)
    }
    const trimmed = message.trim().slice(0, MAX_MESSAGE_LENGTH)

    // Client mit dem JWT der aufrufenden Person, damit auth.uid() in der
    // RLS-Policy von public.feedback korrekt ausgewertet wird.
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return jsonError('Nicht angemeldet.', 401)

    const { error: insertError } = await supabase
      .from('feedback')
      .insert({ user_id: user.id, email: user.email ?? null, message: trimmed })

    if (insertError) return jsonError('Feedback konnte nicht gespeichert werden.', 500)

    // E-Mail-Versand ist ein Bonus, kein hartes Erfolgskriterium — das
    // Feedback ist bereits sicher in der Tabelle, falls Resend gerade nicht
    // erreichbar ist oder ein Secret fehlt.
    await notifyByEmail(user.email ?? 'unbekannt', trimmed)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Feedback konnte nicht gesendet werden.', 500)
  }
})

async function notifyByEmail(fromEmail: string, message: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const toEmail = Deno.env.get('FEEDBACK_TO_EMAIL')
  if (!apiKey || !toEmail) {
    console.error('Mailversand übersprungen — fehlendes Secret:', { hasApiKey: !!apiKey, hasToEmail: !!toEmail })
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Marlenia Feedback <onboarding@resend.dev>',
        to: [toEmail],
        reply_to: fromEmail,
        subject: 'Neues Feedback in Marlenia',
        text: `Von: ${fromEmail}\n\n${message}`,
      }),
    })
    if (!res.ok) {
      console.error('Resend-Versand fehlgeschlagen:', res.status, await res.text())
    }
  } catch (err) {
    // Best effort — Fehler beim Mailversand sollen die Antwort an die App
    // nicht beeinflussen, das Feedback ist ja schon gespeichert. Aber
    // geloggt wird trotzdem, damit sich das über die Function-Logs im
    // Supabase-Dashboard nachvollziehen lässt.
    console.error('Resend-Versand fehlgeschlagen:', err)
  }
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
