/*
 * SPDX-FileCopyrightText: Copyright (c) 2025-2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Interactive system-architecture diagram.
 *
 * A faithful, code-driven recreation of openshell-system-architecture.svg styled
 * with NVIDIA colours. Every labelled box is an interactive node
 * (data-node="<id>") whose id matches an entry in window.OS_DATA.nodes, so the
 * landing page can drive a detail panel and highlight related pieces.
 */
(function () {
  "use strict";

  /* Wrap markup in a focusable, clickable node group. */
  function node(id, inner) {
    return (
      '<g class="arch-node" data-node="' +
      id +
      '" tabindex="0" role="button" aria-label="' +
      id +
      '">' +
      inner +
      "</g>"
    );
  }

  /* A rounded box + label + optional caption, positioned at (x, y). */
  function box(id, x, y, w, h, cls, label, caption, labelDy) {
    var parts = [
      '<rect class="' + cls + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="14"/>',
      '<text class="t-label" x="' + (x + w / 2) + '" y="' + (y + (labelDy || 30)) +
        '" text-anchor="middle">' + label + "</text>"
    ];
    if (caption) {
      parts.push(
        '<text class="t-small" x="' + (x + w / 2) + '" y="' + (y + (labelDy || 30) + 24) +
        '" text-anchor="middle">' + caption + "</text>"
      );
    }
    return node(id, parts.join(""));
  }

  function buildSvg() {
    return (
      '<svg class="arch-svg" viewBox="0 0 1280 870" role="img" ' +
      'aria-labelledby="archTitle archDesc" preserveAspectRatio="xMidYMid meet">' +
      "<title id=\"archTitle\">OpenShell system architecture</title>" +
      "<desc id=\"archDesc\">User interfaces connect to the gateway, which uses the policy prover to " +
      "formally verify proposed policy changes before approval. The OpenShell Runtime places a trusted " +
      "supervisor separately from a network-isolated sandbox workload. The workload's only allowed network " +
      "path is its mediated connection to the supervisor, which connects to approved external services. " +
      "The policy lifecycle strip shows the supervisor proposing a policy change, the gateway's policy prover " +
      "checking it, a human approving it, and the supervisor reloading the approved policy.</desc>" +

      /* ── defs ─────────────────────────────────────────────────────── */
      "<defs>" +
      '<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="#7d8b9c"/></marker>' +
      '<marker id="ah-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="#76b900"/></marker>' +
      '<marker id="ah-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="#5b6675"/></marker>' +
      '<pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">' +
      '<circle cx="1.5" cy="1.5" r="1.2" fill="#1b2430"/></pattern>' +
      '<filter id="glow" x="-40%" y="-40%" width="180%" height="180%">' +
      '<feGaussianBlur stdDeviation="7" result="b"/><feMerge>' +
      "<feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter>" +
      "</defs>" +

      '<rect class="arch-canvas" width="1280" height="870" rx="20"/>' +
      '<rect class="arch-grid" width="1280" height="870" rx="20"/>' +

      '<g transform="translate(0,-80)">' +

      /* ── User interfaces ──────────────────────────────────────────── */
      '<text class="t-section" x="45" y="116">USER INTERFACES</text>' +
      '<rect class="n-soft" x="40" y="130" width="760" height="84" rx="18"/>' +
      box("cli", 75, 146, 180, 48, "n-box", "CLI", null, 30) +
      box("sdk", 310, 146, 180, 48, "n-box", "SDK", null, 30) +
      box("tui", 545, 146, 180, 48, "n-box", "TUI", null, 30) +

      /* ── External services ────────────────────────────────────────── */
      '<text class="t-section" x="845" y="116">EXTERNAL SERVICES</text>' +
      '<rect class="n-soft" x="840" y="130" width="400" height="84" rx="18"/>' +
      node("services",
        '<rect class="n-box" x="865" y="146" width="160" height="48" rx="12"/>' +
        '<text class="t-label" x="945" y="165" text-anchor="middle">Services</text>' +
        '<text class="t-small" x="945" y="185" text-anchor="middle">APIs and tools</text>') +
      node("models",
        '<rect class="n-box" x="1045" y="146" width="170" height="48" rx="12"/>' +
        '<text class="t-label" x="1130" y="165" text-anchor="middle">Models</text>' +
        '<text class="t-small" x="1130" y="185" text-anchor="middle">inference APIs</text>') +

      /* ── Gateway (control plane) ──────────────────────────────────── */
      '<text class="t-section" x="45" y="286">GATEWAY (CONTROL PLANE)</text>' +
      '<rect class="n-soft" x="40" y="300" width="360" height="450" rx="18"/>' +
      node("api-server",
        '<rect class="n-trusted" x="85" y="340" width="290" height="70" rx="14"/>' +
        '<text class="t-label" x="230" y="370" text-anchor="middle">API Server</text>' +
        '<text class="t-small" x="230" y="394" text-anchor="middle">API, authentication, lifecycle, relays</text>') +
      box("policy-prover", 85, 450, 290, 50, "n-box", "Policy prover", null, 31) +
      node("durable-state",
        '<rect class="n-box" x="85" y="540" width="290" height="70" rx="14"/>' +
        '<text class="t-label" x="230" y="570" text-anchor="middle">Durable state</text>' +
        '<text class="t-small" x="230" y="594" text-anchor="middle">sandboxes · policies · providers · settings</text>') +
      node("compute-driver",
        '<rect class="n-green" x="85" y="650" width="290" height="70" rx="14"/>' +
        '<text class="t-label" x="230" y="680" text-anchor="middle">Compute driver</text>' +
        '<text class="t-small" x="230" y="704" text-anchor="middle">places and fences each sandbox</text>') +
      '<path class="n-line" d="M 230 410 V 450"/>' +
      '<path class="n-line" d="M 85 375 H 60 V 575 H 85"/>' +
      '<path class="n-line" d="M 230 610 V 650"/>' +

      /* ── OpenShell runtime (data plane) ───────────────────────────── */
      '<text class="t-section" x="485" y="286">OPENSHELL RUNTIME (DATA PLANE)</text>' +
      '<rect x="480" y="300" width="760" height="450" rx="18" class="n-runtime"/>' +

      node("supervisor",
        '<rect class="n-trusted" x="530" y="365" width="240" height="290" rx="16"/>' +
        '<text class="t-label" x="650" y="405" text-anchor="middle">Supervisor</text>' +
        '<text class="t-tiny t-accent" x="650" y="429" text-anchor="middle">GOVERNS THE AGENT</text>' +
        '<text class="t-small" x="650" y="475" text-anchor="middle">Policy evaluation</text>' +
        '<text class="t-small" x="650" y="505" text-anchor="middle">Credential resolution</text>' +
        '<text class="t-small" x="650" y="535" text-anchor="middle">DNS and proxying</text>' +
        '<text class="t-small" x="650" y="565" text-anchor="middle">Agent session multiplexing</text>' +
        '<line x1="565" y1="590" x2="735" y2="590" stroke="#2f4a1a" stroke-width="1.5"/>' +
        '<text class="t-small" x="650" y="622" text-anchor="middle">Maintains the gateway session</text>') +

      '<rect class="n-sandbox-zone" x="880" y="350" width="315" height="270" rx="18"/>' +
      '<text class="t-tiny" x="1037" y="383" text-anchor="middle">SANDBOX · NETWORK ISOLATED</text>' +
      '<text class="t-tiny" x="1037" y="402" text-anchor="middle">(CONTAINER · VM)</text>' +
      node("sandbox",
        '<rect class="n-box" x="910" y="412" width="255" height="86" rx="14"/>' +
        '<text class="t-label" x="1037" y="449" text-anchor="middle">Sandbox</text>' +
        '<text class="t-small" x="1037" y="474" text-anchor="middle">process owner and syscall boundary</text>') +
      node("agent",
        '<rect class="n-dark" x="910" y="530" width="255" height="60" rx="14"/>' +
        '<text class="t-agent" x="1037" y="557" text-anchor="middle">Agent</text>' +
        '<text class="t-agent-sub" x="1037" y="578" text-anchor="middle">untrusted workload</text>') +
      '<path class="n-line" d="M 1037 498 V 530"/>' +

      /* mediated channel + blocked egress */
      '<path class="n-flow" d="M 910 455 H 770"/>' +
      '<text class="t-tiny t-accent" x="840" y="434" text-anchor="middle">MEDIATED CHANNEL</text>' +
      '<path class="n-blocked" d="M 1037 590 V 611"/>' +
      '<line x1="1028" y1="611" x2="1046" y2="629" class="n-blocked-x"/>' +
      '<line x1="1046" y1="611" x2="1028" y2="629" class="n-blocked-x"/>' +

      node("fence",
        '<rect class="n-green" x="880" y="650" width="315" height="84" rx="12"/>' +
        '<text class="t-tiny t-accent" x="1037" y="674" text-anchor="middle">WORKLOAD NETWORK RULE</text>' +
        '<text class="t-label" x="1037" y="699" text-anchor="middle">Deny all egress</text>' +
        '<text class="t-small" x="1037" y="720" text-anchor="middle">except to the supervisor</text>') +

      /* connectors */
      '<path class="n-line" d="M 420 214 V 246 H 330 V 340"/>' +
      '<text class="t-tiny" x="438" y="239" text-anchor="start">gRPC / HTTP</text>' +
      '<path class="n-line" d="M 530 460 H 420 V 395 H 375"/>' +
      '<path class="n-line" d="M 375 675 H 480"/>' +
      '<path class="n-flow" d="M 750 365 V 246 H 1040 V 214"/>' +
      '<text class="t-tiny t-accent" x="790" y="239" text-anchor="start">POLICY-APPROVED EGRESS</text>' +
      "</g>" +

      /* ── Policy lifecycle ─────────────────────────────────────────── */
      '<text class="t-section" x="45" y="740">POLICY LIFECYCLE</text>' +
      '<rect class="n-soft" x="40" y="754" width="1200" height="100" rx="18"/>' +

      '<path class="n-dashed" d="M700 575 V737 H1070 V769"/>' +
      '<text class="t-tiny" x="850" y="720" text-anchor="middle">SUPERVISOR PROPOSES</text>' +
      '<path class="n-dashed" d="M200 769 V727 H600 V575"/>' +
      '<text class="t-tiny" x="400" y="705" text-anchor="middle">APPROVED POLICY RELOADED</text>' +

      box("reload", 65, 769, 270, 70, "n-box", "Policy reloads", "supervisor retries", 30) +
      node("approve",
        '<rect class="n-box" x="355" y="769" width="270" height="70" rx="14"/>' +
        '<text class="t-label" x="490" y="795" text-anchor="middle">You approve</text>' +
        '<text class="t-small" x="490" y="815" text-anchor="middle">manual by default</text>' +
        '<text class="t-tiny" x="490" y="833" text-anchor="middle">or auto — no new risk found</text>') +
      box("prover-check", 645, 769, 270, 70, "n-box", "Gateway prover checks", "flags risky new access", 30) +
      box("propose", 935, 769, 270, 70, "n-box", "Agent proposes", "via policy.local", 30) +

      '<path class="n-dashed" d="M935 804 H915"/>' +
      '<path class="n-dashed" d="M645 804 H625"/>' +
      '<path class="n-dashed" d="M355 804 H335"/>' +

      "</svg>"
    );
  }

  window.OpenShellArchitecture = {
    render: function (container) {
      container.innerHTML = buildSvg();
      return container.querySelector(".arch-svg");
    }
  };
})();
