import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  ConfirmWindow,
  DataGrid,
  Field,
  HealthBar,
  Input,
  Modal,
  Notification,
  NWIcon,
  Panel,
  Pill,
  ProgressBar,
  ResponsiveGrid,
  SectionTitle,
  Select,
  StatusDisplay,
} from "@neon-wreckers/ui";
import { GameArtwork } from "../components/GameArtwork.js";
import { crewPortraits, crewPortraitUrl } from "../crew-portraits.js";
import type {
  ExpeditionDefinition,
  GameData,
  Marketplace,
  Ship,
} from "../model.js";
import {
  formatCountdown,
  cooldownRemaining,
  toneForValue,
  riskTone,
  rarityTone,
  expeditionTone,
} from "../page-utils.js";

function shipArtworkSrc(ship: Ship): string | null {
  if (ship.activeSkin) return `/ships/skins/${ship.activeSkin}.webp`;
  if (ship.visualKey?.startsWith("ship-"))
    return `/ships/base/${ship.visualKey.slice("ship-".length)}.webp`;
  if (["salvage-skiff", "cargo-hauler"].includes(ship.classSlug))
    return `/ships/base/${ship.classSlug}.webp`;
  return null;
}

function FleetShipArtwork({
  ship,
  className,
}: {
  ship: Ship;
  className?: string;
}) {
  const src = shipArtworkSrc(ship);
  return src ? (
    <GameArtwork
      className={className}
      src={src}
      alt={`${ship.name} ship`}
      sizes="(max-width: 760px) 88vw, 28rem"
    />
  ) : (
    <NWIcon name="expedition" size={50} />
  );
}

export function formatCrewStars(value: number): string {
  const rating = Math.min(
    5,
    Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0)),
  );
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
}

export function ShipsPage({
  ships,
  expeditions,
  cooldowns,
  inventory,
  marketplace,
  station,
  me,
  action,
}: Pick<
  GameData,
  | "ships"
  | "crew"
  | "expeditions"
  | "cooldowns"
  | "inventory"
  | "marketplace"
  | "station"
  | "me"
  | "action"
>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [operation, setOperation] = useState("rename");
  const [renameName, setRenameName] = useState("");
  const [upgradeSlug, setUpgradeSlug] = useState("");
  const [skinSlug, setSkinSlug] = useState("");
  const [fuelCells, setFuelCells] = useState(1);
  const [repairAmount, setRepairAmount] = useState(10);
  const [confirm, setConfirm] = useState<{
    path: string;
    payload: unknown;
    label: string;
    title: string;
    body: string;
  } | null>(null);
  const selected = ships.find((ship) => ship.id === selectedId) ?? null;
  const deployed = new Set(
    expeditions
      .filter((expedition) => expedition.status === "active")
      .map((expedition) => expedition.shipId),
  );
  const upgrade = marketplace?.ships.upgrades.find(
    (item) => item.slug === upgradeSlug,
  );
  const skin = marketplace?.ships.skins.find((item) => item.slug === skinSlug);
  const fuelHeld =
    inventory.find((item) => item.itemSlug === "fuel")?.quantity ?? 0;
  const shipyardLevel =
    station?.modules.find((module) => module.slug === "shipyard")?.level ?? 0;
  const fleetCapacity =
    (marketplace?.ships.baseFleetCapacity ?? 2) +
    shipyardLevel * (marketplace?.ships.berthsPerShipyardLevel ?? 2) +
    ((me.player?.level ?? 1) >= 15 ? 1 : 0);
  const skinRemaining = selected
    ? cooldownRemaining(cooldowns, `ship-skin:${selected.id}`, Date.now())
    : 0;
  const openShip = (ship: Ship) => {
    setSelectedId(ship.id);
    setRenameName(ship.name);
    setUpgradeSlug(
      marketplace?.ships.upgrades.find(
        (item) => !ship.upgrades.includes(item.slug),
      )?.slug ?? "",
    );
    setSkinSlug(
      marketplace?.ships.skins.find(
        (item) =>
          item.classSlug === ship.classSlug && item.slug !== ship.activeSkin,
      )?.slug ?? "",
    );
  };
  const requestConfirmation = () => {
    if (!selected) return;
    if (operation === "rename")
      setConfirm({
        path: `/api/v1/ships/${selected.id}/rename`,
        payload: { name: renameName.trim() },
        label: `${selected.name} renamed`,
        title: "Confirm registry rename",
        body: `Rename ${selected.name} to ${renameName.trim()} for ${marketplace?.ships.renameCredits ?? 100} credits?`,
      });
    if (operation === "upgrade" && upgrade)
      setConfirm({
        path: `/api/v1/ships/${selected.id}/upgrade`,
        payload: { slug: upgrade.slug },
        label: `${upgrade.name} installed`,
        title: "Confirm ship upgrade",
        body: `Install ${upgrade.name} for ${upgrade.credits.toLocaleString()} credits${upgrade.alloys ? `, ${upgrade.alloys} alloys` : ""}${upgrade.electronics ? `, ${upgrade.electronics} electronics` : ""}?`,
      });
    if (operation === "license" && skin)
      setConfirm({
        path: `/api/v1/ships/${selected.id}/skin`,
        payload: { skinSlug: skin.slug },
        label: `${skin.name} frame equipped`,
        title: "Confirm premium license and 30-day lock",
        body: `${selected.ownedSkins.includes(skin.slug) ? "Equip the owned" : `Purchase the ${skin.credits.toLocaleString()} credit`} ${skin.name} frame? This immediately locks skin changes on this ship for 30 days.`,
      });
    if (operation === "refuel")
      setConfirm({
        path: `/api/v1/ships/${selected.id}/refuel`,
        payload: { cells: fuelCells },
        label: `${selected.name} refueled`,
        title: "Confirm fuel transfer",
        body: `Transfer ${fuelCells} fuel cell${fuelCells === 1 ? "" : "s"} to ${selected.name}? Your hold currently contains ${fuelHeld}.`,
      });
    if (operation === "repair")
      setConfirm({
        path: `/api/v1/ships/${selected.id}/repair`,
        payload: { amount: repairAmount },
        label: `${selected.name} repaired`,
        title: "Confirm hull repair",
        body: `Restore up to ${repairAmount}% condition. Base estimate: ${(repairAmount * (marketplace?.ships.repair.creditsPerCondition ?? 8)).toLocaleString()} credits plus ${Math.ceil(repairAmount / 20) * (marketplace?.ships.repair.alloysPerTwentyCondition ?? 1)} alloys before discounts.`,
      });
  };
  return (
    <div className="page-stack fleet-console">
      <section className="fleet-console__masthead">
        <div>
          <span className="nw-eyebrow">FLEET CONTROL // SHIP REGISTRY</span>
          <h2>Shipyard Command</h2>
          <p>
            Inspect active frames, manage hull readiness, install upgrades, and
            expand the fleet through server-authoritative commands.
          </p>
        </div>
        <div className="fleet-console__capacity">
          <span>Fleet Capacity</span>
          <strong className="nw-numeric">
            {ships.length} / {fleetCapacity}
          </strong>
          <Badge
            tone={ships.length < fleetCapacity ? "success" : "warning"}
          >
            {ships.length < fleetCapacity ? "BERTH AVAILABLE" : "BERTH LIMIT"}
          </Badge>
        </div>
      </section>
      <SectionTitle
        eyebrow="ACTIVE FLEET"
        title="Registered Ships"
        description="Select a frame to open its management console."
        icon="expedition"
      />
      <ResponsiveGrid min="19rem" className="fleet-card-grid">
        {ships.map((ship) => (
          <Card
            key={ship.id}
            className={`ship-card ship-card--selectable ${selectedId === ship.id ? "is-selected" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => openShip(ship)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") openShip(ship);
            }}
          >
            <div className="ship-card__schematic">
              {<FleetShipArtwork ship={ship} />}
              <span>{ship.classSlug}</span>
            </div>
            <div className="ship-card__head">
              <h3>{ship.name}</h3>
              <Badge tone={deployed.has(ship.id) ? "warning" : "success"}>
                {deployed.has(ship.id) ? "Deployed" : "Select to manage"}
              </Badge>
            </div>
            <HealthBar label="Hull condition" value={ship.condition} />
            <ProgressBar
              label={`Mastery rank ${ship.masteryRank} · ${Math.min(4, 1 + ship.masteryRank)} module slots`}
              value={ship.masteryRank >= 3 ? 100 : ship.masteryRank === 2 ? ((ship.masteryXp - 150) / 200) * 100 : ship.masteryRank === 1 ? ((ship.masteryXp - 50) / 100) * 100 : (ship.masteryXp / 50) * 100}
              tone="purple"
            />
            <div className="ship-card__stats">
              <StatusDisplay
                compact
                label="Cargo"
                value={ship.cargoCapacity}
                icon="cargo"
                tone="info"
              />
              <StatusDisplay
                compact
                label="Fuel"
                value={ship.fuel}
                icon="fuel"
                tone="purple"
              />
            </div>
          </Card>
        ))}
      </ResponsiveGrid>
      {!selected && (
        <Notification title="Select a ship" tone="info">
          Management controls remain closed until you choose a fleet card.
        </Notification>
      )}
      {selected && (
        <Modal
          open
          onClose={() => setSelectedId(null)}
          title={`Manage ${selected.name}`}
          description={`${selected.classSlug} · ${selected.condition}% hull · ${selected.fuel} fuel · ${selected.cargoCapacity} cargo`}
          size="lg"
        >
          <div className="fleet-management-console">
          <div className="fleet-management-console__art">
            <FleetShipArtwork ship={selected} className="management-preview" />
          </div>
          {deployed.has(selected.id) && (
            <Notification title="Ship deployed" tone="warning">
              Preview is available, but changes cannot be confirmed until this
              ship returns.
            </Notification>
          )}
          <Field label="Management action">
            <Select
              value={operation}
              onChange={(event) => setOperation(event.target.value)}
            >
              <option value="rename">Rename registry</option>
              <option value="upgrade">Install upgrade</option>
              <option value="license">Upgrade skin license</option>
              <option value="refuel">Transfer fuel</option>
              <option value="repair">Repair hull</option>
            </Select>
          </Field>
          {operation === "rename" && (
            <Card>
              <Field label="Preview new name">
                <Input
                  value={renameName}
                  maxLength={40}
                  onChange={(event) => setRenameName(event.target.value)}
                />
              </Field>
              <p>
                {selected.name} →{" "}
                <strong>{renameName.trim() || "Enter a name"}</strong> ·{" "}
                {marketplace?.ships.renameCredits ?? 100} credits
              </p>
            </Card>
          )}
          {operation === "upgrade" && (
            <Card>
              <Notification title={`${selected.upgrades.length}/${Math.min(4, 1 + selected.masteryRank)} module slots installed`} tone={selected.upgrades.length < Math.min(4, 1 + selected.masteryRank) ? "info" : "warning"}>
                Complete expeditions with this ship to earn mastery XP. Module slots unlock at 50, 150, and 350 mastery XP.
              </Notification>
              <Field label="Upgrade preview">
                <Select
                  value={upgradeSlug}
                  onChange={(event) => setUpgradeSlug(event.target.value)}
                >
                  {marketplace?.ships.upgrades
                    .filter((item) => !selected.upgrades.includes(item.slug))
                    .map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name} · {item.credits.toLocaleString()} cr
                      </option>
                    ))}
                </Select>
              </Field>
              {upgrade ? (
                <>
                  <h3>{upgrade.name}</h3>
                  <p>{upgrade.description}</p>
                  <div className="trait-list">
                    {upgrade.cargoBonus ? (
                      <Pill tone="info">+{upgrade.cargoBonus} cargo</Pill>
                    ) : null}
                    {upgrade.fuelDiscount ? (
                      <Pill tone="purple">−{upgrade.fuelDiscount} fuel</Pill>
                    ) : null}
                    {upgrade.repairDiscount ? (
                      <Pill tone="success">
                        −{Math.round(upgrade.repairDiscount * 100)}% repair
                      </Pill>
                    ) : null}
                    {upgrade.lootRollBonus ? <Pill tone="info">+{upgrade.lootRollBonus} recovery roll</Pill> : null}
                    {upgrade.successBonus ? <Pill tone="success">+{Math.round(upgrade.successBonus * 100)}% expedition success</Pill> : null}
                    {upgrade.blueprints ? <Pill tone="purple">{upgrade.blueprints} prototype blueprint</Pill> : null}
                  </div>
                </>
              ) : (
                <p>All upgrades installed.</p>
              )}
            </Card>
          )}
          {operation === "license" && (
            <Card>
              {skin && (
                <GameArtwork
                  className="management-preview"
                  src={`/ships/skins/${skin.slug}.webp`}
                  alt={`${skin.name} preview`}
                  sizes="(max-width: 760px) 88vw, 34rem"
                />
              )}
              <Field label="License preview">
                <Select
                  value={skinSlug}
                  onChange={(event) => setSkinSlug(event.target.value)}
                >
                  {marketplace?.ships.skins
                    .filter((item) => item.classSlug === selected.classSlug)
                    .map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name} ·{" "}
                        {selected.ownedSkins.includes(item.slug)
                          ? "owned"
                          : `${item.credits.toLocaleString()} cr`}
                      </option>
                    ))}
                </Select>
              </Field>
              {skin && (
                <>
                  <h3>{skin.name}</h3>
                  <p>{skin.description}</p>
                  <p>
                    <strong>Warning:</strong> equipping starts a 30-day
                    cooldown.{" "}
                    {skinRemaining > 0
                      ? `Current lock: ${formatCountdown(skinRemaining)}.`
                      : "Frame controls ready."}
                  </p>
                </>
              )}
            </Card>
          )}
          {operation === "refuel" && (
            <Card>
              <Field label="Fuel transfer preview">
                <Select
                  value={fuelCells}
                  onChange={(event) => setFuelCells(Number(event.target.value))}
                >
                  {[1, 5, 10].map((value) => (
                    <option key={value} value={value}>
                      {value} cell{value === 1 ? "" : "s"} · fuel{" "}
                      {selected.fuel} → {selected.fuel + value}
                    </option>
                  ))}
                </Select>
              </Field>
              <p>{fuelHeld} fuel cells available in your hold.</p>
            </Card>
          )}
          {operation === "repair" && (
            <Card>
              <Field label="Repair preview">
                <Select
                  value={repairAmount}
                  onChange={(event) =>
                    setRepairAmount(Number(event.target.value))
                  }
                >
                  {[10, 25, 50, 100].map((value) => (
                    <option
                      key={value}
                      value={Math.min(value, 100 - selected.condition)}
                    >
                      Restore up to {Math.min(value, 100 - selected.condition)}%
                      condition
                    </option>
                  ))}
                </Select>
              </Field>
            </Card>
          )}
          <Button
            fullWidth
            disabled={
              deployed.has(selected.id) ||
              (operation === "rename" &&
                (renameName.trim().length < 2 ||
                  renameName.trim() === selected.name)) ||
              (operation === "upgrade" && !upgrade) ||
              (operation === "upgrade" && selected.upgrades.length >= Math.min(4, 1 + selected.masteryRank)) ||
              (operation === "license" && (!skin || skinRemaining > 0)) ||
              (operation === "refuel" && fuelHeld < fuelCells) ||
              (operation === "repair" && selected.condition >= 100)
            }
            onClick={requestConfirmation}
          >
            Preview complete · Continue to confirmation
          </Button>
          </div>
        </Modal>
      )}
      <Panel tone="purple" className="fleet-broker-panel">
        <SectionTitle
          eyebrow="SHIP BROKER"
          title="Expand the Fleet"
          description="Fleet berths come from the Shipyard, with a bonus berth at level 15. Purchases require active Marketplace and Shipyard modules."
          icon="trade"
        />
        <ResponsiveGrid min="16rem">
          {marketplace?.ships.purchases.map((definition) => (
            <Card key={definition.slug} className="ship-card">
              {definition.visualKey && (
                <GameArtwork
                  src={`/ships/base/${definition.visualKey.replace(/^ship-/, "")}.webp`}
                  alt={`${definition.name} ship`}
                  sizes="(max-width: 760px) 88vw, 24rem"
                />
              )}
              <h3>{definition.name}</h3>
              <p>{definition.description ?? "A reliable independent vessel ready for Station Zero service."}</p>
              <div className="trait-list">
                <Pill tone="info">{definition.cargoCapacity} cargo</Pill>
                <Pill tone="purple">{definition.fuel} fuel</Pill>
                {definition.successBonus ? <Pill tone="success">+{Math.round(definition.successBonus * 100)}% expedition success</Pill> : null}
                {definition.injuryReduction ? <Pill tone="success">−{Math.round(definition.injuryReduction * 100)}% injury recovery</Pill> : null}
                {definition.lootRollBonus ? <Pill tone="info">+{definition.lootRollBonus} recovery roll</Pill> : null}
                {definition.maxCrew ? <Pill tone="purple">{definition.maxCrew} crew capacity</Pill> : null}
              </div>
              <Button
                fullWidth
                disabled={
                  !marketplace.unlocked ||
                  station?.modules.find((module) => module.slug === "shipyard")
                    ?.state !== "active" ||
                  ships.length >= fleetCapacity ||
                  (me.player?.credits ?? 0) < definition.credits
                }
                onClick={() =>
                  setConfirm({
                    path: "/api/v1/ships/purchase",
                    payload: { classSlug: definition.slug },
                    label: `${definition.name} purchased`,
                    title: `Confirm ${definition.name} purchase`,
                    body: `Purchase for ${definition.credits.toLocaleString()} credits? Base capacity: ${definition.cargoCapacity} cargo and ${definition.fuel} fuel.`,
                  })
                }
              >
                Purchase · {definition.credits.toLocaleString()} cr
              </Button>
            </Card>
          ))}
        </ResponsiveGrid>
      </Panel>
      <ConfirmWindow
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm)
            void action(confirm.path, confirm.payload, confirm.label);
          setConfirm(null);
        }}
        title={confirm?.title ?? "Confirm change"}
        confirmLabel="Confirm"
      >
        <p>{confirm?.body}</p>
      </ConfirmWindow>
    </div>
  );
}
export function LegacyShipsPage({
  ships,
  crew,
  expeditions,
  cooldowns,
  marketplace,
  station,
  me,
  action,
}: Pick<
  GameData,
  | "ships"
  | "crew"
  | "expeditions"
  | "cooldowns"
  | "marketplace"
  | "station"
  | "me"
  | "action"
>) {
  const [renameNames, setRenameNames] = useState<Record<string, string>>({});
  const fleetCapacity = Math.max(1, Math.floor(crew.length / 2));
  const canAddShip = ships.length < fleetCapacity;
  const shipyardActive =
    station?.modules.find((module) => module.slug === "shipyard")?.state ===
    "active";
  const deployedShipIds = new Set(
    expeditions
      .filter((expedition) => expedition.status === "active")
      .map((expedition) => expedition.shipId),
  );
  const renameCredits = marketplace?.ships.renameCredits ?? 100;
  return (
    <div className="page-stack">
      <SectionTitle
        eyebrow="FLEET REGISTRY"
        title="Ships"
        description="Condition, fuel, cargo, and crew-supported fleet capacity."
        icon="expedition"
        action={
          <Badge tone={canAddShip ? "success" : "warning"}>
            {ships.length}/{fleetCapacity} SLOTS
          </Badge>
        }
      />
      <ResponsiveGrid min="19rem">
        {ships.map((ship) => (
          <Card key={ship.id} className="ship-card">
            <div className="ship-card__schematic">
              {<FleetShipArtwork ship={ship} />}
              <span className="nw-numeric">{ship.classSlug}</span>
            </div>
            <div className="ship-card__head">
              <h3>{ship.name}</h3>
              <Badge tone={toneForValue(ship.condition)}>
                {ship.condition}% condition
              </Badge>
            </div>
            <HealthBar label="Hull condition" value={ship.condition} />
            <div className="ship-card__stats">
              <StatusDisplay
                compact
                label="Cargo"
                value={ship.cargoCapacity}
                icon="cargo"
                tone="info"
              />
              <StatusDisplay
                compact
                label="Fuel"
                value={ship.fuel}
                icon="fuel"
                tone="purple"
              />
            </div>
            <div className="inline-actions">
              <Button
                size="sm"
                onClick={() =>
                  void action(
                    `/api/v1/ships/${ship.id}/refuel`,
                    { cells: 1 },
                    "Ship refueled",
                  )
                }
              >
                Use fuel cell
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={ship.condition >= 100}
                onClick={() =>
                  void action(
                    `/api/v1/ships/${ship.id}/repair`,
                    { amount: Math.min(10, 100 - ship.condition) },
                    "Ship repaired",
                  )
                }
              >
                Repair hull
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void action(
                    `/api/v1/ships/${ship.id}/upgrade`,
                    { slug: "expanded-hold" },
                    "Cargo upgrade installed",
                  )
                }
              >
                Upgrade hold
              </Button>
            </div>
          </Card>
        ))}
      </ResponsiveGrid>
      {!!ships.length && (
        <Panel>
          <SectionTitle
            eyebrow="SHIP REGISTRY"
            title="Rename Registered Ships"
            description={`Registry changes cost ${renameCredits.toLocaleString()} credits. Ships currently deployed cannot be renamed.`}
            icon="data"
          />
          <div className="side-stack">
            {ships.map((ship) => {
              const name = renameNames[ship.id] ?? ship.name;
              const deployed = deployedShipIds.has(ship.id);
              const invalid =
                name.trim().length < 2 ||
                name.trim().length > 40 ||
                name.trim() === ship.name;
              return (
                <Card key={ship.id}>
                  <div className="ship-card__head">
                    <h3>{ship.name}</h3>
                    <Badge tone={deployed ? "warning" : "success"}>
                      {deployed ? "Deployed" : "In dock"}
                    </Badge>
                  </div>
                  <Field label="New registry name">
                    <div className="inline-actions">
                      <Input
                        value={name}
                        maxLength={40}
                        disabled={deployed}
                        onChange={(event) =>
                          setRenameNames((current) => ({
                            ...current,
                            [ship.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        disabled={
                          deployed ||
                          invalid ||
                          (me.player?.credits ?? 0) < renameCredits
                        }
                        onClick={() =>
                          void action(
                            `/api/v1/ships/${ship.id}/rename`,
                            { name: name.trim() },
                            `${ship.name} renamed`,
                          )
                        }
                      >
                        Rename · {renameCredits} cr
                      </Button>
                    </div>
                  </Field>
                </Card>
              );
            })}
          </div>
        </Panel>
      )}
      {!!ships.length && (
        <Panel>
          <SectionTitle
            eyebrow="UPGRADE CATALOG"
            title="Ship Upgrade Statistics"
            description={`Base repairs cost ${marketplace?.ships.repair.creditsPerCondition ?? 8} credits per condition plus ${marketplace?.ships.repair.alloysPerTwentyCondition ?? 1} alloy per 20 condition before career and Shipyard discounts.`}
            icon="data"
          />
          <ResponsiveGrid min="17rem">
            {marketplace?.ships.upgrades.map((upgrade) => (
              <Card key={upgrade.slug}>
                <h3>{upgrade.name}</h3>
                <p>{upgrade.description}</p>
                <div className="material-readout">
                  <span>Install cost</span>
                  <strong>
                    {upgrade.credits.toLocaleString()} cr
                    {upgrade.alloys ? ` · ${upgrade.alloys} alloys` : ""}
                    {upgrade.electronics
                      ? ` · ${upgrade.electronics} electronics`
                      : ""}
                  </strong>
                </div>
                <div className="trait-list">
                  {ships.map((ship) => (
                    <Button
                      key={ship.id}
                      size="sm"
                      variant="ghost"
                      disabled={ship.upgrades.includes(upgrade.slug)}
                      onClick={() =>
                        void action(
                          `/api/v1/ships/${ship.id}/upgrade`,
                          { slug: upgrade.slug },
                          `${upgrade.name} installed`,
                        )
                      }
                    >
                      {ship.name} ·{" "}
                      {ship.upgrades.includes(upgrade.slug)
                        ? "installed"
                        : "install"}
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
          </ResponsiveGrid>
        </Panel>
      )}
      <PremiumSkinsPanel
        ships={ships}
        expeditions={expeditions}
        cooldowns={cooldowns}
        marketplace={marketplace}
        me={me}
        action={action}
      />
      {!ships.length && (
        <Notification title="No registered craft" tone="info">
          The fleet registry is currently empty.
        </Notification>
      )}
      <Panel tone="purple">
        <SectionTitle
          eyebrow="SHIP BROKER"
          title="Expand the Fleet"
          description="Each registered ship requires two recruited crew. Purchases require an active Marketplace and Shipyard."
          icon="trade"
        />
        <ResponsiveGrid min="13rem">
          <StatusDisplay
            label="Credits"
            value={me.player?.credits ?? 0}
            unit=" cr"
            icon="credits"
            tone="success"
          />
          <StatusDisplay
            label="Crew"
            value={crew.length}
            icon="crew"
            tone="info"
          />
          <StatusDisplay
            label="Fleet Capacity"
            value={fleetCapacity}
            icon="expedition"
            tone="purple"
          />
        </ResponsiveGrid>
        {!marketplace?.unlocked && (
          <Notification title="Marketplace offline" tone="warning">
            Repair the Marketplace module in the Build menu before buying ships.
          </Notification>
        )}
        {!shipyardActive && (
          <Notification title="Shipyard offline" tone="warning">
            Complete the Shipyard module before buying ships.
          </Notification>
        )}
        <div className="inline-actions">
          <Button
            disabled={
              !canAddShip ||
              !marketplace?.unlocked ||
              !shipyardActive ||
              (me.player?.credits ?? 0) < 1200
            }
            onClick={() =>
              void action(
                "/api/v1/ships/purchase",
                { classSlug: "salvage-skiff" },
                "Salvage Skiff purchased",
              )
            }
          >
            Buy Salvage Skiff · 1,200 cr
          </Button>
          <Button
            variant="ghost"
            disabled={
              !canAddShip ||
              !marketplace?.unlocked ||
              !shipyardActive ||
              (me.player?.credits ?? 0) < 2200
            }
            onClick={() =>
              void action(
                "/api/v1/ships/purchase",
                { classSlug: "cargo-hauler" },
                "Cargo Hauler purchased",
              )
            }
          >
            Buy Cargo Hauler · 2,200 cr
          </Button>
        </div>
        {!canAddShip && (
          <p>
            Recruit {Math.max(0, (ships.length + 1) * 2 - crew.length)} more
            crew to open the next fleet slot.
          </p>
        )}
      </Panel>
    </div>
  );
}
function PremiumSkinsPanel({
  ships,
  expeditions,
  cooldowns,
  marketplace,
  me,
  action,
}: Pick<
  GameData,
  "ships" | "expeditions" | "cooldowns" | "marketplace" | "me" | "action"
>) {
  const [choice, setChoice] = useState<{
    ship: Ship;
    skin: Marketplace["ships"]["skins"][number];
  } | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const deployed = new Set(
    expeditions
      .filter((expedition) => expedition.status === "active")
      .map((expedition) => expedition.shipId),
  );
  if (!marketplace?.ships.skins.length) return null;
  return (
    <Panel tone="purple">
      <SectionTitle
        eyebrow="PREMIUM FRAME LICENSES"
        title="Ship Skins & Specialized Statistics"
        description="Permanent licenses cost 25,000 credits. Every equip locks that ship's frame controls for 30 days."
        icon="expedition"
      />
      <Notification title="Massive cooldown — confirm carefully" tone="warning">
        The 30-day cooldown begins immediately and cannot be bypassed. Bonuses
        stack with installed upgrades. A purchased license remains owned, but
        equipping an owned skin still starts the cooldown.
      </Notification>
      <ResponsiveGrid min="20rem">
        {marketplace.ships.skins.map((skin) => (
          <Card key={skin.slug} className="skin-card">
            <GameArtwork
              src={`/ships/skins/${skin.slug}.webp`}
              alt={`${skin.name} premium ${skin.classSlug} skin`}
              sizes="(max-width: 760px) 88vw, 30rem"
            />
            <div className="ship-card__head">
              <h3>{skin.name}</h3>
              <Badge tone="purple">{skin.credits.toLocaleString()} cr</Badge>
            </div>
            <p>{skin.description}</p>
            <div className="trait-list">
              {skin.cargoBonus ? (
                <Pill tone="info">+{skin.cargoBonus} cargo</Pill>
              ) : null}
              {skin.fuelDiscount ? (
                <Pill tone="purple">−{skin.fuelDiscount} expedition fuel</Pill>
              ) : null}
              {skin.repairDiscount ? (
                <Pill tone="success">
                  −{Math.round(skin.repairDiscount * 100)}% repair cost
                </Pill>
              ) : null}
              {skin.lootRollBonus ? (
                <Pill tone="info">+{skin.lootRollBonus} loot roll</Pill>
              ) : null}
              {skin.successBonus ? (
                <Pill tone="success">
                  +{Math.round(skin.successBonus * 100)}% success
                </Pill>
              ) : null}
            </div>
            <div className="side-stack">
              {ships
                .filter((ship) => ship.classSlug === skin.classSlug)
                .map((ship) => {
                  const owned = ship.ownedSkins.includes(skin.slug);
                  const active = ship.activeSkin === skin.slug;
                  const busy = deployed.has(ship.id);
                  const remaining = cooldownRemaining(
                    cooldowns,
                    `ship-skin:${ship.id}`,
                    now,
                  );
                  return (
                    <Button
                      key={ship.id}
                      size="sm"
                      variant={owned ? "ghost" : "primary"}
                      disabled={
                        active ||
                        busy ||
                        remaining > 0 ||
                        (!owned && (me.player?.credits ?? 0) < skin.credits)
                      }
                      onClick={() => setChoice({ ship, skin })}
                    >
                      {ship.name} ·{" "}
                      {active
                        ? "active"
                        : busy
                          ? "deployed"
                          : remaining > 0
                            ? `locked ${formatCountdown(remaining)}`
                            : owned
                              ? "equip owned"
                              : `license ${skin.credits.toLocaleString()} cr`}
                    </Button>
                  );
                })}
            </div>
          </Card>
        ))}
      </ResponsiveGrid>
      <ConfirmWindow
        open={Boolean(choice)}
        onClose={() => setChoice(null)}
        onConfirm={() => {
          if (choice)
            void action(
              `/api/v1/ships/${choice.ship.id}/skin`,
              { skinSlug: choice.skin.slug },
              `${choice.skin.name} frame equipped`,
            );
          setChoice(null);
        }}
        title="Confirm 30-day frame lock"
        confirmLabel={
          choice?.ship.ownedSkins.includes(choice.skin.slug)
            ? "Equip and lock 30 days"
            : `Spend ${choice?.skin.credits.toLocaleString() ?? "25,000"} credits`
        }
      >
        <p>
          <strong>{choice?.skin.name}</strong> will be installed on{" "}
          <strong>{choice?.ship.name}</strong>. This immediately starts a 30-day
          per-ship cooldown. No other skin can be equipped on this ship until it
          expires.
        </p>
      </ConfirmWindow>
    </Panel>
  );
}
export function CrewPage({ crew, crewCandidates, action }: Pick<GameData, "crew" | "crewCandidates" | "action">) {
  const [recruitName, setRecruitName] = useState("Nova");
  const [recruitRole, setRecruitRole] = useState("engineer");
  const [recruitOpen, setRecruitOpen] = useState(false);
  const [retiringCrew, setRetiringCrew] = useState<(typeof crew)[number] | null>(null);
  const [portraitCrew, setPortraitCrew] = useState<(typeof crew)[number] | null>(null);
  const [now, setNow] = useState(Date.now());
  const choosePortrait = (portraitKey: string | null) => {
    if (!portraitCrew) return;
    void action(`/api/v1/crew/${portraitCrew.id}/portrait`, { portraitKey }, portraitKey ? "Crew portrait updated" : "Crew portrait cleared");
    setPortraitCrew(null);
  };
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="page-stack crew-console">
      <section className="crew-console__masthead">
        <div>
          <span className="nw-eyebrow">PERSONNEL NETWORK // CREW DECK</span>
          <h2>Build / Crew</h2>
          <p>
            Assign specialists, monitor morale, and develop job certification
            without changing existing training rules.
          </p>
        </div>
        <div className="crew-console__readiness">
          <NWIcon name="crew" size={28} />
          <div>
            <span>Active Personnel</span>
            <strong className="nw-numeric">{crew.length}</strong>
          </div>
        </div>
      </section>
      <SectionTitle
        eyebrow="CREW ROSTER"
        title="Station Personnel"
        description="Role, level, morale, and trait telemetry from the station crew service."
        icon="crew"
        action={<Button onClick={() => setRecruitOpen(true)}>Recruit crew</Button>}
      />
      <ResponsiveGrid min="18rem" className="crew-roster-grid">
        {crew.map((member) => {
          const exhaustion = member.injuredUntil
            ? Date.parse(member.injuredUntil) - now
            : 0;
          const cost = member.level * 250;
          const portraitUrl = crewPortraitUrl(member.portraitKey);
          const jobBenefit =
            member.role === "pilot"
              ? "+1% expedition success per job star"
              : member.role === "engineer"
                ? "3 job stars: −1 expedition fuel"
                : member.role === "quartermaster"
                  ? "4 job stars: +1 expedition loot roll"
                  : member.role === "scout"
                    ? "+0.6% expedition success per job star"
                    : member.role === "medic"
                      ? "Improves field readiness"
                      : "+0.2% expedition success per talent star";
          const talentBenefit =
            member.role === "medic"
              ? "−8% injury recovery time per talent star"
              : member.role === "scout"
                ? "+0.8% expedition success per talent star"
                : member.role === "pilot"
                  ? "+0.4% expedition success per talent star"
                  : "+0.2% expedition success per talent star";
          return (
            <Card key={member.id} className="crew-card">
              <div className="crew-card__identity">
                <div className={`crew-ident ${portraitUrl ? "crew-ident--portrait" : ""}`}>
                  {portraitUrl ? (
                    <img src={portraitUrl} alt={`${member.name} crew portrait`} />
                  ) : (
                    member.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3>{member.name}</h3>
                  <p>
                    {member.role} · Level {member.level}
                  </p>
                </div>
                <Badge
                  tone={
                    exhaustion > 0 ? "warning" : toneForValue(member.morale)
                  }
                >
                  {exhaustion > 0
                    ? `Resting ${formatCountdown(exhaustion)}`
                    : `${member.morale}% morale`}
                </Badge>
              </div>
              <ProgressBar
                label="Morale"
                value={member.morale}
                tone={toneForValue(member.morale)}
              />
              <ProgressBar
                label="Fatigue"
                value={member.fatigue}
                tone={member.fatigue >= 80 ? "danger" : member.fatigue >= 50 ? "warning" : "info"}
              />
              <div className="trait-list">
                <Pill tone="purple">{member.specialty} specialist</Pill>
                {member.assignment ? <Pill tone="info">Assigned: {member.assignment}</Pill> : null}
              </div>
              <div className="crew-rating">
                <div>
                  <span>Job certification</span>
                  <strong aria-label={`${member.jobStars} of 5 job stars`}>
                    {formatCrewStars(member.jobStars)}
                  </strong>
                  <small>{jobBenefit}</small>
                </div>
                <div>
                  <span>Talent</span>
                  <strong
                    aria-label={`${member.talentStars} of 5 talent stars`}
                  >
                    {formatCrewStars(member.talentStars)}
                  </strong>
                  <small>{talentBenefit}</small>
                </div>
              </div>
              <div className="trait-list">
                {member.traits?.map((trait: string) => (
                  <Pill key={trait} tone="neutral">
                    {trait}
                  </Pill>
                ))}
              </div>
              <div className="inline-actions">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={exhaustion > 0 || member.jobStars >= 5}
                  onClick={() =>
                    void action(
                      `/api/v1/crew/${member.id}/train`,
                      { focus: "job" },
                      "Job certification improved",
                    )
                  }
                >
                  {exhaustion > 0
                    ? `Available in ${formatCountdown(exhaustion)}`
                    : member.jobStars >= 5
                      ? "Job maxed"
                      : `Train job · ${cost.toLocaleString()} cr`}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={exhaustion > 0 || member.talentStars >= 5}
                  onClick={() =>
                    void action(
                      `/api/v1/crew/${member.id}/train`,
                      { focus: "talent" },
                      "Talent improved",
                    )
                  }
                >
                  {exhaustion > 0
                    ? "Resting"
                    : member.talentStars >= 5
                      ? "Talent maxed"
                      : `Train talent · ${cost.toLocaleString()} cr`}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPortraitCrew(member)}>
                  Portrait
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRetiringCrew(member)}>
                  Retire
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={exhaustion > 0 || (member.fatigue <= 0 && member.morale >= 100)}
                  onClick={() => void action(`/api/v1/crew/${member.id}/shore-leave`, undefined, "Shore leave scheduled")}
                >
                  Shore leave · 150 cr
                </Button>
              </div>
              <Field label="Station assignment">
                <Select
                  value={member.assignment ?? ""}
                  disabled={exhaustion > 0}
                  onChange={(event) => void action(`/api/v1/crew/${member.id}/assignment`, { assignment: event.target.value || null }, "Crew assignment updated")}
                >
                  <option value="">Expedition reserve</option>
                  <option value="shipyard">Shipyard duty</option>
                  <option value="refinery">Refinery duty</option>
                  <option value="quarters">Quarters support</option>
                </Select>
              </Field>
            </Card>
          );
        })}
      </ResponsiveGrid>
      {!crew.length && (
        <Notification title="No crew records" tone="info">
          Personnel data has not yet been assigned to this station.
        </Notification>
      )}
      <Modal
        open={recruitOpen}
        onClose={() => setRecruitOpen(false)}
        title="Recruit crew member"
        description="Choose a name and station role. Recruitment costs 400 credits."
        footer={<><Button variant="ghost" onClick={() => setRecruitOpen(false)}>Cancel</Button><Button disabled={recruitName.trim().length < 2} onClick={() => { void action("/api/v1/crew/recruit", { name: recruitName, role: recruitRole }, "Crew recruited"); setRecruitOpen(false); }}>Recruit for 400 credits</Button></>}
      >
        <div className="crew-recruitment-panel">
        {crewCandidates?.candidates.map((candidate) => (
          <Card key={candidate.id}>
            <Badge tone="purple">{candidate.specialty}</Badge>
            <h3>{candidate.name}</h3>
            <p>{candidate.role} · {candidate.traits.join(", ")}</p>
            <small>{candidate.description}</small>
            <Button fullWidth onClick={() => { void action("/api/v1/crew/recruit", { candidateId: candidate.id }, `${candidate.name} recruited`); setRecruitOpen(false); }}>
              Recruit candidate · {crewCandidates.recruitCredits} cr
            </Button>
          </Card>
        ))}
        <Notification title="Direct recruitment" tone="info">
          Rotating candidates carry specialties and traits. Direct recruits remain available as dependable generalists.
        </Notification>
        <Field label="Crew name">
          <Input
            value={recruitName}
            onChange={(event) => setRecruitName(event.target.value)}
          />
        </Field>
        <Field label="Role">
          <Select
            value={recruitRole}
            onChange={(event) => setRecruitRole(event.target.value)}
          >
            <option value="pilot">Pilot</option>
            <option value="engineer">Engineer</option>
            <option value="medic">Medic</option>
            <option value="scout">Scout</option>
            <option value="quartermaster">Quartermaster</option>
          </Select>
        </Field>
        </div>
      </Modal>
      <Modal
        open={Boolean(portraitCrew)}
        onClose={() => setPortraitCrew(null)}
        title={`Choose portrait for ${portraitCrew?.name ?? "crew member"}`}
        description="Portraits are PNG assets packaged with the game. Selecting one changes only this crew member."
        size="lg"
      >
        <div className="crew-portrait-picker">
          <button
            type="button"
            className={`crew-portrait-option ${portraitCrew?.portraitKey ? "" : "is-selected"}`}
            aria-pressed={!portraitCrew?.portraitKey}
            onClick={() => choosePortrait(null)}
          >
            <span className="crew-portrait-option__initials">
              {portraitCrew?.name.slice(0, 2).toUpperCase() ?? "--"}
            </span>
            <strong>Default initials</strong>
          </button>
          {crewPortraits.map((portrait) => (
            <button
              key={portrait.key}
              type="button"
              className={`crew-portrait-option ${portraitCrew?.portraitKey === portrait.key ? "is-selected" : ""}`}
              aria-pressed={portraitCrew?.portraitKey === portrait.key}
              onClick={() => choosePortrait(portrait.key)}
            >
              <img src={portrait.url} alt={`${portrait.label} portrait option`} />
              <strong>{portrait.label}</strong>
            </button>
          ))}
        </div>
        {!crewPortraits.length && (
          <Notification title="No crew portraits installed" tone="info">
            Add PNG files to apps/web/src/assets/crew-portraits, then rebuild and deploy the web app.
          </Notification>
        )}
      </Modal>
      <ConfirmWindow
        open={Boolean(retiringCrew)}
        onClose={() => setRetiringCrew(null)}
        onConfirm={() => {
          if (retiringCrew) void action(`/api/v1/crew/${retiringCrew.id}/retire`, undefined, "Crew member retired");
          setRetiringCrew(null);
        }}
        title={`Retire ${retiringCrew?.name ?? "crew member"}?`}
        confirmLabel="Retire from roster"
        tone="danger"
      >
        <p>This permanently frees a roster slot. Crew assigned to an active expedition cannot retire.</p>
      </ConfirmWindow>
    </div>
  );
}
export function ExpeditionPage({
  expeditions,
  expeditionDefinitions,
  ships,
  crew,
  action,
}: Pick<
  GameData,
  "expeditions" | "expeditionDefinitions" | "ships" | "crew" | "action"
>) {
  const activeShipIds = new Set(
    expeditions
      .filter((expedition) => expedition.status === "active")
      .map((expedition) => expedition.shipId),
  );
  const availableShips = ships.filter((ship) => !activeShipIds.has(ship.id));
  const [shipId, setShipId] = useState(availableShips[0]?.id ?? "");
  const activeCrewIds = new Set(
    expeditions
      .filter((expedition) => expedition.status === "active")
      .flatMap((expedition) => expedition.crewIds ?? []),
  );
  const availableCrew = crew.filter(
    (member) =>
      !activeCrewIds.has(member.id) &&
      !member.assignment &&
      member.fatigue < 80 &&
      (!member.injuredUntil || Date.parse(member.injuredUntil) <= Date.now()),
  );
  const [crewIds, setCrewIds] = useState<string[]>(
    availableCrew.slice(0, 3).map((member) => member.id),
  );
  const [now, setNow] = useState(Date.now());
  const [lootInfo, setLootInfo] = useState<ExpeditionDefinition | null>(null);
  const [selectedMission, setSelectedMission] = useState<ExpeditionDefinition | null>(null);
  const [route, setRoute] = useState<"safe" | "balanced" | "bold">("balanced");
  useEffect(() => {
    if (!availableShips.some((ship) => ship.id === shipId))
      setShipId(availableShips[0]?.id ?? "");
  }, [shipId, ships, expeditions]);
  useEffect(() => {
    setCrewIds((current) =>
      current.filter(
        (id) =>
          !activeCrewIds.has(id) &&
          crew.some(
            (member) =>
              member.id === id &&
              (!member.injuredUntil ||
                Date.parse(member.injuredUntil) <= Date.now()),
          ),
      ),
    );
  }, [expeditions, crew]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const selectedShip = availableShips.find((ship) => ship.id === shipId);
  const crewLimit = selectedShip?.classSlug === "command-cruiser" ? 5 : 4;
  const toggleCrew = (id: string) =>
    setCrewIds((current) =>
      current.includes(id)
        ? current.filter((candidate) => candidate !== id)
        : [...current, id].slice(0, crewLimit),
    );
  const launch = (definition: string) =>
    action(
      "/api/v1/expeditions/launch",
      { definition, shipId: shipId || undefined, crewIds, route },
      "Expedition launched",
    );
  return (
    <div className="page-stack expedition-console">
      <section className="expedition-console__masthead">
        <div>
          <span className="nw-eyebrow">DEEP FIELD // EXPEDITION CONTROL</span>
          <h2>Mission Deployment</h2>
          <p>
            Load a ship, assign available crew, and launch existing expedition
            definitions through the authoritative worker pipeline.
          </p>
        </div>
        <div className="expedition-console__readiness">
          <span>Available Frames</span>
          <strong className="nw-numeric">{availableShips.length}</strong>
          <small>{availableCrew.length} crew ready</small>
        </div>
      </section>
      <SectionTitle
        eyebrow="MISSION CATALOG"
        title="Expeditions"
        description="Select a server-defined mission profile and review its risk envelope."
        icon="expedition"
      />
      <ResponsiveGrid
        min="18rem"
        className="expedition-launchers expedition-card-grid"
      >
        {expeditionDefinitions.map((definition) => {
          return (
            <Card
              key={definition.slug}
              tone={
                definition.risk === "extreme" || definition.risk === "high"
                  ? "purple"
                  : undefined
              }
            >
              <div className="inline-actions">
                <NWIcon
                  name={
                    definition.risk === "high" || definition.risk === "extreme"
                      ? "signal"
                      : "expedition"
                  }
                  size={24}
                />
                <Badge tone={riskTone(definition.risk)}>
                  {definition.risk} risk
                </Badge>
              </div>
              <h3>{definition.name}</h3>
              <p>{definition.description}</p>
              <div className="trait-list">
                <Pill tone="purple">{definition.fuelCost} fuel</Pill>
                <Pill tone="neutral">{definition.minCrew} crew</Pill>
                <Pill tone="neutral">
                  {definition.durationMinutes[0]}–
                  {definition.durationMinutes[1]} min
                </Pill>
              </div>
              <div className="inline-actions">
                <Button
                  size="sm"
                  disabled={!availableShips.length}
                  onClick={() => setSelectedMission(definition)}
                >
                  Configure launch
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLootInfo(definition)}
                >
                  Loot info
                </Button>
              </div>
            </Card>
          );
        })}
      </ResponsiveGrid>
      <Modal
        open={Boolean(selectedMission)}
        onClose={() => setSelectedMission(null)}
        title={selectedMission ? `Launch ${selectedMission.name}` : "Mission loadout"}
        description="Assign an available ship and crew, then launch from this window."
        size="lg"
        footer={<><Button variant="ghost" onClick={() => setSelectedMission(null)}>Cancel</Button><Button disabled={!selectedMission || !selectedShip || selectedShip.fuel < selectedMission.fuelCost || crewIds.length < selectedMission.minCrew} onClick={() => { if (selectedMission) void launch(selectedMission.slug); setSelectedMission(null); }}>Launch expedition</Button></>}
      >
        <div className="expedition-loadout-panel">
        <Field label="Available ship">
          <Select
            value={shipId}
            disabled={!availableShips.length}
            onChange={(event) => setShipId(event.target.value)}
          >
            {!availableShips.length && (
              <option value="">All ships deployed</option>
            )}
            {availableShips.map((ship) => (
              <option key={ship.id} value={ship.id}>
                {ship.name} · {ship.fuel} fuel
              </option>
            ))}
          </Select>
        </Field>
        <div className="trait-list">
          {crew.map((member) => {
            const busy = activeCrewIds.has(member.id);
            const resting = Boolean(
              member.injuredUntil && Date.parse(member.injuredUntil) > now,
            );
            const unavailable = resting || member.fatigue >= 80 || Boolean(member.assignment);
            return (
              <Button
                key={member.id}
                size="sm"
                disabled={busy || unavailable}
                variant={crewIds.includes(member.id) ? "primary" : "ghost"}
                onClick={() => toggleCrew(member.id)}
              >
                {member.name} ·{" "}
                {busy
                  ? "deployed"
                  : member.assignment
                    ? `assigned ${member.assignment}`
                    : member.fatigue >= 80
                      ? `fatigued ${member.fatigue}%`
                  : resting
                    ? `resting ${formatCountdown(Date.parse(member.injuredUntil!) - now)}`
                    : member.role}
              </Button>
            );
          })}
        </div>
        <p>
          {crewIds.length} crew assigned. Deployed ships and crew are excluded;
          up to {crewLimit} crew may deploy on this frame.
        </p>
        <Field label="Mission route">
          <Select value={route} onChange={(event) => setRoute(event.target.value as "safe" | "balanced" | "bold")}>
            <option value="safe">Safe · +5% success, one fewer bonus roll</option>
            <option value="balanced">Balanced · standard risk and recovery</option>
            <option value="bold">Bold · −6% success, one extra recovery roll</option>
          </Select>
        </Field>
          {selectedMission && <div className="trait-list"><Pill tone="purple">{selectedMission.fuelCost} fuel required</Pill><Pill tone="neutral">{selectedMission.minCrew} crew required</Pill></div>}
        </div>
      </Modal>
      <Panel className="expedition-ledger-panel">
        <SectionTitle
          eyebrow="MISSION LEDGER"
          title="Deployment History"
          icon="archive"
        />
        <DataGrid
          rows={expeditions ?? []}
          getRowKey={(expedition) => expedition.id}
          empty="No expeditions have been launched."
          columns={[
            {
              key: "name",
              header: "Mission",
              render: (expedition) => <strong>{expedition.name}</strong>,
            },
            {
              key: "status",
              header: "Status",
              render: (expedition) => (
                <Badge tone={expeditionTone(expedition.status)}>
                  {expedition.status}
                </Badge>
              ),
            },
            {
              key: "return",
              header: "Return",
              render: (expedition) =>
                expedition.status === "active" && expedition.resolvesAt ? (
                  <span className="nw-numeric">
                    {formatCountdown(Date.parse(expedition.resolvesAt) - now)}
                  </span>
                ) : (
                  <span className="nw-numeric">—</span>
                ),
            },
            {
              key: "log",
              header: "Mission stages",
              render: (expedition) =>
                expedition.stages?.length
                  ? expedition.stages.map(stage => `${stage.name}: ${stage.status}`).join(" · ")
                  : expedition.incidentLog?.join(" ") || "Awaiting telemetry",
            },
            {
              key: "action",
              header: "Command",
              align: "right",
              render: (expedition) =>
                ["resolved", "failed"].includes(expedition.status) ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      void action(
                        `/api/v1/expeditions/${expedition.id}/claim`,
                        undefined,
                        "Expedition claimed",
                      )
                    }
                  >
                    Claim
                  </Button>
                ) : (
                  <span className="nw-numeric">LOCKED</span>
                ),
            },
          ]}
        />
      </Panel>
      <ConfirmWindow
        open={Boolean(lootInfo)}
        onClose={() => setLootInfo(null)}
        onConfirm={() => setLootInfo(null)}
        title={`${lootInfo?.name ?? "Expedition"} loot statistics`}
        confirmLabel="Close"
      >
        <p>
          {lootInfo
            ? `${Math.round(lootInfo.successChance * 100)}% mission success · ${lootInfo.lootRolls} weighted loot rolls · ${lootInfo.rewardQuantity[0]}–${lootInfo.rewardQuantity[1]} units per roll. Success base: ${lootInfo.baseRewards.success}. Failure base: ${lootInfo.baseRewards.failure}.`
            : ""}
        </p>
        <div className="trait-list">
          {lootInfo?.lootPool.map((item) => (
            <Pill key={item.slug} tone={rarityTone(item.rarity)}>
              {item.name} · {item.rarity} ·{" "}
              {(item.chancePerRoll * 100).toFixed(1)}%/roll
            </Pill>
          ))}
        </div>
      </ConfirmWindow>
    </div>
  );
}
