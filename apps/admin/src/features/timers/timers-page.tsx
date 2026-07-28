import { errorMessage, requestApi } from "@neon-wreckers/browser-client";
import {
  Button,
  DataGrid,
  Notification,
  Panel,
  SectionTitle,
  useToast,
} from "@neon-wreckers/ui";

export type TimerRecord = {
  id: string;
  name: string;
  playerName: string;
  resolvesAt: string;
};

type PushToast = ReturnType<typeof useToast>["pushToast"];

export type ForceResolveDependencies = {
  confirm: (message: string) => boolean;
  request: typeof requestApi;
  refresh: () => Promise<void>;
  pushToast: PushToast;
  errorMessage: typeof errorMessage;
};

export async function forceResolveExpedition(
  id: string,
  dependencies: ForceResolveDependencies,
) {
  if (!dependencies.confirm("Resolve this expedition immediately?")) return;
  try {
    await dependencies.request(`/api/v1/expeditions/${id}/resolve-now`, {
      method: "POST",
    });
    dependencies.pushToast({
      title: "Expedition timer resolved",
      tone: "success",
    });
    await dependencies.refresh();
  } catch (error) {
    dependencies.pushToast({
      title: "Timer command failed",
      message: dependencies.errorMessage(error),
      tone: "danger",
    });
  }
}

export function TimersPage({
  timers,
  refresh,
  pushToast,
}: {
  timers: TimerRecord[];
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  const resolveNow = (id: string) =>
    forceResolveExpedition(id, {
      confirm: (message) => window.confirm(message),
      request: requestApi,
      refresh,
      pushToast,
      errorMessage,
    });

  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="SCHEDULE CONTROL"
        title="Active Expedition Timers"
        description="Force an overdue or stuck expedition into its server-calculated resolved state. Players must still claim their rewards."
        icon="events"
      />
      <Panel>
        <DataGrid
          rows={timers}
          getRowKey={(row) => row.id}
          empty="No active expedition timers."
          columns={[
            {
              key: "player",
              header: "Player",
              render: (row) => <strong>{row.playerName}</strong>,
            },
            { key: "mission", header: "Mission", render: (row) => row.name },
            {
              key: "return",
              header: "Scheduled return",
              render: (row) => new Date(row.resolvesAt).toLocaleString(),
            },
            {
              key: "control",
              header: "Control",
              align: "right",
              render: (row) => (
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => void resolveNow(row.id)}
                >
                  Resolve now
                </Button>
              ),
            },
          ]}
        />
      </Panel>
      <Notification title="Other command timers" tone="info">
        Player crafting, salvage, scan, station-maintenance, and career timers
        are listed and reset from the Players workspace. Live-event timers are
        stopped and reset from Operations.
      </Notification>
    </div>
  );
}
