import { useEffect, useState } from "react";
import { errorMessage, requestApi } from "@neon-wreckers/browser-client";
import {
  Button,
  Field,
  Input,
  Modal,
  Notification,
  Panel,
  SectionTitle,
  Select,
  useToast,
} from "@neon-wreckers/ui";

export type ChatCommandAction =
  | { type: "scan" }
  | { type: "salvage"; mode: "cutters" | "cargo" }
  | { type: "point_action"; slug: "rush_scan" | "safety_override" };

export type ChatCommand = {
  id: string;
  trigger: string;
  description: string;
  enabled: boolean;
  requiresPlayer: boolean;
  action: ChatCommandAction;
  updatedAt: string | null;
  source: "default" | "configured";
};

type PushToast = ReturnType<typeof useToast>["pushToast"];

type SaveCommandDependencies = {
  request: typeof requestApi;
  refresh: () => Promise<void>;
  pushToast: PushToast;
  errorMessage: typeof errorMessage;
};

type RetireCommandDependencies = SaveCommandDependencies & {
  confirm: (message: string) => boolean;
  clearSelected: () => void;
};

export function createCommandDraft(): ChatCommand {
  return {
    id: "",
    trigger: "!command",
    description: "Describe what this command does.",
    enabled: true,
    requiresPlayer: true,
    action: { type: "scan" },
    updatedAt: null,
    source: "configured",
  };
}

export function findSelectedCommand(
  commands: ChatCommand[],
  selectedId: string,
) {
  return commands.find((command) => command.id === selectedId);
}

export function commandActionKey(draft: ChatCommand | null) {
  return draft?.action.type === "scan"
    ? "scan"
    : draft?.action.type === "salvage"
      ? `salvage:${draft.action.mode}`
      : `point:${draft?.action.slug}`;
}

export function commandActionForValue(
  value: string,
): ChatCommandAction | null {
  if (value === "scan") return { type: "scan" };
  if (value === "salvage:cutters")
    return { type: "salvage", mode: "cutters" };
  if (value === "salvage:cargo")
    return { type: "salvage", mode: "cargo" };
  if (value === "point:rush_scan")
    return { type: "point_action", slug: "rush_scan" };
  if (value === "point:safety_override")
    return { type: "point_action", slug: "safety_override" };
  return null;
}

export async function saveAdminChatCommand(
  draft: ChatCommand | null,
  selectedId: string | null,
  dependencies: SaveCommandDependencies,
) {
  if (!draft) return;
  try {
    const path = selectedId
      ? `/api/v1/admin/chat-commands/${encodeURIComponent(selectedId)}`
      : "/api/v1/admin/chat-commands";
    await dependencies.request(path, {
      method: selectedId ? "PUT" : "POST",
      body: JSON.stringify({
        trigger: draft.trigger,
        description: draft.description,
        enabled: draft.enabled,
        requiresPlayer: true,
        action: draft.action,
      }),
    });
    dependencies.pushToast({
      title: "Chat command saved",
      message: draft.trigger,
      tone: "success",
    });
    await dependencies.refresh();
  } catch (error) {
    dependencies.pushToast({
      title: "Command rejected",
      message: dependencies.errorMessage(error),
      tone: "danger",
    });
  }
}

export async function retireAdminChatCommand(
  selectedId: string | null,
  draft: ChatCommand | null,
  dependencies: RetireCommandDependencies,
) {
  if (
    !selectedId ||
    !draft ||
    !dependencies.confirm(`Retire ${draft.trigger}?`)
  )
    return;
  try {
    await dependencies.request(
      `/api/v1/admin/chat-commands/${encodeURIComponent(selectedId)}`,
      { method: "DELETE" },
    );
    dependencies.pushToast({ title: "Chat command retired", tone: "success" });
    dependencies.clearSelected();
    await dependencies.refresh();
  } catch (error) {
    dependencies.pushToast({
      title: "Retire failed",
      message: dependencies.errorMessage(error),
      tone: "danger",
    });
  }
}

export function CommandsPage({
  commands,
  refresh,
  pushToast,
}: {
  commands: ChatCommand[];
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ChatCommand | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    const selected = findSelectedCommand(commands, selectedId);
    if (selected) setDraft(selected);
    else {
      setSelectedId(null);
      setDraft(null);
    }
  }, [commands, selectedId]);

  const newCommand = () => {
    setSelectedId(null);
    setDraft(createCommandDraft());
  };

  const save = () =>
    saveAdminChatCommand(draft, selectedId, {
      request: requestApi,
      refresh,
      pushToast,
      errorMessage,
    });

  const retire = () =>
    retireAdminChatCommand(selectedId, draft, {
      request: requestApi,
      refresh,
      pushToast,
      errorMessage,
      confirm: (message) => window.confirm(message),
      clearSelected: () => setSelectedId(null),
    });

  const actionKey = commandActionKey(draft);

  const setAction = (value: string) => {
    if (!draft) return;
    const action = commandActionForValue(value);
    if (action) setDraft({ ...draft, action });
  };

  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="CHAT AUTOMATION"
        title="Command Editor"
        description="Commands map to a safe server-side action allowlist. They cannot execute arbitrary code."
        icon="terminal"
        action={<Button onClick={newCommand}>New command</Button>}
      />
      <div className="admin-player-layout">
        <Panel>
          <div className="admin-player-list">
            {commands.map((command) => (
              <button
                key={command.id}
                className={`admin-player-button ${selectedId === command.id ? "is-selected" : ""}`}
                onClick={() => {
                  setSelectedId(command.id);
                  setDraft(command);
                }}
              >
                <strong>{command.trigger}</strong>
                <span>{command.description}</span>
                <small>
                  {command.enabled ? "Enabled" : "Disabled"} · {command.source}
                </small>
              </button>
            ))}
          </div>
        </Panel>
        <Modal
          open={Boolean(draft)}
          onClose={() => {
            setDraft(null);
            setSelectedId(null);
          }}
          title={
            draft
              ? `${selectedId ? "Edit" : "Create"} ${draft.trigger}`
              : "Command editor"
          }
          description="Configure the trigger and its allowlisted server action."
          size="lg"
        >
          {draft && (
            <div className="admin-stack">
              <SectionTitle
                eyebrow={selectedId ? "EDIT COMMAND" : "NEW COMMAND"}
                title={draft.trigger}
                icon="terminal"
              />
              <Field
                label="Chat trigger"
                hint="Starts with ! and matches the full normalized chat message"
              >
                <Input
                  value={draft.trigger}
                  onChange={(event) =>
                    setDraft({ ...draft, trigger: event.target.value })
                  }
                />
              </Field>
              <Field label="Description">
                <Input
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                />
              </Field>
              <Field label="Server action">
                <Select
                  value={actionKey}
                  onChange={(event) => setAction(event.target.value)}
                >
                  <option value="scan">Scan for wreck</option>
                  <option value="salvage:cutters">Deploy cutters</option>
                  <option value="salvage:cargo">Deploy cargo recovery</option>
                  <option value="point:rush_scan">
                    Spend points: rush scan
                  </option>
                  <option value="point:safety_override">
                    Spend points: safety override
                  </option>
                </Select>
              </Field>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) =>
                    setDraft({ ...draft, enabled: event.target.checked })
                  }
                />{" "}
                Command enabled
              </label>
              <Notification title="Linked viewer account required" tone="info">
                All current command actions modify persistent player state, so
                the chatter must have signed into Neon Wreckers.
              </Notification>
              <Notification title="Execution boundary" tone="info">
                The action is selected from a validated server allowlist.
                Point-funded actions still require a verified StreamElements
                account, the per-account toggle, and the server kill switch.
              </Notification>
              <div className="admin-mobile-actions">
                <Button onClick={() => void save()}>Save command</Button>
                {selectedId && (
                  <Button variant="warning" onClick={() => void retire()}>
                    Retire command
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
