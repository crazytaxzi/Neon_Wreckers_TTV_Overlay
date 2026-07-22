# Step 3 web build diagnostic

Exit status: 1

```text

> @neon-wreckers/web@2.0.0 build /home/crazytaxzi/actions-runner/actions-runner/_work/Neon_Wreckers_TTV_Overlay/Neon_Wreckers_TTV_Overlay/apps/web
> tsc -b && vite build

src/game-data.ts(122,34): error TS2304: Cannot find name 'WS_URL'.
src/game-data.ts(126,58): error TS2345: Argument of type '{ id: string; name: string; power: number; resources: Record<string, number>; population: number; integrity: number; alerts: objectOutputType<{ id: ZodString; severity: ZodString; title: ZodString; body: ZodString; createdAt: ZodUnion<...>; }, ZodTypeAny, "passthrough">[]; ... 7 more ...; activeModifiers?: unknown[]...' is not assignable to parameter of type 'SetStateAction<Station | null>'.
  Type '{ id: string; name: string; power: number; resources: Record<string, number>; population: number; integrity: number; alerts: objectOutputType<{ id: ZodString; severity: ZodString; title: ZodString; body: ZodString; createdAt: ZodUnion<...>; }, ZodTypeAny, "passthrough">[]; ... 7 more ...; activeModifiers?: unknown[]...' is missing the following properties from type 'Station': activeSeason, museum
src/game-data.ts(127,54): error TS2345: Argument of type '{ id: string; name: string; integrity: number; risk: string; description?: string | undefined; visualKey?: string | undefined; salvageProfile?: Record<string, unknown> | undefined; } & { ...; }' is not assignable to parameter of type 'SetStateAction<Wreck | null>'.
  Type '{ id: string; name: string; integrity: number; risk: string; description?: string | undefined; visualKey?: string | undefined; salvageProfile?: Record<string, unknown> | undefined; } & { ...; }' is missing the following properties from type 'Wreck': archetype, depleted, remainingLootBudget, createdAt, updatedAt
src/game-data.ts(128,56): error TS2345: Argument of type '(current: HistoryEntry[]) => (HistoryEntry | ({ body: string; title: string; id: string; createdAt: string | Date; category: string; details?: unknown; actorDisplayName?: string | ... 1 more ... | undefined; } & { ...; }))[]' is not assignable to parameter of type 'SetStateAction<HistoryEntry[]>'.
  Type '(current: HistoryEntry[]) => (HistoryEntry | ({ body: string; title: string; id: string; createdAt: string | Date; category: string; details?: unknown; actorDisplayName?: string | ... 1 more ... | undefined; } & { ...; }))[]' is not assignable to type '(prevState: HistoryEntry[]) => HistoryEntry[]'.
    Type '(HistoryEntry | ({ body: string; title: string; id: string; createdAt: string | Date; category: string; details?: unknown; actorDisplayName?: string | null | undefined; } & { ...; }))[]' is not assignable to type 'HistoryEntry[]'.
      Type 'HistoryEntry | ({ body: string; title: string; id: string; createdAt: string | Date; category: string; details?: unknown; actorDisplayName?: string | null | undefined; } & { ...; })' is not assignable to type 'HistoryEntry'.
        Type '{ body: string; title: string; id: string; createdAt: string | Date; category: string; details?: unknown; actorDisplayName?: string | null | undefined; } & { [k: string]: unknown; }' is not assignable to type 'HistoryEntry'.
          Types of property 'actorDisplayName' are incompatible.
            Type 'string | null | undefined' is not assignable to type 'string | null'.
              Type 'undefined' is not assignable to type 'string | null'.
/home/crazytaxzi/actions-runner/actions-runner/_work/Neon_Wreckers_TTV_Overlay/Neon_Wreckers_TTV_Overlay/apps/web:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @neon-wreckers/web@2.0.0 build: `tsc -b && vite build`
Exit status 1
```
