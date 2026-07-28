import { useState } from "react";
import { errorMessage, requestApi } from "@neon-wreckers/browser-client";
import {
  Badge,
  Button,
  DataGrid,
  Field,
  Input,
  Panel,
  SectionTitle,
  useToast,
} from "@neon-wreckers/ui";

export type LoyaltyTransaction = {
  id: string;
  amount: number;
  actionSlug: string;
  status: string;
  createdAt: string;
  error: string | null;
  user: { displayName: string; twitchLogin: string };
};

type PushToast = ReturnType<typeof useToast>["pushToast"];

export type RefundDependencies = {
  confirm: (message: string) => boolean;
  request: typeof requestApi;
  refresh: () => Promise<void>;
  pushToast: PushToast;
  errorMessage: typeof errorMessage;
};

export function isRefundEligible(
  transaction: LoyaltyTransaction,
  reason: string,
) {
  return (
    ["committed", "ambiguous"].includes(transaction.status) &&
    reason.length >= 3
  );
}

export async function refundLoyaltyTransaction(
  transaction: LoyaltyTransaction,
  reason: string,
  dependencies: RefundDependencies,
) {
  if (
    !dependencies.confirm(
      `Refund ${transaction.amount} points to ${transaction.user.displayName}?`,
    )
  )
    return;
  try {
    await dependencies.request(
      `/api/v1/admin/transactions/${transaction.id}/refund`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      },
    );
    dependencies.pushToast({
      title: "Points refunded",
      message: `${transaction.amount} points returned to ${transaction.user.displayName}.`,
      tone: "success",
    });
    await dependencies.refresh();
  } catch (error) {
    dependencies.pushToast({
      title: "Refund failed",
      message: dependencies.errorMessage(error),
      tone: "danger",
    });
  }
}

export function RefundsPage({
  transactions,
  refresh,
  pushToast,
}: {
  transactions: LoyaltyTransaction[];
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  const [reason, setReason] = useState("Operator-approved point refund");
  const refund = (transaction: LoyaltyTransaction) =>
    refundLoyaltyTransaction(transaction, reason, {
      confirm: (message) => window.confirm(message),
      request: requestApi,
      refresh,
      pushToast,
      errorMessage,
    });

  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="FINANCIAL OPERATIONS"
        title="Point Transactions & Refunds"
        description="Refunds credit StreamElements first and update the local ledger only after confirmation."
        icon="credits"
      />
      <Field label="Required refund reason">
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      <Panel>
        <DataGrid
          rows={transactions}
          getRowKey={(row) => row.id}
          empty="No point transactions."
          columns={[
            {
              key: "player",
              header: "Player",
              render: (row) => <strong>{row.user.displayName}</strong>,
            },
            {
              key: "action",
              header: "Command",
              render: (row) => row.actionSlug,
            },
            {
              key: "amount",
              header: "Points",
              align: "right",
              render: (row) => row.amount,
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <Badge
                  tone={
                    row.status === "committed"
                      ? "success"
                      : row.status === "ambiguous"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            {
              key: "time",
              header: "Created",
              render: (row) => new Date(row.createdAt).toLocaleString(),
            },
            {
              key: "refund",
              header: "Control",
              align: "right",
              render: (row) => (
                <Button
                  size="sm"
                  variant="warning"
                  disabled={!isRefundEligible(row, reason)}
                  onClick={() => void refund(row)}
                >
                  Refund
                </Button>
              ),
            },
          ]}
        />
      </Panel>
    </div>
  );
}
