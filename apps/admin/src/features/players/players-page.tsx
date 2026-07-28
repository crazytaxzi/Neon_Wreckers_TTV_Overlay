import { useEffect, useState } from "react";
import { errorMessage, requestApi } from "@neon-wreckers/browser-client";
import {
  Button,
  Field,
  Input,
  Modal,
  Panel,
  ResponsiveGrid,
  SectionTitle,
  StatusDisplay,
  useToast,
} from "@neon-wreckers/ui";

export type AdminPlayer = {
  id: string;
  displayName: string;
  twitchLogin: string;
  credits: number;
  xp: number;
  level: number;
  reputation: number;
  bannedUntil: string | null;
  cooldowns: Array<{
    id: string;
    actionKey: string;
    expiresAt: string;
  }>;
};

type PushToast = ReturnType<typeof useToast>["pushToast"];

export type PlayerCommandDependencies = {
  request: typeof requestApi;
  refresh: () => Promise<void>;
  pushToast: PushToast;
  errorMessage: typeof errorMessage;
};

export function filterPlayers(players: AdminPlayer[], query: string) {
  return players.filter((player) =>
    `${player.displayName} ${player.twitchLogin}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
}

export function shouldClearPlayerSelection(
  selected: AdminPlayer | null,
  players: AdminPlayer[],
) {
  return Boolean(
    selected && !players.some((player) => player.id === selected.id),
  );
}

export async function postPlayerCommand(
  path: string,
  body: unknown,
  success: string,
  dependencies: PlayerCommandDependencies,
) {
  try {
    await dependencies.request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
    dependencies.pushToast({ title: success, tone: "success" });
    await dependencies.refresh();
  } catch (error) {
    dependencies.pushToast({
      title: "Admin command failed",
      message: dependencies.errorMessage(error),
      tone: "danger",
    });
  }
}

export function PlayersPage({
  players,
  refresh,
  pushToast,
}: {
  players: AdminPlayer[];
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminPlayer | null>(null);
  const [credits, setCredits] = useState(0);
  const [xp, setXp] = useState(0);
  const [reputation, setReputation] = useState(0);
  const [reason, setReason] = useState("Operator correction");

  useEffect(() => {
    if (shouldClearPlayerSelection(selected, players)) setSelected(null);
  }, [players, selected]);

  const visible = filterPlayers(players, query);
  const post = (path: string, body: unknown, success: string) =>
    postPlayerCommand(path, body, success, {
      request: requestApi,
      refresh,
      pushToast,
      errorMessage,
    });

  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="PLAYER ADMINISTRATION"
        title="Accounts, Balances & Cooldowns"
        description="All changes require a reason and are written to the audit log."
        icon="crew"
      />
      <Field label="Find player">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Display name or Twitch login"
        />
      </Field>
      <div className="admin-player-layout">
        <Panel>
          <div className="admin-player-list">
            {visible.map((player) => (
              <button
                key={player.id}
                className={`admin-player-button ${selected?.id === player.id ? "is-selected" : ""}`}
                onClick={() => setSelected(player)}
              >
                <strong>{player.displayName}</strong>
                <span>
                  @{player.twitchLogin} · L{player.level}
                </span>
                <small>
                  {player.credits.toLocaleString()} cr ·{" "}
                  {player.cooldowns.length} cooldowns
                </small>
              </button>
            ))}
          </div>
        </Panel>
        {selected && (
          <Modal
            open
            onClose={() => setSelected(null)}
            title={`Manage ${selected.displayName}`}
            description="Adjust balances and persistent cooldowns with an audited reason."
            size="lg"
          >
            <ResponsiveGrid min="9rem">
              <StatusDisplay
                compact
                label="Credits"
                value={selected.credits}
                icon="credits"
                tone="success"
              />
              <StatusDisplay
                compact
                label="XP"
                value={selected.xp}
                icon="data"
                tone="info"
              />
              <StatusDisplay
                compact
                label="Reputation"
                value={selected.reputation}
                icon="museum"
                tone="purple"
              />
            </ResponsiveGrid>
            <Field label="Required audit reason">
              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </Field>
            <ResponsiveGrid min="9rem">
              <Field label="Credit adjustment">
                <Input
                  type="number"
                  value={credits}
                  onChange={(event) => setCredits(Number(event.target.value))}
                />
              </Field>
              <Field label="XP adjustment">
                <Input
                  type="number"
                  value={xp}
                  onChange={(event) => setXp(Number(event.target.value))}
                />
              </Field>
              <Field label="Reputation adjustment">
                <Input
                  type="number"
                  value={reputation}
                  onChange={(event) =>
                    setReputation(Number(event.target.value))
                  }
                />
              </Field>
            </ResponsiveGrid>
            <Button
              fullWidth
              onClick={() =>
                void post(
                  `/api/v1/admin/players/${selected.id}/adjust`,
                  { credits, xp, reputation, reason },
                  "Player balances updated",
                )
              }
            >
              Apply adjustments
            </Button>
            <SectionTitle
              eyebrow="ACTION TIMERS"
              title="Active Cooldowns"
              icon="events"
            />
            <div className="admin-cooldowns">
              {selected.cooldowns.map((cooldown) => (
                <div key={cooldown.id}>
                  <span>{cooldown.actionKey}</span>
                  <strong>
                    {new Date(cooldown.expiresAt).toLocaleString()}
                  </strong>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void post(
                        `/api/v1/admin/players/${selected.id}/cooldowns/reset`,
                        { actionKey: cooldown.actionKey, reason },
                        "Cooldown reset",
                      )
                    }
                  >
                    Reset
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="warning"
              fullWidth
              disabled={!selected.cooldowns.length}
              onClick={() =>
                void post(
                  `/api/v1/admin/players/${selected.id}/cooldowns/reset`,
                  { reason },
                  "All cooldowns reset",
                )
              }
            >
              Reset every player timer
            </Button>
          </Modal>
        )}
      </div>
    </div>
  );
}
