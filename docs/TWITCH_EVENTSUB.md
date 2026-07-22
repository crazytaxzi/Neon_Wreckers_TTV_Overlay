# Twitch EventSub authorization and recovery

Neon Wreckers creates webhook EventSub subscriptions with a Twitch app access token. The streamer must separately authorize the same Twitch application with every user scope required by the selected subscription types.

## Required scopes

`TWITCH_REQUIRED_SCOPES` must include:

- `user:read:chat`
- `moderator:read:followers`
- `channel:read:subscriptions`
- `bits:read`

The deployment example includes these scopes. Changing the environment value does not modify an authorization that Twitch already issued.

## Reauthorization procedure

When the admin console reports missing scopes:

1. Verify `TWITCH_REQUIRED_SCOPES` contains every scope above.
2. Restart or redeploy the API after changing environment configuration.
3. Sign out of Neon Wreckers.
4. Sign in through Twitch again as the configured streamer account.
5. Return to the admin console and run **Connect EventSub subscriptions**.

Refreshing an existing token preserves its original grants. A fresh OAuth authorization is required to add scopes.

## Reconciliation behavior

Subscription setup is idempotent. Twitch HTTP `409` responses mean an equivalent subscription already exists and are reported as successful reconciliation rather than an operator warning.

Authorization failures are summarized in the admin console. Twitch response payloads and status codes are recorded in structured server logs so operators get useful diagnostics without exposing raw integration payloads in UI notifications.

The subscription condition for `channel.chat.message` uses the configured streamer Twitch ID as both the broadcaster and authorized chat user. The follow subscription uses the same account as broadcaster and moderator.
