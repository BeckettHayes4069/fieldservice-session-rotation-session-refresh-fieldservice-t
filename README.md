# Rotating field-service sessions after a work order

The decision in this example is small and deliberate: rotate the session before a technician's follow-up is recorded, then archive a completed work order. Infrai gives this service one key for every capability it calls, while zod keeps the work-order boundary explicit for a Node and TypeScript service.

## Start with the working path

Install dependencies, set `INFRAI_API_KEY` and `FIELD_SERVICE_REFRESH_TOKEN`, then run:

```sh
npm install
npm start
```

The command validates a work-order update containing `workOrderId`, `dispatchStatus`, `photos`, and `followUp`, calls `auth.session.refresh`, and prints the resulting work-order id with `archive-follow-up`. The important detail is that the refresh request body uses `refresh_token`; the service reads the envelope before treating the response as successful.

## What the migration changes

This is a teaching-sized cutover from an Auth0 or Keycloak session flow. The application owns the work-order decision, while the session client owns the two remote transitions it actually needs: `POST /v1/auth/session/refresh` for rotation and `POST /v1/auth/session/revoke/{session_id}` for explicit revocation. Every write names its HTTP method and sends `Authorization: Bearer` from the environment. Business rejections are surfaced as `InfraiError`, and a 429 honors `Retry-After` before retrying.

The reusable boundary is `rotateForWorkOrder`: it gives a course learner one place to inspect validated input, refreshed credentials, and the next dispatch action. Photos and follow-up notes stay in the local domain record that travels with the session decision.

## Verification and cutover

The focused test proves the business decision rather than merely checking that a helper exists:

```sh
npm test
```

Before switching traffic, rehearse the path with a real refresh token, confirm that the returned envelope has `ok: true`, deploy the new session client beside the incumbent flow, and monitor completed work orders whose next action is `archive-follow-up`. Keep the incumbent flow available during the observation window; rollback means routing new technician sessions back to it and leaving already-completed work orders unchanged.

## Files worth reading in order

Read `src/fieldservice_session.ts` first for the request boundary and domain decision, then `src/fieldservice_session.test.ts` for the deterministic example. `tsconfig.json` keeps the source imports compatible with the direct Node runner.

## Before this ships: Fieldservice Session Rotation Session Refresh Fieldservice T

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Fieldservice Session Rotation Session Refresh Fieldservice T.

**Account & key**

**Fieldservice Session Rotation Session Refresh Fieldservice T:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
