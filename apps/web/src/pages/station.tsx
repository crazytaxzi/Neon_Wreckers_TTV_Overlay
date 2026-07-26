import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  ConfirmWindow,
  Field,
  HealthBar,
  Modal,
  ModuleCard,
  Notification,
  NWIcon,
  Panel,
  ProgressBar,
  ResponsiveGrid,
  SectionTitle,
  Select,
  ToggleSwitch,
  Tooltip,
} from "@neon-wreckers/ui";
import { GameArtwork } from "../components/GameArtwork.js";
import type { GameData, Wreck } from "../model.js";
import {
  CommandAction,
  formatCountdown,
  cooldownRemaining,
  toneForValue,
  riskTone,
  moduleIcon,
  moduleEffectDescription,
  itemIcon,
} from "../page-utils.js";

export function GuidePage({
  onNavigate,
}: {
  onNavigate: (destination: string) => void;
}) {
  const quickStart = [
    {
      number: "01",
      icon: "salvage",
      title: "Recover a wreck",
      body: "Open Salvage, scan the active wreck, then choose Cutters for dependable scrap or Cargo Teams for more wreck-specific loot.",
      action: "Open Salvage",
      destination: "salvage",
    },
    {
      number: "02",
      icon: "inventory",
      title: "Check your hold",
      body: "Recovered materials land in your Cargo Hold. Inspect their sources, uses, recipes, rarity, and guide value before spending or selling.",
      action: "Open Cargo Hold",
      destination: "inventory",
    },
    {
      number: "03",
      icon: "construction",
      title: "Strengthen Station Zero",
      body: "Contribute materials to station projects, restore critical systems, and keep power, integrity, food, medicine, and morale out of danger.",
      action: "Open Station",
      destination: "construction",
    },
    {
      number: "04",
      icon: "crew",
      title: "Prepare a crew",
      body: "Recruit specialists, train job and talent ratings, use shore leave to reduce fatigue, and keep expedition crew in reserve.",
      action: "Open Crew",
      destination: "crew",
    },
    {
      number: "05",
      icon: "expedition",
      title: "Launch an expedition",
      body: "Choose a fueled, repaired ship and rested crew. Compare risk, fuel cost, duration, route bonuses, and possible rewards before launch.",
      action: "Open Expeditions",
      destination: "expeditions",
    },
  ] as const;

  const systems = [
    {
      icon: "salvage",
      title: "Salvage & cooldowns",
      points: [
        "Every wreck has its own risk, integrity, remaining loot budget, and loot pool.",
        "Cutters favor reliable recovery. Cargo Teams make additional wreck-loot rolls.",
        "Actions can have cooldowns. The countdown beside a disabled control shows when it is ready.",
      ],
    },
    {
      icon: "crew",
      title: "Crew readiness",
      points: [
        "Job stars unlock role-specific expedition benefits; talent stars improve a crew member’s supporting bonus.",
        "Fatigue rises on launch and falls after resolution. Exhausted, injured, busy, or station-assigned crew cannot deploy.",
        "Shore leave costs credits but restores morale and reduces fatigue. Rotating specialist candidates refresh automatically.",
      ],
    },
    {
      icon: "expedition",
      title: "Ships & expeditions",
      points: [
        "Ships need fuel and condition. Class statistics, installed upgrades, skins, and crew roles affect outcomes.",
        "Ship mastery earned from claimed expeditions unlocks additional upgrade slots.",
        "An expedition resolves automatically; claim it afterward to collect rewards, mastery, history, and incident details.",
      ],
    },
    {
      icon: "resources",
      title: "Crafting & construction",
      points: [
        "Recipes require the listed materials and an unlocked station module. Fabrication time varies by recipe.",
        "Station projects are shared: every contribution advances the same community objective.",
        "Module levels unlock capacity and services; repairs protect completed infrastructure from collapse.",
      ],
    },
    {
      icon: "trade",
      title: "Credits & markets",
      points: [
        "The station market sells fixed stock. Player auctions run separately and expire after 48 hours.",
        "Guide value is a reference, not a guaranteed sale price. Check quantity and total price before confirming.",
        "Crafting, ship work, recruiting, training, shore leave, and premium frames all compete for your credits.",
      ],
    },
    {
      icon: "station",
      title: "Population & progression",
      points: [
        "Residents react to power, hull integrity, food, medicine, morale, and habitat capacity.",
        "Contracts, repeatable operations, seasonal collections, and museum donations provide longer-term goals.",
        "Your career and station prestige shape progression without replacing the shared survival objective.",
      ],
    },
  ] as const;

  const crewBriefings = [
    {
      icon: "crew",
      title: "Recruit and train",
      points: [
        "Open Crew and choose a rotating candidate, or enter a name and role. Recruitment costs 400 credits and your roster has a maximum size.",
        "Pilot, engineer, medic, scout, and quartermaster roles each provide different expedition advantages. Job stars strengthen the role benefit; talent stars improve the supporting bonus.",
        "Training job certification or talent costs credits. Injured or resting members cannot train until their timer clears.",
      ],
    },
    {
      icon: "construction",
      title: "Station assignments",
      points: [
        "Use the Station assignment selector on a crew card. Expedition reserve means the member is available for a launch.",
        "Shipyard duty reduces repair costs by 3% per assigned crew member, up to 15%. Refinery duty reduces crafting time by 3% per assigned member, up to 15%.",
        "Quarters support keeps a member stationed for habitat support. Any assigned member is unavailable for expeditions until you switch them back to Expedition reserve.",
      ],
    },
    {
      icon: "station",
      title: "Shore leave and recovery",
      points: [
        "Shore leave costs 150 credits, reduces fatigue by 60, restores 15 morale, and clears the member's station assignment.",
        "Each member has a six-hour shore-leave cooldown. Shore leave cannot be used while that crew member is deployed on an active expedition.",
        "Use it before a launch when fatigue is high. Crew at 80 or more fatigue cannot deploy; injured, busy, or assigned crew are also blocked.",
      ],
    },
  ] as const;

  return (
    <div className="page-stack concept-standard-page guide-console">
      <section className="guide-hero">
        <div className="guide-hero__copy">
          <span className="nw-eyebrow">STATION ZERO // FIELD MANUAL 2.0</span>
          <h1>From first wreck to fleet command</h1>
          <p>
            Neon Wreckers is a shared salvage-and-survival game. Recover
            materials, build your personal operation, and work with every
            Wrecker to keep Station Zero alive.
          </p>
          <div className="inline-actions">
            <Button onClick={() => onNavigate("salvage")}>Start salvaging</Button>
            <Button variant="ghost" onClick={() => onNavigate("station")}>
              Return home
            </Button>
          </div>
        </div>
        <div className="guide-hero__loop" aria-label="Core game loop">
          <span>Scan</span>
          <NWIcon name="salvage" size={26} />
          <span>Recover</span>
          <NWIcon name="resources" size={26} />
          <span>Build</span>
          <NWIcon name="expedition" size={26} />
          <span>Explore</span>
        </div>
      </section>

      <Notification title="The short version" tone="success">
        Salvage produces materials. Materials fund crafting, ships, and shared
        station projects. A prepared fleet reaches rarer resources. A healthy
        station keeps every player’s progression moving.
      </Notification>

      <section className="guide-section">
        <SectionTitle
          eyebrow="FIRST SHIFT"
          title="Your five-step quick start"
          description="Follow this route if you have just arrived or are returning after an update."
          icon="data"
        />
        <div className="guide-steps">
          {quickStart.map((step) => (
            <Card key={step.number} className="guide-step-card">
              <div className="guide-step-card__header">
                <span className="guide-step-card__number">{step.number}</span>
                <NWIcon name={step.icon} size={28} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate(step.destination)}
              >
                {step.action}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="guide-section">
        <SectionTitle
          eyebrow="SYSTEM BRIEFINGS"
          title="How the game fits together"
          description="The rules that matter before you commit resources or send a crew away."
          icon="signal"
        />
        <ResponsiveGrid min="20rem">
          {systems.map((system) => (
            <Card key={system.title} className="guide-system-card">
              <div className="guide-system-card__title">
                <NWIcon name={system.icon} size={26} />
                <h3>{system.title}</h3>
              </div>
              <ul>
                {system.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </Card>
          ))}
        </ResponsiveGrid>
      </section>

      <section className="guide-section">
        <SectionTitle
          eyebrow="CREW OPERATIONS"
          title="Assignment, readiness, and shore leave"
          description="Crew can work for the station or fly with your fleet, but they cannot do both at once."
          icon="crew"
        />
        <ResponsiveGrid min="20rem">
          {crewBriefings.map((briefing) => (
            <Card key={briefing.title} className="guide-system-card">
              <div className="guide-system-card__title">
                <NWIcon name={briefing.icon} size={26} />
                <h3>{briefing.title}</h3>
              </div>
              <ul>
                {briefing.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </Card>
          ))}
        </ResponsiveGrid>
      </section>

      <Panel className="guide-readiness">
        <SectionTitle
          eyebrow="PRE-FLIGHT CHECK"
          title="Before launching an expedition"
          icon="scanner"
        />
        <div className="guide-checklist">
          <span><Badge tone="success">1</Badge> Ship condition is above zero</span>
          <span><Badge tone="success">2</Badge> Fuel covers the displayed cost</span>
          <span><Badge tone="success">3</Badge> Crew meet the minimum and fatigue limit</span>
          <span><Badge tone="success">4</Badge> Crew are unassigned, uninjured, and not away</span>
          <span><Badge tone="success">5</Badge> The selected risk and route match your goal</span>
        </div>
        <Button onClick={() => onNavigate("expeditions")}>
          Review expedition board
        </Button>
      </Panel>

      <Panel>
        <SectionTitle
          eyebrow="COMMAND REFERENCE"
          title="Where to find everything"
          icon="network"
        />
        <div className="guide-destinations">
          {[
            ["Home", "Live station status and recommended actions", "station"],
            ["Salvage", "Scan wrecks and recover materials", "salvage"],
            ["Station", "Projects, survival systems, contracts, and seasons", "construction"],
            ["Market", "Station inventory and player auctions", "market"],
            ["Profile", "Career, identity, records, quarters, and settings", "profile"],
          ].map(([label, description, destination]) => (
            <button
              type="button"
              key={destination}
              className="guide-destination"
              onClick={() => onNavigate(destination)}
            >
              <strong>{label}</strong>
              <span>{description}</span>
              <NWIcon name="scanner" size={18} />
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function inventoryQuantity(game: Pick<GameData, "inventory">, slug: string) {
  return game.inventory.find((item) => item.itemSlug === slug)?.quantity ?? 0;
}

export function StationPage({
  station,
  wreck,
  inventory,
  history,
  cooldowns,
  action,
  ships,
  expeditions,
  notifications,
  me,
  onNavigate,
}: GameData & { onNavigate: (destination: string) => void }) {
  const activeExpedition =
    expeditions.find((expedition) => expedition.status === "active") ??
    expeditions[0] ??
    null;
  const activeShip =
    ships.find((ship) => ship.id === activeExpedition?.shipId) ??
    ships[0] ??
    null;
  const unreadNotifications = notifications.filter(
    (notification) => !notification.readAt,
  );
  const stationName = station?.name ?? "Station Zero";
  const resources = [
    {
      slug: "scrap",
      label: "Scrap",
      icon: "resources" as const,
      tone: "success" as const,
    },
    {
      slug: "electronics",
      label: "Electronics",
      icon: "data" as const,
      tone: "info" as const,
    },
    {
      slug: "alloys",
      label: "Alloys",
      icon: "integrity" as const,
      tone: "purple" as const,
    },
    {
      slug: "fuel",
      label: "Fuel",
      icon: "fuel" as const,
      tone: "warning" as const,
    },
  ];
  const quickActions = [
    {
      id: "salvage",
      label: "Scan Wreck",
      detail: "Acquire salvage target",
      icon: "scanner" as const,
      tone: "success",
    },
    {
      id: "construction",
      label: "Build Station",
      detail: "Modules and repairs",
      icon: "construction" as const,
      tone: "purple",
    },
    {
      id: "crew",
      label: "Manage Crew",
      detail: "Assignments and training",
      icon: "crew" as const,
      tone: "purple",
    },
    {
      id: "ships",
      label: "Fleet Registry",
      detail: "Repair and upgrade ships",
      icon: "expedition" as const,
      tone: "info",
    },
    {
      id: "crafting",
      label: "Craft Items",
      detail: "Refinery production",
      icon: "engineering" as const,
      tone: "purple",
    },
    {
      id: "market",
      label: "Open Market",
      detail: "Trade and auctions",
      icon: "trade" as const,
      tone: "success",
    },
  ];

  return (
    <div className="command-center-page">
      <div className="command-center-grid">
        <Panel depth="high" className="command-center-hero">
          <div className="command-center-hero__copy">
            <span className="concept-kicker">
              <NWIcon name="station" size={16} /> Command Center
            </span>
            <div className="command-center-hero__title">
              <div>
                <small>Station Overview</small>
                <h2>{stationName}</h2>
              </div>
              <Badge tone="purple">Tier {station?.level ?? 1}</Badge>
            </div>
            <p>
              Community salvage hub, orbital reconstruction yard, and persistent
              home of the Neon Wreckers.
            </p>
            <div className="command-center-vitals">
              <div>
                <span>Hull Integrity</span>
                <strong>{station?.integrity ?? 0}%</strong>
                <i>
                  <b style={{ width: `${station?.integrity ?? 0}%` }} />
                </i>
              </div>
              <div>
                <span>Power Core</span>
                <strong>{station?.power ?? 0}%</strong>
                <i>
                  <b style={{ width: `${station?.power ?? 0}%` }} />
                </i>
              </div>
              <div>
                <span>Morale</span>
                <strong>{station?.morale ?? 0}%</strong>
                <i>
                  <b style={{ width: `${station?.morale ?? 0}%` }} />
                </i>
              </div>
              <div>
                <span>Population</span>
                <strong>{(station?.population ?? 0).toLocaleString()}</strong>
                <small>
                  {station?.populationStatus?.trend
                    ? `${station.populationStatus.trend > 0 ? "+" : ""}${station.populationStatus.trend} cycle`
                    : "Stable"}
                </small>
              </div>
            </div>
            <div className="command-center-hero__actions">
              <Button
                variant="primary"
                onClick={() => onNavigate("construction")}
              >
                Station Details
              </Button>
              <Button variant="ghost" onClick={() => onNavigate("history")}>
                Operations Log
              </Button>
            </div>
          </div>
          <div className="command-center-hero__visual">
            <GameArtwork
              src="/station/station-zero.webp"
              alt="Station Zero orbital command hub"
              eager
              sizes="(max-width: 760px) 96vw, 62vw"
            />
            <div className="command-center-hero__scan" aria-hidden="true" />
            <span className="command-center-hero__designation">
              NW // ZERO-01
            </span>
          </div>
        </Panel>

        <Panel tone={riskTone(wreck?.risk)} className="dashboard-wreck-card">
          <div className="dashboard-panel-heading">
            <div>
              <span>Current Wreck</span>
              <h3>{wreck?.name ?? "Scanning debris field"}</h3>
            </div>
            <Badge tone={riskTone(wreck?.risk)}>
              {wreck?.risk ?? "unknown"}
            </Badge>
          </div>
          <div className="dashboard-wreck-card__visual">
            {wreck ? (
              <GameArtwork
                src={`/wrecks/${wreck.archetype}.webp`}
                alt={`${wreck.name} salvage target`}
                eager
                sizes="(max-width: 760px) 88vw, 24rem"
              />
            ) : (
              <NWIcon name="wreck" size={72} />
            )}
          </div>
          <div className="dashboard-wreck-card__data">
            <span>
              Hull <b>{wreck?.integrity ?? 0}%</b>
            </span>
            <span>
              Loot Budget{" "}
              <b>{(wreck?.remainingLootBudget ?? 0).toLocaleString()}</b>
            </span>
          </div>
          <HealthBar
            label="Structural integrity"
            value={wreck?.integrity ?? 0}
          />
          <Button
            variant="secondary"
            fullWidth
            onClick={() => onNavigate("salvage")}
          >
            View Wreck
          </Button>
        </Panel>

        <Panel className="dashboard-resources-card">
          <div className="dashboard-panel-heading">
            <div>
              <span>Resources</span>
              <h3>Personal Hold</h3>
            </div>
            <NWIcon name="inventory" size={22} />
          </div>
          <div className="dashboard-resource-list">
            {resources.map((resource) => (
              <button
                key={resource.slug}
                type="button"
                className={`nw-tone--${resource.tone}`}
                onClick={() => onNavigate("inventory")}
              >
                <NWIcon name={resource.icon} size={18} />
                <span>{resource.label}</span>
                <strong className="nw-numeric">
                  {inventoryQuantity(
                    { inventory },
                    resource.slug,
                  ).toLocaleString()}
                </strong>
              </button>
            ))}
            <button
              type="button"
              className="nw-tone--purple"
              onClick={() => onNavigate("market")}
            >
              <NWIcon name="credits" size={18} />
              <span>Credits</span>
              <strong className="nw-numeric">
                {(me.player?.credits ?? 0).toLocaleString()}
              </strong>
            </button>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={() => onNavigate("inventory")}
          >
            Resource Overview
          </Button>
        </Panel>
      </div>

      <div className="command-center-secondary">
        <Panel className="dashboard-expedition-card">
          <div className="dashboard-panel-heading">
            <div>
              <span>Active Expedition</span>
              <h3>{activeExpedition?.name ?? "No deployment active"}</h3>
            </div>
            <Badge
              tone={
                activeExpedition?.status === "active" ? "success" : "neutral"
              }
            >
              {activeExpedition?.status ?? "idle"}
            </Badge>
          </div>
          <div className="dashboard-expedition-card__body">
            <div className="dashboard-expedition-card__ship">
              {activeShip ? (
                <GameArtwork
                  src={
                    activeShip.activeSkin
                      ? `/ships/skins/${activeShip.activeSkin}.webp`
                      : `/ships/base/${activeShip.classSlug}.webp`
                  }
                  alt={`${activeShip.name} expedition ship`}
                  sizes="(max-width: 760px) 42vw, 18rem"
                />
              ) : (
                <NWIcon name="expedition" size={58} />
              )}
            </div>
            <div>
              <span>{activeShip?.name ?? "Fleet standing by"}</span>
              <strong>{activeExpedition?.risk ?? "Ready"}</strong>
              <p>
                {activeExpedition?.resolvesAt
                  ? `Return signal ${new Date(activeExpedition.resolvesAt).toLocaleString()}`
                  : "Select an expedition and deploy a prepared ship."}
              </p>
            </div>
          </div>
          <ProgressBar
            label="Ship condition"
            value={activeShip?.condition ?? 0}
            tone={toneForValue(activeShip?.condition)}
          />
          <Button fullWidth onClick={() => onNavigate("expeditions")}>
            {activeExpedition ? "Track Expedition" : "Launch Expedition"}
          </Button>
        </Panel>

        <Panel className="dashboard-quick-actions">
          <div className="dashboard-panel-heading">
            <div>
              <span>Quick Actions</span>
              <h3>Command Shortcuts</h3>
            </div>
            <NWIcon name="terminal" size={22} />
          </div>
          <div className="dashboard-action-grid">
            {quickActions.map((command) => (
              <button
                key={command.id}
                type="button"
                className={`dashboard-action nw-tone--${command.tone}`}
                onClick={() => onNavigate(command.id)}
              >
                <span>
                  <NWIcon name={command.icon} size={22} />
                </span>
                <strong>{command.label}</strong>
                <small>{command.detail}</small>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="dashboard-news-card">
          <div className="dashboard-panel-heading">
            <div>
              <span>Neon Wreck News</span>
              <h3>Live Signals</h3>
            </div>
            <Badge tone={unreadNotifications.length ? "warning" : "success"}>
              {unreadNotifications.length} new
            </Badge>
          </div>
          <div className="dashboard-news-list">
            {(unreadNotifications.length ? unreadNotifications : notifications)
              .slice(0, 4)
              .map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => onNavigate("notifications")}
                >
                  <span className="dashboard-news-list__icon">
                    <NWIcon name="notifications" size={17} />
                  </span>
                  <span>
                    <strong>{notification.title}</strong>
                    <small>{notification.body}</small>
                  </span>
                  <time>
                    {new Date(notification.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </button>
              ))}
            {!notifications.length &&
              history.slice(0, 3).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onNavigate("history")}
                >
                  <span className="dashboard-news-list__icon">
                    <NWIcon name="events" size={17} />
                  </span>
                  <span>
                    <strong>{entry.title}</strong>
                    <small>{entry.body}</small>
                  </span>
                  <time>LOG</time>
                </button>
              ))}
          </div>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => onNavigate("notifications")}
          >
            Open News Feed
          </Button>
        </Panel>
      </div>

      <Panel className="dashboard-live-feed">
        <div className="dashboard-live-feed__label">
          <span className="signal-dot" />
          Live Feed
        </div>
        <div className="dashboard-live-feed__items">
          {history.slice(0, 5).map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onNavigate("history")}
            >
              <NWIcon name="events" size={16} />
              <span>
                <small>{entry.category}</small>
                <strong>{entry.title}</strong>
              </span>
              <time>
                {new Date(entry.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </button>
          ))}
        </div>
      </Panel>

      <StationMaintenance
        station={station}
        inventory={inventory}
        cooldowns={cooldowns}
        action={action}
      />
    </div>
  );
}

function StationMaintenance({
  station,
  inventory,
  cooldowns,
  action,
}: Pick<GameData, "station" | "inventory" | "cooldowns" | "action">) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const run = async (key: string) => {
    await action(
      "/api/v1/station/maintain",
      { action: key },
      "Community action complete",
    );
  };
  const qty = (slug: string) =>
    inventory.find((item) => item.itemSlug === slug)?.quantity ?? 0;
  const options = [
    {
      key: "repair-hull",
      title: "Repair Main Station",
      cost: "2 Hull Plates + 3 Sealant Foam",
      reward: "+8 integrity",
      icon: "integrity" as const,
      ready: qty("hull-plate") >= 2 && qty("sealant-foam") >= 3,
    },
    {
      key: "fuel-reactor",
      title: "Fuel Reactor Grid",
      cost: "2 Fuel Cells + 1 Reactor Coolant",
      reward: "+15 power",
      icon: "reactor" as const,
      ready: qty("fuel") >= 2 && qty("reactor-coolant") >= 1,
    },
    {
      key: "food-drive",
      title: "Run Food Drive",
      cost: "10 Ration Packs + 5 Water Cartridges",
      reward: "+6 residents, +4 morale",
      icon: "population" as const,
      ready: qty("ration-pack") >= 10 && qty("water-cartridge") >= 5,
    },
    {
      key: "medical-clinic",
      title: "Open Community Clinic",
      cost: "4 Medical Supplies",
      reward: "+3 residents, +6 morale",
      icon: "crew" as const,
      ready: qty("medical-supplies") >= 4,
    },
  ];
  return (
    <Panel
      tone={
        (station?.integrity ?? 100) < 40 || (station?.power ?? 100) < 30
          ? "danger"
          : "info"
      }
      className="station-survival-panel"
    >
      <SectionTitle
        eyebrow="COMMUNITY OPERATIONS"
        title="Station Survival"
        description={(
          station?.populationStatus?.reasons ?? ["Community systems nominal."]
        ).join(" ")}
        icon="population"
      />
      <div className="station-survival-grid">
        {options.map((option) => {
          const remaining = cooldownRemaining(
            cooldowns,
            `station:${option.key}`,
            now,
          );
          return (
            <Tooltip
              key={option.key}
              content={`Cost: ${option.cost}. Effect: ${option.reward}. These resources are consumed for the whole community.`}
            >
              <Card className="station-survival-card">
                <span className="station-survival-card__icon">
                  <NWIcon name={option.icon} size={23} />
                </span>
                <h3>{option.title}</h3>
                <p>{option.cost}</p>
                <Badge tone="success">{option.reward}</Badge>
                <Button
                  fullWidth
                  disabled={!option.ready || remaining > 0}
                  onClick={() => void run(option.key)}
                >
                  {remaining > 0
                    ? `Ready in ${formatCountdown(remaining)}`
                    : option.ready
                      ? "Contribute Now"
                      : "Materials Needed"}
                </Button>
              </Card>
            </Tooltip>
          );
        })}
      </div>
    </Panel>
  );
}

function WreckIntel({ wreck }: { wreck: Wreck | null }) {
  const tone = riskTone(wreck?.risk);
  return (
    <Panel tone={tone} className="salvage-wreck-intel">
      <div className="dashboard-panel-heading">
        <div>
          <span>Target Acquired</span>
          <h3>{wreck?.name ?? "Scanning local debris field"}</h3>
        </div>
        <Badge tone={tone}>{wreck?.risk ?? "unknown"}</Badge>
      </div>
      <div className="salvage-wreck-intel__scan">
        {wreck ? (
          <GameArtwork
            src={`/wrecks/${wreck.archetype}.webp`}
            alt={`${wreck.name}, current salvage target`}
            eager
            sizes="(max-width: 760px) 94vw, 52rem"
          />
        ) : (
          <NWIcon name="wreck" size={90} />
        )}
        <div className="salvage-radar" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <strong className="nw-numeric">{wreck?.integrity ?? 0}% HULL</strong>
      </div>
      <p>{wreck?.description ?? "Awaiting server telemetry."}</p>
      <HealthBar label="Remaining hull" value={wreck?.integrity ?? 0} />
    </Panel>
  );
}

export function SalvagePage({
  wreck,
  cooldowns,
  action,
  inventory,
  ships,
}: GameData) {
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [autoSalvage, setAutoSalvage] = useState(false);
  const autoRunning = useRef(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const scanRemaining = cooldownRemaining(cooldowns, "scan", now);
  const cuttersRemaining = cooldownRemaining(cooldowns, "salvage:cutters", now);
  const cargoRemaining = cooldownRemaining(cooldowns, "salvage:cargo", now);
  const overrideRemaining = cooldownRemaining(
    cooldowns,
    "salvage:override",
    now,
  );
  useEffect(() => {
    if (!autoSalvage || autoRunning.current) return;
    const next = wreck?.depleted
      ? scanRemaining <= 0
        ? (["/api/v1/salvage/scan", undefined, "Auto scan acquired"] as const)
        : null
      : cargoRemaining <= 0
        ? ([
            "/api/v1/salvage/deploy",
            { mode: "cargo" },
            "Auto cargo recovered",
          ] as const)
        : cuttersRemaining <= 0
          ? ([
              "/api/v1/salvage/deploy",
              { mode: "cutters" },
              "Auto cutters deployed",
            ] as const)
          : null;
    if (!next) return;
    autoRunning.current = true;
    void action(next[0], next[1], next[2]).finally(() => {
      autoRunning.current = false;
    });
  }, [
    action,
    autoSalvage,
    cargoRemaining,
    cuttersRemaining,
    now,
    scanRemaining,
    wreck?.depleted,
    wreck?.id,
  ]);
  const profiles = wreck?.salvageProfile
    ? (["cutters", "cargo"] as const).map((mode) => ({
        mode,
        ...wreck.salvageProfile[mode],
      }))
    : [];
  const activeShip = ships[0];
  return (
    <div className="salvage-console-page">
      <SectionTitle
        eyebrow="SALVAGE MODE"
        title="Wreck Operations"
        description="Scan, cut, and recover through the existing server-authoritative salvage routes."
        icon="salvage"
        action={
          <ToggleSwitch
            checked={autoSalvage}
            onChange={setAutoSalvage}
            label="Auto salvage"
            description="Run available standard actions while this screen remains open."
          />
        }
      />
      <div className="salvage-command-ribbon">
        <CommandAction
          icon="scanner"
          title="Active Scan"
          detail={
            scanRemaining > 0
              ? `Ready in ${formatCountdown(scanRemaining)}`
              : "Acquire the next salvage target."
          }
          disabled={scanRemaining > 0}
          onClick={() =>
            void action("/api/v1/salvage/scan", undefined, "Signal acquired")
          }
        />
        <CommandAction
          icon="salvage"
          title="Deploy Cutters"
          detail={
            cuttersRemaining > 0
              ? `Ready in ${formatCountdown(cuttersRemaining)}`
              : "Execute the standard cutting profile."
          }
          disabled={cuttersRemaining > 0}
          onClick={() =>
            void action(
              "/api/v1/salvage/deploy",
              { mode: "cutters" },
              "Cutters deployed",
            )
          }
          tone="purple"
        />
        <CommandAction
          icon="cargo"
          title="Recover Cargo"
          detail={
            cargoRemaining > 0
              ? `Ready in ${formatCountdown(cargoRemaining)}`
              : "Prioritize internal cargo compartments."
          }
          disabled={cargoRemaining > 0}
          onClick={() =>
            void action(
              "/api/v1/salvage/deploy",
              { mode: "cargo" },
              "Cargo team launched",
            )
          }
          tone="info"
        />
        <CommandAction
          icon="signal"
          title="Rush Scan"
          detail="Spend 75 StreamElements points."
          onClick={() =>
            void action(
              "/api/v1/points/actions/rush_scan",
              undefined,
              "Rush scan purchased",
              { "Idempotency-Key": crypto.randomUUID() },
            )
          }
          tone="purple"
        />
        <CommandAction
          icon="danger"
          title="Safety Override"
          detail={
            overrideRemaining > 0
              ? `Ready in ${formatCountdown(overrideRemaining)}`
              : "Existing high-risk point action."
          }
          disabled={overrideRemaining > 0}
          onClick={() => setConfirmOverride(true)}
          tone="danger"
        />
      </div>

      <div className="salvage-console-grid">
        <WreckIntel wreck={wreck} />
        <Panel className="salvage-profile-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Salvage Profiles</span>
              <h3>Yield Intelligence</h3>
            </div>
            <NWIcon name="diagnostics" size={21} />
          </div>
          <div className="salvage-profile-list">
            {profiles.map((profile) => (
              <Card key={profile.mode} className="salvage-profile-card">
                <span className="salvage-profile-card__icon">
                  <NWIcon
                    name={profile.mode === "cargo" ? "cargo" : "salvage"}
                    size={22}
                  />
                </span>
                <div>
                  <strong>
                    {profile.mode === "cargo" ? "Cargo Team" : "Cutters"}
                  </strong>
                  <small>
                    {Math.round(profile.successChance * 100)}% success
                  </small>
                </div>
                <p>
                  {profile.scrapRange[0]}–{profile.scrapRange[1]} scrap ·{" "}
                  {Math.round(profile.electronicsChance * 100)}% electronics ·{" "}
                  {Math.round(profile.fuelChance * 100)}% fuel
                </p>
                <div className="salvage-profile-card__loot">
                  {profile.wreckLootPool.slice(0, 4).map((item) => (
                    <Badge
                      key={item.slug}
                      tone={
                        item.rarity === "epic" || item.rarity === "legendary"
                          ? "purple"
                          : "info"
                      }
                    >
                      {item.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          {!profiles.length && (
            <Notification title="No profile telemetry" tone="info">
              Scan a wreck to populate current yield intelligence.
            </Notification>
          )}
        </Panel>
      </div>

      <div className="salvage-lower-grid">
        <Panel className="salvage-cargo-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Cargo Hold</span>
              <h3>Recovered Materials</h3>
            </div>
            <Badge tone="success">
              {inventory
                .reduce((sum, item) => sum + item.quantity, 0)
                .toLocaleString()}{" "}
              units
            </Badge>
          </div>
          <div className="compact-inventory concept-inventory-tiles">
            {inventory.slice(0, 8).map((item) => (
              <div
                key={item.itemSlug}
                className={`concept-inventory-tile nw-rarity--${item.rarity}`}
              >
                <NWIcon name={itemIcon(item.itemSlug)} size={21} />
                <span>{item.name}</span>
                <strong className="nw-numeric">×{item.quantity}</strong>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="salvage-ship-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Ship Readiness</span>
              <h3>{activeShip?.name ?? "No ship registered"}</h3>
            </div>
            <Badge tone={toneForValue(activeShip?.condition)}>
              {activeShip?.condition ?? 0}% hull
            </Badge>
          </div>
          {activeShip && (
            <div className="salvage-ship-panel__body">
              <GameArtwork
                src={
                  activeShip.activeSkin
                    ? `/ships/skins/${activeShip.activeSkin}.webp`
                    : `/ships/base/${activeShip.classSlug}.webp`
                }
                alt={activeShip.name}
                sizes="(max-width:760px) 88vw, 26rem"
              />
              <div>
                <HealthBar
                  label="Hull integrity"
                  value={activeShip.condition}
                />
                <ProgressBar
                  label="Fuel level"
                  value={activeShip.fuel}
                  tone="purple"
                />
                <span className="nw-numeric">
                  Cargo {activeShip.cargoCapacity}
                </span>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {riskTone(wreck?.risk) === "danger" && (
        <div className="salvage-danger-banner">
          <NWIcon name="danger" size={26} />
          <div>
            <span>Extreme Hazard Detected</span>
            <strong>
              {wreck?.name ?? "Target"} requires deliberate command
              confirmation.
            </strong>
          </div>
        </div>
      )}
      <Notification title="Server authority active" tone="info" icon="network">
        The interface submits commands only. It does not calculate outcomes,
        rewards, cooldowns, or balance.
      </Notification>
      <ConfirmWindow
        open={confirmOverride}
        onClose={() => setConfirmOverride(false)}
        onConfirm={() => {
          setConfirmOverride(false);
          void action(
            "/api/v1/points/actions/safety_override",
            undefined,
            "Override purchased",
            { "Idempotency-Key": crypto.randomUUID() },
          );
        }}
        title="Purchase safety override?"
        confirmLabel="Spend 250 points"
        tone="danger"
      >
        <p>
          This premium command charges StreamElements points before executing.
          Failed execution follows the server refund workflow.
        </p>
      </ConfirmWindow>
    </div>
  );
}

export function ConstructionPage({
  station,
  inventory,
  endgame,
  action,
}: Pick<GameData, "station" | "inventory" | "endgame" | "action">) {
  const modules = station?.modules ?? [];
  const defaultProject =
    modules.find((module) =>
      ["building", "upgrading", "damaged"].includes(module.state),
    ) ?? modules.find((module) => module.slug === "habitat-ring");
  const [moduleSlug, setModuleSlug] = useState(
    defaultProject?.slug ?? "habitat-ring",
  );
  const [projectOpen, setProjectOpen] = useState(false);
  const activeProject =
    modules.find((module) => module.slug === moduleSlug) ?? defaultProject;
  const canContribute = Boolean(
    activeProject &&
      ["locked", "building", "upgrading", "damaged"].includes(
        activeProject.state,
      ),
  );
  return (
    <div className="page-stack">
      <SectionTitle
        eyebrow="STRUCTURAL OPERATIONS"
        title="Construction Yard"
        description="Community module state and contribution progress, using the existing construction endpoint."
        icon="construction"
        action={<Button onClick={() => setProjectOpen(true)}>Manage project</Button>}
      />
      {endgame && (
        <>
        <Panel className="project-console">
          <SectionTitle
            eyebrow="STATION PRESTIGE"
            title={endgame.prestige.name}
            description={endgame.prestige.bonus}
            icon="station"
          />
          <ProgressBar
            label={endgame.prestige.next ? `${station?.population ?? 0}/${endgame.prestige.next.population} residents toward ${endgame.prestige.next.name}` : "Maximum prestige achieved"}
            value={endgame.prestige.progress}
            tone="purple"
          />
          <ResponsiveGrid min="15rem">
            {endgame.vote.options.map((option) => (
              <Card key={option.slug}>
                <Badge tone={endgame.vote.selected === option.slug ? "success" : "neutral"}>
                  {endgame.vote.tallies[option.slug] ?? 0} votes
                </Badge>
                <h3>{option.name}</h3>
                <p>{option.bonus}</p>
                <Button
                  size="sm"
                  fullWidth
                  disabled={Boolean(endgame.vote.selected)}
                  onClick={() => void action("/api/v1/endgame/vote", { option: option.slug }, "Community vote cast")}
                >
                  {endgame.vote.selected === option.slug ? "Your vote" : "Back doctrine"}
                </Button>
              </Card>
            ))}
          </ResponsiveGrid>
        </Panel>
        <Panel className="project-console">
          <SectionTitle
            eyebrow="REPEATABLE OPERATIONS"
            title={endgame.operation.name}
            description={endgame.operation.description}
            icon="expedition"
          />
          <ProgressBar
            label={endgame.operation.completed ? "Weekly operation complete" : "Community delivery progress"}
            value={
              Object.entries(endgame.operation.requirements).reduce(
                (sum, [slug, target]) =>
                  sum + Math.min(1, (endgame.operation.contributed[slug] ?? 0) / target),
                0,
              ) / Math.max(1, Object.keys(endgame.operation.requirements).length) * 100
            }
            tone={endgame.operation.completed ? "success" : "info"}
          />
          <div className="material-readout">
            <span>Station-wide manifest</span>
            <strong>{Object.entries(endgame.operation.requirements).map(([slug, target]) => `${slug} ${endgame.operation.contributed[slug] ?? 0}/${target}`).join(" · ")}</strong>
          </div>
          <p>{endgame.operation.reward}</p>
          <div className="inline-actions">
            {[
              ["scrap", 100],
              ["electronics", 10],
              ["alloys", 10],
              ["researchData", 5],
            ].map(([material, amount]) => (
              <Button
                key={material}
                size="sm"
                variant="ghost"
                disabled={endgame.operation.completed}
                onClick={() => void action("/api/v1/endgame/operations/contribute", { [material]: amount }, "Operation supplied")}
              >
                Deliver {amount} {material === "researchData" ? "research data" : material}
              </Button>
            ))}
          </div>
          <ResponsiveGrid min="15rem">
            {endgame.contracts.map((contract) => (
              <Card key={contract.slug}>
                <Badge tone={contract.claimed ? "success" : contract.progress >= contract.target ? "info" : "neutral"}>
                  {contract.claimed ? "Claimed" : `${contract.progress}/${contract.target}`}
                </Badge>
                <h3>{contract.name}</h3>
                <p>{contract.description}</p>
                <Button
                  size="sm"
                  fullWidth
                  disabled={contract.claimed || contract.progress < contract.target}
                  onClick={() => void action(`/api/v1/endgame/contracts/${contract.slug}/claim`, undefined, "Contract claimed")}
                >
                  {contract.claimed ? "Returns tomorrow" : `Claim ${contract.credits} cr · ${contract.xp} XP`}
                </Button>
              </Card>
            ))}
          </ResponsiveGrid>
        </Panel>
        <Panel className="project-console">
          <SectionTitle
            eyebrow={`${endgame.seasonal.tokens} SEASONAL TOKENS`}
            title={`${endgame.seasonal.name} Collection`}
            description="Earn tokens from contracts and community operations. Purchases are permanent."
            icon="market"
            action={endgame.seasonal.catchUpAvailable ? (
              <Button size="sm" onClick={() => void action("/api/v1/endgame/season/catch-up", undefined, "Season catch-up claimed")}>
                Claim 5 catch-up tokens
              </Button>
            ) : undefined}
          />
          <ResponsiveGrid min="15rem">
            {endgame.seasonal.store.map((item) => (
              <Card key={item.slug}>
                <Badge tone={item.owned ? "success" : item.unlocked ? "info" : "neutral"}>
                  {item.owned ? "Owned" : `${item.tokens} tokens`}
                </Badge>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <Button
                  size="sm"
                  fullWidth
                  disabled={item.owned || !item.unlocked || endgame.seasonal.tokens < item.tokens}
                  onClick={() => void action(`/api/v1/endgame/store/${item.slug}/purchase`, undefined, "Cosmetic acquired")}
                >
                  {item.owned ? "In collection" : item.unlocked ? "Acquire" : "Prestige locked"}
                </Button>
              </Card>
            ))}
          </ResponsiveGrid>
        </Panel>
        </>
      )}
      <>
        <ResponsiveGrid min="17rem">
          {modules.map((module) => {
            const needsRepair = ["damaged", "disabled"].includes(module.state);
            const nextCost = module.nextLevelRequirements
              ? Object.entries(module.nextLevelRequirements)
                  .map(([slug, amount]) => `${amount} ${slug}`)
                  .join(" · ")
              : "Maximum level";
            return (
              <ModuleCard
                key={module.slug}
                name={module.name}
                state={module.state}
                progress={
                  needsRepair && !module.project
                    ? module.integrity
                    : (module.progress ?? 0)
                }
                progressLabel={
                  needsRepair && !module.project
                    ? "Module integrity"
                    : needsRepair
                      ? "Repair progress"
                      : "Module progress"
                }
                icon={moduleIcon(module.slug)}
                description={`${module.description} Current: ${moduleEffectDescription(module)} ${module.state === "active" ? "Benefit online." : needsRepair ? "Benefit offline until repaired." : ""}`}
                stats={
                  <span>
                    Integrity <strong>{module.integrity}%</strong> · Level{" "}
                    <strong>
                      {module.level}/{module.maxLevel}
                    </strong>
                    <br />
                    Next upgrade: <strong>{nextCost}</strong>
                  </span>
                }
                action={
                  <Button size="sm" variant={needsRepair ? "warning" : "ghost"} fullWidth onClick={() => { setModuleSlug(module.slug); setProjectOpen(true); }}>
                    Open project controls
                  </Button>
                }
              />
            );
          })}
        </ResponsiveGrid>
        <Modal open={projectOpen} onClose={() => setProjectOpen(false)} title={activeProject?.name ?? "Construction project"} description="Review progress, start work, and contribute materials from one project window." size="lg">
          <div className="project-console">
          <SectionTitle
            eyebrow="ACTIVE PROJECT"
            title={activeProject?.name ?? "No project queued"}
            icon="construction"
          />
          <Field label="Construction target">
            <Select
              value={moduleSlug}
              onChange={(event) => setModuleSlug(event.target.value)}
            >
              {modules.map((module) => (
                <option key={module.slug} value={module.slug}>
                  {module.name} · {module.state}
                </option>
              ))}
            </Select>
          </Field>
          <ProgressBar
            label="Build progress"
            value={activeProject?.progress ?? 0}
            tone="info"
          />
          {activeProject?.project && (
            <div className="material-readout">
              <span>Project requirements</span>
              <strong>
                {Object.entries(activeProject.project.requirements)
                  .map(
                    ([slug, amount]) =>
                      `${slug} ${activeProject.project?.contributed[slug] ?? 0}/${amount}`,
                  )
                  .join(" · ")}
              </strong>
            </div>
          )}
          <div className="material-readout">
            <span>Available hold</span>
            <strong>
              {inventory
                .map((item) => `${item.name} ${item.quantity}`)
                .join(" · ") || "No materials"}
            </strong>
          </div>
          {activeProject && ["damaged", "disabled"].includes(activeProject.state) && !activeProject.project && (
            <Button variant="warning" fullWidth onClick={() => void action("/api/v1/construction/start", { moduleSlug: activeProject.slug, kind: "repair" }, `${activeProject.name} repair started`)}>
              Start repair
            </Button>
          )}
          <Button
            variant="primary"
            fullWidth
            icon={<NWIcon name="resources" size={16} />}
            disabled={!canContribute}
            onClick={() =>
              void action(
                "/api/v1/construction/contribute",
                {
                  moduleSlug: activeProject?.slug ?? "habitat-ring",
                  scrap: 10,
                },
                "Materials delivered",
              )
            }
          >
            Contribute 10 Hull Scrap
          </Button>
          {activeProject?.state === "active" && (
            <Button
              variant="warning"
              fullWidth
              onClick={() =>
                void action(
                  "/api/v1/construction/start",
                  { moduleSlug: activeProject.slug, kind: "upgrade" },
                  "Module upgrade started",
                )
              }
            >
              Start module upgrade
            </Button>
          )}
          <Button
            variant="ghost"
            fullWidth
            disabled={!canContribute}
            onClick={() =>
              void action(
                "/api/v1/construction/contribute",
                { moduleSlug: activeProject?.slug, electronics: 1 },
                "Electronics delivered",
              )
            }
          >
            Contribute 1 Electronics
          </Button>
          <Button
            variant="ghost"
            fullWidth
            disabled={!canContribute}
            onClick={() =>
              void action(
                "/api/v1/construction/contribute",
                { moduleSlug: activeProject?.slug, alloys: 1 },
                "Alloys delivered",
              )
            }
          >
            Contribute 1 Alloy
          </Button>
          <Button
            variant="ghost"
            fullWidth
            disabled={!canContribute}
            onClick={() =>
              void action(
                "/api/v1/construction/contribute",
                { moduleSlug: activeProject?.slug, researchData: 1 },
                "Research data delivered",
              )
            }
          >
            Contribute 1 Research Data
          </Button>
          </div>
        </Modal>
      </>
    </div>
  );
}
