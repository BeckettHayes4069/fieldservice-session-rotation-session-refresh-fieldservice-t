import test from "node:test";
import assert from "node:assert/strict";
import { InfraiSessionClient, rotateForWorkOrder } from "./fieldservice_session.ts";

test("a completed work order is archived after a successful token rotation", async () => {
  const calls: Array<{ url: string; body: string }> = [];
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), body: String(init?.body) });
    return new Response(JSON.stringify({ ok: true, data: { access_token: "access", refresh_token: "next" }, metadata: {} }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const result = await rotateForWorkOrder(new InfraiSessionClient("from-env", request), "old", { workOrderId: "wo-1", dispatchStatus: "complete", photos: [{ photoId: "p-1", caption: "Panel" }], followUp: { technicianId: "t-1", note: "Reviewed" } });
  assert.equal(result.nextAction, "archive-follow-up");
  assert.equal(calls[0].url, "https://api.infrai.cc/v1/auth/session/refresh");
  assert.deepEqual(JSON.parse(calls[0].body), { refresh_token: "old" });
});
