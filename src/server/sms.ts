import "server-only";

export type SmsResult = { status: "SENT" | "LOGGED" | "FAILED"; error?: string };

export interface SmsProvider {
  readonly name: "console" | "twilio" | "fast2sms";
  /** True when the provider actually delivers messages to real phones. */
  readonly isReal: boolean;
  send(toE164: string, body: string): Promise<SmsResult>;
}

/** Development provider: logs to the server console (and the DB notification log). */
const consoleProvider: SmsProvider = {
  name: "console",
  isReal: false,
  async send(to, body) {
    console.info(`\n📱 [SMS -> ${to}] ${body}\n`);
    return { status: "LOGGED" };
  },
};

function twilioProvider(): SmsProvider {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_NUMBER!;
  return {
    name: "twilio",
    isReal: true,
    async send(to, body) {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      });
      if (res.ok) return { status: "SENT" };
      return { status: "FAILED", error: `Twilio ${res.status}: ${(await res.text()).slice(0, 200)}` };
    },
  };
}

function fast2smsProvider(): SmsProvider {
  const apiKey = process.env.FAST2SMS_API_KEY!;
  return {
    name: "fast2sms",
    isReal: true,
    async send(to, body) {
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: { authorization: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ route: "q", message: body, numbers: to.replace(/^\+91/, "") }),
      });
      if (res.ok) return { status: "SENT" };
      return { status: "FAILED", error: `Fast2SMS ${res.status}: ${(await res.text()).slice(0, 200)}` };
    },
  };
}

let cached: SmsProvider | null = null;

/** Picks the provider from SMS_PROVIDER (console | twilio | fast2sms). Defaults to console. */
export function getSmsProvider(): SmsProvider {
  if (cached) return cached;
  switch (process.env.SMS_PROVIDER) {
    case "twilio":
      cached = twilioProvider();
      break;
    case "fast2sms":
      cached = fast2smsProvider();
      break;
    default:
      cached = consoleProvider;
  }
  return cached;
}
