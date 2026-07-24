# Twitch EventSub authorization and recovery

Neon Wreckers creates webhook EventSub subscriptions with a Twitch app access token. The streamer must separately authorize the same Twitch application with every user scope required by the selected subscription types.

## Required scopes

The API always requests these canonical scopes, even when an older production `.env` contains a shorter `TWITCH_REQUIRED_SCOPES` value:

- `user:read:email`
- `user:read:chat`
- `user:bot`
- `channel:bot`
- `moderator:read:followers`
- `channel:read:subscriptions`
- `bits:read`

Webhook-based `channel.chat.message` subscriptions are created with an app access token. Twitch therefore requires both the chat-reading grant and the bot/channel grants associated with that client ID. The configured streamer account is used as both the chat user and broadcaster.

`TWITCH_REQUIRED_SCOPES` may add future or deployment-specific scopes, but it cannot remove the canonical EventSub grants. This prevents a stale environment file from silently downgrading a fresh OAuth authorization.

Changing the configured scope list does not modify an authorization that Twitch already issued.

## Reauthorization procedure

When the admin console reports missing scopes or Twitch rejects `channel.chat.message` authorization:

1. Deploy the current API build so the canonical scope list is active.
2. Open `/api/v1/auth/twitch/start?returnTo=/admin/&forceVerify=1` on the public host.
3. Sign in through Twitch as the configured streamer account and approve the requested permissions.
4. The OAuth callback returns directly to `/admin/`.
5. Run **Connect EventSub subscriptions** again.

Refreshing an existing token preserves its original grants. A fresh OAuth authorization is required to add scopes.

The `returnTo` value is limited to same-origin relative paths so OAuth cannot be used as an open redirect.

## Reconciliation behavior

Subscription setup is idempotent. Twitch HTTP `409` responses mean an equivalent subscription already exists and are reported as successful reconciliation rather than an operator warning.

Authorization failures are summarized in the admin console. Twitch response payloads and status codes are recorded in structured server logs so operators get useful diagnostics without exposing raw integration payloads in UI notifications.

The subscription condition for `channel.chat.message` uses the configured streamer Twitch ID as both the broadcaster and authorized chat user. The follow subscription uses the same account as broadcaster and moderator.
