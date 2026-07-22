import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const nginx = fs.readFileSync('infrastructure/gateway/nginx.conf.template', 'utf8');
const app = fs.readFileSync('apps/api/src/app.ts', 'utf8');

function locationBlock(marker, nextMarker, fromEnd = false) {
  const start = fromEnd ? nginx.lastIndexOf(marker) : nginx.indexOf(marker);
  assert.notEqual(start, -1, `Missing location marker: ${marker}`);
  const end = nextMarker ? nginx.indexOf(nextMarker, start + marker.length) : nginx.length;
  assert.notEqual(end, -1, `Missing next location marker: ${nextMarker}`);
  return nginx.slice(start, end);
}

function csp(block) {
  const match = block.match(/add_header Content-Security-Policy "([^"]+)" always;/);
  assert.ok(match, 'Location is missing an always-on Content-Security-Policy header');
  return match[1];
}

function assertCoreDirectives(policy) {
  for (const directive of [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ]) {
    assert.ok(policy.includes(directive), `CSP is missing ${directive}`);
  }
  assert.ok(!policy.includes("'unsafe-inline'"));
  assert.ok(!policy.includes("'unsafe-eval'"));
}

test('API enables a deny-by-default Helmet CSP', () => {
  assert.doesNotMatch(app, /contentSecurityPolicy:\s*false/);
  assert.match(app, /defaultSrc:\s*\["'none'"\]/);
  assert.match(app, /frameAncestors:\s*\["'none'"\]/);
  assert.match(app, /formAction:\s*\["'none'"\]/);
  assert.match(app, /contentSecurityPolicy:\s*apiContentSecurityPolicy/);
});

test('player, admin, and overlay receive explicit CSP headers', () => {
  const admin = csp(locationBlock('location ^~ /admin/', 'location = /overlay'));
  const overlay = csp(locationBlock('location ^~ /overlay/', 'location / {'));
  const player = csp(locationBlock('location / {', undefined, true));

  for (const policy of [admin, overlay, player]) assertCoreDirectives(policy);
  assert.ok(admin.includes("frame-ancestors 'none'"));
  assert.ok(overlay.includes("frame-ancestors 'self'"));
  assert.ok(player.includes("frame-ancestors 'self'"));
});

test('WebSocket connectivity is permitted without broad script execution exceptions', () => {
  const policies = [...nginx.matchAll(/add_header Content-Security-Policy "([^"]+)" always;/g)].map(match => match[1]);
  assert.equal(policies.length, 3);
  for (const policy of policies) {
    assert.ok(policy.includes("connect-src 'self' ws: wss:"));
    assert.ok(!policy.includes('*'));
    assert.ok(!policy.includes("'unsafe-inline'"));
    assert.ok(!policy.includes("'unsafe-eval'"));
  }
});
