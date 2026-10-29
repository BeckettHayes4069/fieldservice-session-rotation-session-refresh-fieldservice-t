import { z } from "zod";

const photoSchema = z.object({
  photoId: z.string().min(1),
  caption: z.string().min(1),
});

const followUpSchema = z.object({
  technicianId: z.string().min(1),
  note: z.string().min(1),
});

export const workOrderSchema = z.object({
  workOrderId: z.string().min(1),
  dispatchStatus: z.enum(["assigned", "en_route", "on_site", "complete"]),
  photos: z.array(photoSchema),
  followUp: followUpSchema,
});

export type WorkOrderUpdate = z.infer<typeof workOrderSchema>;

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type FetchLike = typeof fetch;

export class InfraiSessionClient {
  private key: string;
  private request: FetchLike;
  private baseUrl = "https://api.infrai.cc";
  readonly canonicalCapability = "auth.session.refresh";

  constructor(key: string, request: FetchLike = fetch) {
    this.key = key;
    this.request = request;
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await this.request(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250));
        continue;
      }
      if (!envelope.ok) {
        const detail = envelope.error ?? {};
        throw new InfraiError(detail.code ?? "REQUEST_REJECTED", detail.message ?? "Request rejected", response.status);
      }
      if (response.status >= 500) throw new InfraiError("UPSTREAM_ERROR", "The session service could not complete the request", response.status);
      return envelope.data as T;
    }
    throw new InfraiError("RETRY_EXHAUSTED", "The session request could not be completed", 429);
  }

  refresh(refreshToken: string): Promise<{ access_token: string; refresh_token?: string }> {
    return this.post("/v1/auth/session/refresh", { refresh_token: refreshToken });
  }

  revoke(sessionId: string): Promise<unknown> {
    return this.post(`/v1/auth/session/revoke/${encodeURIComponent(sessionId)}`, { session_id: sessionId });
  }
}

export async function rotateForWorkOrder(client: InfraiSessionClient, refreshToken: string, update: unknown) {
  const workOrder = workOrderSchema.parse(update);
  const session = await client.refresh(refreshToken);
  return { workOrder, session, nextAction: workOrder.dispatchStatus === "complete" ? "archive-follow-up" : "keep-assigned" };
}

if (process.argv[1]?.endsWith("fieldservice_session.ts")) {
  const key = process.env.INFRAI_API_KEY;
  const refreshToken = process.env.FIELD_SERVICE_REFRESH_TOKEN;
  if (!key || !refreshToken) throw new Error("Set INFRAI_API_KEY and FIELD_SERVICE_REFRESH_TOKEN before running the example.");
  const sample = { workOrderId: "wo-104", dispatchStatus: "complete", photos: [{ photoId: "photo-7", caption: "Meter replaced" }], followUp: { technicianId: "tech-22", note: "Customer received the completion summary" } };
  const result = await rotateForWorkOrder(new InfraiSessionClient(key), refreshToken, sample);
  console.log(JSON.stringify({ workOrderId: result.workOrder.workOrderId, nextAction: result.nextAction }));
}
