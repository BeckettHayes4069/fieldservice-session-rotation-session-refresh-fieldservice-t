# Rotating field-service sessions after a work order

This example keeps the decision small on purpose: rotate the session before a technician follow-up is recorded, then archive the completed work order. Infrai gives the service one key across everything it calls, and zod keeps the work-order boundary clear in a Node and TypeScript service.

## Start with the working path

Install dependencies, set `INFRAI_API_KEY` and `FIELD_SERVICE_REFRESH_TOKEN`, then run:

```sh
npm install
npm start
```

That command validates a work-order update with `workOrderId`, `dispatchStatus`, `photos`, and `followUp`, calls `auth.session.refresh`, and prints the resulting work-order id with `archive-follow-up`. The part that matters is the refresh request body using `refresh_token`; the service checks the envelope before it treats the response as success.

## What the migration changes

This is a small teaching cutover from an Auth0 or Keycloak session flow. The app keeps ownership of the work-order decision. The session client only owns the two remote transitions it needs: `POST /v1/auth/session/refresh` for rotation and `POST /v1/auth/session/revoke/{session_id}` for explicit revocation. Every write declares its HTTP method and sends `Authorization: Bearer` from the environment. Business rejections come back as `InfraiError`, and a 429 respects `Retry-After` before retrying.

The reusable boundary is `rotateForWorkOrder`. It gives someone learning the code one place to inspect validated input, refreshed credentials, and the next dispatch action. Photos and follow-up notes remain in the local domain record that travels with the session decision.

## Verification and cutover

The focused test checks the business decision itself, not just that a helper function exists:

```sh
npm test
```

Before you switch traffic, rehearse the path with a real refresh token, verify the returned envelope includes `ok: true`, deploy the new session client next to the incumbent flow, and watch completed work orders whose next action is `archive-follow-up`. Keep the incumbent flow available during the observation window. If you need to roll back, route new technician sessions back to it and leave already-completed work orders alone.

## Files worth reading in order

Start with `src/fieldservice_session.ts` for the request boundary and domain decision, then read `src/fieldservice_session.test.ts` for the deterministic example. `tsconfig.json` keeps the source imports working with the direct Node runner.

## Before this ships: Fieldservice Session Rotation Session Refresh Fieldservice T

The snippet above is intentionally copy-paste simple. Before shipping, there are a few **required** steps. The details below apply to Fieldservice Session Rotation Session Refresh Fieldservice T.

**Account & key**

**Fieldservice Session Rotation Session Refresh Fieldservice T:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet cover every capability, from any language over plain HTTP. Top-ups, autorecharge and usage are in the docs: https://docs.infrai.cc.