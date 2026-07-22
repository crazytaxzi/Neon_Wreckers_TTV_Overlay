# Step 3 verification diagnostic

Exit status: 1

```text
          if (previous && snapshotLoaded.current) {
            const changes: string[] = [];
            if (Number(next.integrity) !== Number(previous.integrity)) changes.push(`integrity ${Math.round(Number(next.integrity ?? 0))}%`);
            if (Number(next.power) !== Number(previous.power)) changes.push(`power ${Math.round(Number(next.power ?? 0))}%`);
            if (Number(next.morale) !== Number(previous.morale)) changes.push(`morale ${Math.round(Number(next.morale ?? 0))}%`);
            if (Number(next.population) !== Number(previous.population)) changes.push(`crew ${Math.round(Number(next.population ?? 0))}`);
            if (changes.length) enqueue({
              id: `station-poll-${Date.now()}`,
              label: 'SYSTEM UPDATE',
              title: 'Station telemetry changed',
              body: changes.join(' • '),
              severity: classify(changes.join(' ')),
              createdAt: Date.now()
            });
          }
          enqueue((next.alerts ?? []).slice(0, 8).map(fromAlert));
        }
    
        if (results[1].status === 'fulfilled') {
          const entries = results[1].value.slice(0, 40);
          const unseen = entries.filter((entry) => !knownHistoryIds.current.has(String(entry?.id)));
          for (const entry of entries) knownHistoryIds.current.add(String(entry?.id));
          if (!snapshotLoaded.current) enqueue(entries.slice(0, 24).map(fromHistory));
          else if (unseen.length) enqueue(unseen.map(fromHistory));
        }
    
        if (results[2].status === 'fulfilled') {
          const next = results[2].value;
          const previous = previousWreck.current;
          setWreck(next);
          previousWreck.current = next;
          if (previous && snapshotLoaded.current && (next.id !== previous.id || Number(next.integrity) !== Number(previous.integrity))) {
            const title = next.id !== previous.id ? String(next.name || 'New wreck located') : `${next.name || 'Wreck'} integrity changed`;
            const body = next.id !== previous.id
              ? String(next.description || `Risk classification: ${next.risk || 'unknown'}`)
              : `Remaining hull integrity: ${Math.round(Number(next.integrity ?? 0))}%`;
            const severity = classify(`${title} ${body} ${next.risk || ''}`);
            enqueue({ id: `wreck-poll-${next.id || Date.now()}-${next.integrity}`, label: 'SALVAGE INTELLIGENCE', title, body, severity, createdAt: Date.now(), breaking: isBreaking(`${title} ${body}`, severity) });
          }
        }
    
        snapshotLoaded.current = true;
      }, [enqueue]);
    
      useEffect(() => {
        refresh().catch(() => undefined);
        const timer = window.setInterval(() => refresh().catch(() => undefined), 2_500);
        return () => window.clearInterval(timer);
      }, [refresh]);
    
      useEffect(() => {
        const timer = window.setInterval(() => setClock(new Date()), 1_000);
        return () => window.clearInterval(timer);
      }, []);
    
      useEffect(() => {
        if (!config || headlines.length <= 1) return;
        const timer = window.setInterval(() => {
          setActiveIndex((index) => (index + 1) % headlines.length);
          setTransitionKey((key) => key + 1);
        }, Math.max(3, config.ticker.rotationSeconds) * 1000);
        return () => window.clearInterval(timer);
      }, [config, headlines.length]);
    
      useEffect(() => {
        let disposed = false;
        const connect = () => {
          if (disposed) return;
          const ws = new WebSocket(wsUrl());
          websocket.current = ws;
          ws.onopen = () => { reconnectAttempt.current = 0; setConnected(true); };
          ws.onmessage = (event) => {
            try {
              const decoded: unknown = JSON.parse(String(event.data));
              const parsed = realtimeEventSchema.safeParse(decoded);
              if (!parsed.success) {
                console.warn('Overlay realtime contract validation failed', { issues: parsed.error.issues });
                return;
              }
              const message = parsed.data;
              if (message.type === 'history.added' && message.entry) enqueue(fromHistory(message.entry));
              if (message.type === 'station.updated' && message.station) {
                const next = message.station;
                const previous = previousStation.current;
                setStation(next);
                previousStation.current = next;
                if (previous) {
                  const changes: string[] = [];
                  if (Math.abs(Number(next.integrity ?? 0) - Number(previous.integrity ?? 0)) >= 2) changes.push(`integrity ${Math.round(Number(next.integrity ?? 0))}%`);
                  if (Math.abs(Number(next.power ?? 0) - Number(previous.power ?? 0)) >= 2) changes.push(`power ${Math.round(Number(next.power ?? 0))}%`);
                  if (Math.abs(Number(next.morale ?? 0) - Number(previous.morale ?? 0)) >= 3) changes.push(`morale ${Math.round(Number(next.morale ?? 0))}%`);
                  if (changes.length) enqueue({ id: `station-${Date.now()}`, label: 'SYSTEM UPDATE', title: 'Station telemetry changed', body: changes.join(' • '), severity: classify(changes.join(' ')), createdAt: Date.now() });
                }
                enqueue((next.alerts ?? []).slice(0, 5).map(fromAlert));
              }
              if (message.type === 'wreck.updated' && message.wreck) {
                setWreck(message.wreck);
                const title = String(message.wreck.name || 'New wreck located');
                const body = String(message.wreck.description || `Risk classification: ${message.wreck.risk || 'unknown'}`);
                const severity = classify(`${title} ${body}`);
                enqueue({ id: `wreck-${message.wreck.id || Date.now()}`, label: 'SALVAGE INTELLIGENCE', title, body, severity, createdAt: Date.now(), breaking: isBreaking(`${title} ${body}`, severity) });
              }
              if (message.type === 'presence.updated' && Number(message.count) > 1) enqueue({ id: `presence-${message.count}-${Math.floor(Date.now() / 30000)}`, label: 'VIEWER NETWORK', title: `${message.count} operators linked`, body: 'Twitch crew connections are active across the station network.', severity: 'viewer', createdAt: Date.now() });
            } catch (error) {
              console.warn('Overlay realtime packet could not be decoded', { error });
            }
          };
          ws.onerror = () => ws.close();
          ws.onclose = () => {
            setConnected(false);
            if (disposed) return;
            reconnectTimer.current = window.setTimeout(connect, Math.min(30_000, 1_500 * 2 ** reconnectAttempt.current++));
          };
        };
        connect();
        return () => {
          disposed = true;
          if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
          websocket.current?.close();
        };
      }, [enqueue]);
    
      const current = headlines[activeIndex] ?? { id: 'online', label: 'STATION NEWS', title: 'Station Zero is online', body: 'Awaiting salvage operations and viewer activity.', severity: 'positive' as Severity, createdAt: Date.now() };
      const threatText = String(station?.threatLevel ?? 'LOW').toUpperCase();
      const threatTone: Severity = /critical|high|severe/.test(threatText.toLowerCase()) ? 'critical' : /medium|elevated|warning/.test(threatText.toLowerCase()) ? 'warning' : 'positive';
      const storagePercent = station?.storageCapacity ? (Number(station.storageUsed ?? 0) / Number(station.storageCapacity)) * 100 : 0;
      const scrap = station?.resources?.scrap ?? station?.resources?.salvage ?? 0;
      const credits = station?.resources?.credits ?? station?.resources?.credit ?? 0;
      const wreckArtwork = wreckArtworkSrc(wreck);
      const utc = useMemo(() => clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }), [clock]);
    
      if (!config) return null;
    
      const cssVars = {
        '--positive': config.theme.positive,
        '--info': config.theme.info,
        '--viewer': config.theme.viewer,
        '--warning': config.theme.warning,
        '--critical': config.theme.critical,
        '--panel': config.theme.panel,
        '--panel-alt': config.theme.panelAlt,
        '--text': config.theme.text,
        '--muted': config.theme.muted,
        '--status-top': `${config.status.top}px`,
        '--status-left': `${config.status.left}px`,
        '--status-width': `${config.status.width}px`,
        '--status-scale': String(config.status.scale),
        '--ticker-top': `${config.ticker.top}px`,
        '--ticker-width': `${config.ticker.width}px`,
        '--ticker-scale': String(config.ticker.scale),
        '--fade-seconds': `${Math.max(0.2, config.visibility.fadeSeconds)}s`
      } as CSSProperties;
    
      const breaking = Boolean(config.breakingNews && current.breaking);
      const forceVisible = Boolean(config.previewBackground && config.visibility.keepVisibleInPreview);
      const showTicker = forceVisible || tickerAwake;
      const showStatus = forceVisible || statusAwake;
      return (
        <main className={`broadcast-canvas ${config.previewBackground ? 'preview-background' : ''} ${config.scanlines ? 'with-scanlines' : ''} ${config.glass ? 'with-glass' : ''}`} style={cssVars}>
          {config.status.visible && <Panel depth="medium" tone="success" className={`telemetry-panel station-panel ${showStatus ? 'overlay-awake' : 'overlay-idle'}`} aria-label="Station telemetry">
            <header className="telemetry-header"><div className="telemetry-ident"><span className="telemetry-icon"><NWIcon name="station" size={22} /></span><div><span className="nw-eyebrow">ORBITAL COMMAND</span><h1>{station?.name || 'STATION ZERO'}</h1></div></div><Badge tone={connected ? 'success' : 'warning'} icon="network">{connected ? 'LIVE LINK' : 'LINK LOST'}</Badge></header>
            <div className="telemetry-meta"><span>ZERO-01</span><span>LEVEL {station?.level ?? 1}</span><span>CREW {compactNumber(station?.population ?? 0)}</span><Badge tone={uiTone(threatTone)}>THREAT {threatText}</Badge></div>
            <div className="telemetry-grid station-grid" aria-hidden="true" />
            <div className="telemetry-meters">
              <TelemetryMeter label="HULL INTEGRITY" value={clamp(station?.integrity, 100)} tone={clamp(station?.integrity, 100) < 35 ? 'critical' : clamp(station?.integrity, 100) < 65 ? 'warning' : 'positive'} />
              <TelemetryMeter label="REACTOR POWER" value={clamp(station?.power, 100)} tone={clamp(station?.power, 100) < 30 ? 'critical' : clamp(station?.power, 100) < 60 ? 'warning' : 'viewer'} />
              <TelemetryMeter label="CREW MORALE" value={clamp(station?.morale, 100)} tone={clamp(station?.morale, 100) < 35 ? 'warning' : 'positive'} />
              <TelemetryMeter label="CARGO STORAGE" value={storagePercent} tone={storagePercent > 88 ? 'warning' : 'info'} />
            </div>
            <footer className="resource-strip"><div><span>SCRAP</span><strong className="nw-numeric">{compactNumber(scrap)}</strong></div><div><span>CREDITS</span><strong className="nw-numeric">{compactNumber(credits)}</strong></div><div><span>GRID</span><strong>{connected ? 'SYNCED' : 'OFFLINE'}</strong></div></footer>
          </Panel>}
    
          {config.status.visible && <Panel depth="medium" tone={uiTone(classify(String(wreck?.risk ?? '')))} className={`telemetry-panel wreck-telemetry ${showStatus ? 'overlay-awake' : 'overlay-idle'}`} aria-label="Active wreck telemetry">
            <header className="telemetry-header"><div className="telemetry-ident"><span className="telemetry-icon wreck-icon"><NWIcon name="wreck" size={22} /></span><div><span className="nw-eyebrow">SALVAGE TARGET</span><h2>{wreck?.name || 'SCANNING FIELD'}</h2></div></div><Badge tone={uiTone(classify(String(wreck?.risk ?? '')))}>{wreck?.risk || 'UNKNOWN'}</Badge></header>
            <div className="wreck-schematic" aria-hidden="true"><div className="scan-grid" /><span className="scan-ring scan-ring-outer" /><span className="scan-ring scan-ring-inner" />{wreckArtwork ? <img className="wreck-schematic__art" src={wreckArtwork} srcSet={`${wreckArtwork.replace('.webp', '-360w.webp')} 360w, ${wreckArtwork.replace('.webp', '-600w.webp')} 600w, ${wreckArtwork} 1200w`} sizes="(max-width: 1280px) 18rem, 24rem" alt="" loading="eager" decoding="async" /> : <NWIcon name="wreck" size={48} />}</div>
            <p>{wreck?.description || 'Awaiting server telemetry from the local debris field.'}</p>
            <TelemetryMeter label="REMAINING HULL" value={clamp(wreck?.integrity)} tone={clamp(wreck?.integrity) <= 25 ? 'critical' : clamp(wreck?.integrity) <= 50 ? 'warning' : 'positive'} />
            <footer className="wreck-footer"><span>OBJECT ID</span><strong className="nw-numeric">{wreck?.id ? wreck.id.slice(0, 12).toUpperCase() : 'NO CONTACT'}</strong></footer>
          </Panel>}
    
          {current.severity === 'viewer' && showTicker && <div className="viewer-event-region" key={`viewer-${current.id}-${transitionKey}`}>
            <OverlayEventPopup label={current.label} title={current.title} tone="purple" icon="broadcast">{current.body}</OverlayEventPopup>
          </div>}
    
          {config.ticker.visible && <section className={`dispatch-rail nw-tone--${uiTone(current.severity)} ${breaking ? 'breaking' : ''} ${showTicker ? 'overlay-awake' : 'overlay-idle'}`} aria-live="polite">
            {breaking && <div className="breaking-ribbon">BREAKING</div>}
            <div className="rail-cap left-cap"><NWIcon name={breaking ? 'warning' : 'broadcast'} size={18} /><div><span className="nw-eyebrow">ACTIVITY DISPATCH</span><strong>{current.label}</strong></div></div>
            <div className="headline-window" key={`${current.id}-${transitionKey}`}><div className="headline-title">{current.title}</div><div className="headline-body">{current.body}</div></div>
            <div className="rail-cap right-cap"><span>{utc} UTC</span><span className="counter">{String(activeIndex + 1).padStart(2, '0')}/{String(Math.max(headlines.length, 1)).padStart(2, '0')}</span></div>
          </section>}
    
          {config.feedIndicator && <div className={`feed-indicator ${connected ? 'connected' : 'reconnecting'}`}><span /> {connected ? 'LIVE STATION FEED' : 'RECONNECTING TO STATION'}</div>}
        </main>
      );
    }
    
    createRoot(document.getElementById('root')!).render(<ThemeProvider theme={defaultTheme}><App /></ThemeProvider>);
    
  operator: 'match'
  stack: |-
    TestContext.<anonymous> (file:///home/crazytaxzi/actions-runner/actions-runner/_work/Neon_Wreckers_TTV_Overlay/Neon_Wreckers_TTV_Overlay/tools/test/ui-revamp.test.mjs:111:10)
    async Test.run (node:internal/test_runner/test:1054:7)
    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  ...
# Subtest: player entry is split into behavior-preserving feature modules
ok 38 - player entry is split into behavior-preserving feature modules
  ---
  duration_ms: 10.555814
  type: 'test'
  ...
# Subtest: player HTML entry points declare real device viewports
ok 39 - player HTML entry points declare real device viewports
  ---
  duration_ms: 5.869523
  type: 'test'
  ...
# Subtest: concept-faithful player surfaces are implemented in live React pages
ok 40 - concept-faithful player surfaces are implemented in live React pages
  ---
  duration_ms: 6.398351
  type: 'test'
  ...
# Subtest: visual proof fixture is build-gated and cannot replace production data accidentally
ok 41 - visual proof fixture is build-gated and cannot replace production data accidentally
  ---
  duration_ms: 3.921641
  type: 'test'
  ...
1..41
# tests 41
# suites 0
# pass 39
# fail 2
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1032.774893
 ELIFECYCLE  Command failed with exit code 1.
 ELIFECYCLE  Test failed. See above for more details.
 ELIFECYCLE  Command failed with exit code 1.
```
