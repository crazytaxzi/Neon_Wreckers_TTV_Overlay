# StreamElements account integration

Neon Wreckers uses StreamElements for loyalty-point balances, debits, and refunds. Twitch EventSub remains the source for chat, follows, subscriptions, cheers, and raids.

## Why the old status was misleading

The previous health check only called `/channels/me` with a server JWT. A successful response proved that *some* StreamElements account accepted the token, but the admin UI did not display the returned channel identity or compare it with the configured Twitch streamer.

The control center now stores the verified StreamElements channel ID, provider ID, username, display name, avatar, authentication type, scopes, verification time, and any last error. The active connection is selected explicitly.

## Preferred OAuth setup

Register a StreamElements OAuth application and configure this callback:

`https://YOUR_PUBLIC_HOST/api/v1/auth/streamelements/callback`

Set these environment values:

```dotenv
STREAMELEMENTS_PROVIDER=streamelements
STREAMELEMENTS_CLIENT_ID=...
STREAMELEMENTS_CLIENT_SECRET=...
STREAMELEMENTS_REDIRECT_URI=https://YOUR_PUBLIC_HOST/api/v1/auth/streamelements/callback
STREAMELEMENTS_OAUTH_SCOPES=channel:read loyalty:read loyalty:write
```

The requested scopes are limited to the implemented features:

- `channel:read` verifies the exact StreamElements channel.
- `loyalty:read` reads balances and loyalty configuration.
- `loyalty:write` performs point debits and refunds.

The StreamElements realtime gateway also offers `channel.activities` with `activities:read`, but Neon Wreckers does not request that permission because Twitch EventSub already supplies the same follow, subscription, cheer, and raid events to the overlay. Using both sources would produce duplicate activity cards.

After deployment, open **Admin → Integrations → Connect another account**. StreamElements authorizes the channel currently selected in its dashboard. To save another channel, switch to that channel in StreamElements and repeat the connection. Neon Wreckers then shows all saved, verified channels and lets the operator choose the active one.

OAuth access and refresh tokens are encrypted before being written to the existing versioned configuration registry. Managed integration records are excluded from the generic configuration list, and generic configuration writes cannot use the reserved integration namespace.

## Legacy owner-token migration

Existing deployments may continue using:

```dotenv
STREAMELEMENTS_CHANNEL_ID=...
STREAMELEMENTS_JWT=...
```

Use **Verify current server token** in the Integrations workspace. Neon Wreckers calls `/channels/me`, ignores the manually typed channel ID as a source of truth, saves the identity returned by StreamElements, and lets the operator select it. Once OAuth is configured and verified, the legacy values can be removed during a later maintenance window.

## Point-action safety

Point-funded commands require all three controls:

1. A verified, selected StreamElements account.
2. **Point actions enabled** for that selected account.
3. `FEATURE_POINTS_ACTIONS=true` in the server environment.

The selected connection's verified channel ID is used for balance changes and refunds. A Twitch provider-ID mismatch is displayed as a blocking warning in the admin UI. Historical refunds are blocked until the operator selects the same StreamElements channel that handled the original charge.

## Chat command editor

The Commands workspace edits command triggers, descriptions, enablement, player-account requirements, and the mapped action. Actions are deliberately limited to a validated server-side allowlist:

- scan for a wreck
- deploy cutters
- deploy cargo recovery
- spend points on rush scan
- spend points on safety override

The editor cannot execute arbitrary code. Every command change is versioned and written to the audit log.

## Overlay event source

The overlay already receives follows, subscriptions, cheers, and raids through Twitch EventSub. Those webhook events become history entries and are broadcast to the overlay over the application's realtime WebSocket.

StreamElements activity ingestion is intentionally not enabled in parallel. Receiving the same Twitch event from both providers would create duplicate activity cards. StreamElements is used for account verification and loyalty routing; Twitch EventSub remains authoritative for live viewer events.
