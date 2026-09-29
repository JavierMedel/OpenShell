/*
 * SPDX-FileCopyrightText: Copyright (c) 2025-2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Single source of truth for the landing page: architecture nodes (the clickable
 * pieces of the system diagram) and the component cards that describe them.
 */
(function () {
  "use strict";

  var DOCS = "https://docs.nvidia.com/openshell/latest";

  /*
   * Nodes map 1:1 to a group inside the architecture SVG (data-node="<id>").
   * `related` links a node to the surrounding concepts so the detail panel can
   * offer "related" chips that move focus around the diagram.
   */
  var nodes = {
    /* ── User interfaces ─────────────────────────────────────────────── */
    cli: {
      group: "interfaces",
      kicker: "User interface",
      title: "CLI",
      subtitle: "openshell",
      body: "The command-line interface is the primary surface for driving OpenShell: create and attach to sandboxes, stream logs, manage policy, and wire up providers.",
      bullets: [
        "Create, list, and attach to sandboxes",
        "Author and reload policy, run the prover",
        "Works against a local or remote gateway"
      ],
      link: { label: "CLI reference", href: DOCS + "/reference/cli" },
      related: ["sdk", "tui", "api-server"]
    },
    sdk: {
      group: "interfaces",
      kicker: "User interface",
      title: "SDK",
      subtitle: "Python · TypeScript · Go · Rust",
      body: "Programmatic access to the gateway for applications that create sandboxes, push policy, or observe running workloads. SDKs connect to a gateway; they do not install the CLI.",
      bullets: [
        "Async gateway clients with TLS and OIDC refresh",
        "Curated sandbox API plus raw protobuf access",
        "Same release as the gateway when possible"
      ],
      link: { label: "SDK overview", href: DOCS + "/sdk" },
      related: ["cli", "tui", "api-server"]
    },
    tui: {
      group: "interfaces",
      kicker: "User interface",
      title: "TUI",
      subtitle: "terminal dashboard",
      body: "A Ratatui-based terminal dashboard for monitoring sandboxes, watching network decisions, and following policy activity in real time.",
      bullets: [
        "Live view of sandboxes and their state",
        "Follow policy and network decisions",
        "Runs anywhere the CLI runs"
      ],
      link: { label: "Monitoring", href: DOCS + "/observability/telemetry" },
      related: ["cli", "sdk", "durable-state"]
    },

    /* ── External services ───────────────────────────────────────────── */
    services: {
      group: "external",
      kicker: "External",
      title: "Services",
      subtitle: "APIs and tools",
      body: "The third-party APIs and tools an agent needs to reach. Agents never hold real credentials; OpenShell injects them only on requests bound for approved endpoints.",
      bullets: [
        "Reached only through policy-approved egress",
        "Credentials injected at the boundary",
        "Every connection evaluated before it leaves"
      ],
      link: { label: "Providers", href: DOCS + "/how-it-works/providers/overview" },
      related: ["models", "supervisor", "fence"]
    },
    models: {
      group: "external",
      kicker: "External",
      title: "Models",
      subtitle: "inference APIs",
      body: "Inference endpoints the agent calls. OpenShell routes and authorizes model traffic like any other provider, keeping keys out of the sandbox.",
      bullets: [
        "Provider-backed inference routing",
        "Keys stay out of the workload",
        "Per-endpoint authorization"
      ],
      link: { label: "Inference", href: DOCS + "/how-it-works/inference" },
      related: ["services", "supervisor", "fence"]
    },

    /* ── Gateway (control plane) ─────────────────────────────────────── */
    "api-server": {
      group: "gateway",
      kicker: "Gateway · control plane",
      title: "API Server",
      subtitle: "API, authentication, lifecycle, relays",
      body: "Checks who you are and remembers everything about your sandboxes. It delivers policy and settings, attaches providers, decides who can do what, and coordinates connections into sandboxes.",
      bullets: [
        "Authentication and authorization boundary",
        "Delivers policy and settings to supervisors",
        "Coordinates connection relays into sandboxes"
      ],
      link: { label: "Gateways", href: DOCS + "/how-it-works/gateways/overview" },
      related: ["durable-state", "policy-prover", "compute-driver"]
    },
    "policy-prover": {
      group: "gateway",
      kicker: "Gateway · control plane",
      title: "Policy prover",
      subtitle: "formal verification",
      body: "Runs in the gateway and uses formal verification to check agent-proposed network rules. It flags changes such as new credentialed reach, new HTTP methods, or access to cloud metadata endpoints; any finding blocks auto-approval.",
      bullets: [
        "Checks a proposed policy against the current boundary",
        "Any finding blocks auto-approval",
        "Ships standalone as openshell-prover for CI"
      ],
      link: { label: "Policy prover", href: DOCS + "/how-it-works/policies/prover" },
      related: ["api-server", "prover-check", "supervisor"]
    },
    "durable-state": {
      group: "gateway",
      kicker: "Gateway · control plane",
      title: "Durable state",
      subtitle: "sandboxes · policies · providers · settings",
      body: "The gateway's persistent record of your world: which sandboxes exist, which policies are in force, which providers are attached, and how the deployment is configured.",
      bullets: [
        "Sandbox registry and lifecycle records",
        "Versioned policy and provider attachments",
        "Survives restarts and upgrades"
      ],
      link: { label: "Gateways", href: DOCS + "/how-it-works/gateways/overview" },
      related: ["api-server", "compute-driver", "supervisor"]
    },
    "compute-driver": {
      group: "gateway",
      kicker: "Gateway · control plane",
      title: "Compute driver",
      subtitle: "places and fences each sandbox",
      body: "Creates the sandbox, starts the supervisor and the workload, sets up the private channel between them, and builds the network fence. It reports status back and cleans up when the sandbox goes away.",
      bullets: [
        "Docker, Podman, Kubernetes, VM, and MXC backends",
        "Builds the network fence with native tooling",
        "Reports status and reclaims resources"
      ],
      link: { label: "Runtimes", href: DOCS + "/how-it-works/sandboxes/runtimes" },
      related: ["fence", "sandbox", "supervisor"]
    },

    /* ── OpenShell runtime (data plane) ──────────────────────────────── */
    supervisor: {
      group: "runtime",
      kicker: "Runtime · trusted side",
      title: "Supervisor",
      subtitle: "governs the agent",
      body: "Lives on the trusted side of the boundary. It checks requests against policy, supplies credentials, resolves DNS, opens approved connections, and keeps the link to the gateway alive.",
      bullets: [
        "Policy evaluation on every request",
        "Credential resolution, DNS, and proxying",
        "Agent session multiplexing",
        "Maintains the gateway session"
      ],
      link: { label: "Inside the boundary", href: DOCS + "/about/architecture#inside-the-sandbox-boundary" },
      related: ["sandbox", "api-server", "services"]
    },
    sandbox: {
      group: "runtime",
      kicker: "Runtime · inside the boundary",
      title: "Sandbox",
      subtitle: "process owner and syscall boundary",
      body: "Lives inside the boundary with the agent. It owns the agent's processes, knows which program made each request, applies process controls, and forwards TCP and DNS traffic to the supervisor.",
      bullets: [
        "Owns and attributes agent processes",
        "Applies process and filesystem controls",
        "Forwards TCP and DNS to the supervisor"
      ],
      link: { label: "Inside the boundary", href: DOCS + "/about/architecture#inside-the-sandbox-boundary" },
      related: ["agent", "fence", "supervisor"]
    },
    agent: {
      group: "runtime",
      kicker: "Runtime · inside the boundary",
      title: "Agent",
      subtitle: "untrusted workload",
      body: "Your autonomous workload. It can read files, install packages, call APIs, and use credentials, but only within the limits policy declares.",
      bullets: [
        "Capability-free, network-isolated process",
        "Sees no real credentials",
        "Everything it does is mediated"
      ],
      link: { label: "Run your first agent", href: DOCS + "/about/run-your-first-agent" },
      related: ["sandbox", "fence", "supervisor"]
    },
    fence: {
      group: "runtime",
      kicker: "Network isolation",
      title: "Outer network fence",
      subtitle: "deny all egress",
      body: "Denies all network egress from the workload except its protected connection to the supervisor. Each runtime builds this with its own native tools.",
      bullets: [
        "Deny-by-default egress from the workload",
        "One protected path: the mediated channel",
        "Native enforcement per compute backend"
      ],
      link: { label: "Deny-by-default egress", href: DOCS + "/security/best-practices#deny-by-default-egress" },
      related: ["compute-driver", "sandbox", "supervisor"]
    },

    /* ── Policy lifecycle ────────────────────────────────────────────── */
    propose: {
      group: "lifecycle",
      kicker: "Policy lifecycle · 4 of 4",
      title: "Agent proposes",
      subtitle: "via policy.local",
      body: "When the agent needs new access it proposes a policy change locally instead of silently failing or over-reaching.",
      bullets: ["Agent requests the access it needs", "Proposal is scoped, never auto-applied"],
      link: { label: "Policies", href: DOCS + "/how-it-works/policies/overview" },
      related: ["prover-check", "supervisor"]
    },
    "prover-check": {
      group: "lifecycle",
      kicker: "Policy lifecycle · 3 of 4",
      title: "Gateway prover checks",
      subtitle: "flags risky new access",
      body: "The proposal travels to the gateway, where the prover formally verifies it and flags risky new access before anything is approved.",
      bullets: ["Formal verification of the proposed rules", "Flags new credentialed reach and metadata access"],
      link: { label: "Policy prover", href: DOCS + "/how-it-works/policies/prover" },
      related: ["approve", "policy-prover"]
    },
    approve: {
      group: "lifecycle",
      kicker: "Policy lifecycle · 2 of 4",
      title: "You approve",
      subtitle: "manual by default",
      body: "A human decides. Manual approval is the default; auto-approval only happens when the prover finds no new risk.",
      bullets: ["Human in the loop for new reach", "Auto-approve only when no new risk is found"],
      link: { label: "Policy advisor", href: DOCS + "/how-it-works/policies/advisor" },
      related: ["prover-check", "reload"]
    },
    reload: {
      group: "lifecycle",
      kicker: "Policy lifecycle · 1 of 4",
      title: "Policy reloads",
      subtitle: "supervisor retries",
      body: "The approved policy is delivered to the supervisor, which reloads it and retries the original request.",
      bullets: ["Approved policy pushed to the supervisor", "Requests resume without restarting the agent"],
      link: { label: "Policies", href: DOCS + "/how-it-works/policies/overview" },
      related: ["approve", "supervisor"]
    }
  };

  /* The eight components from the architecture table, as landing-page cards. */
  var components = [
    {
      id: "sandbox",
      icon: "box",
      title: "Sandbox",
      summary:
        "Lives inside the boundary with the agent. It owns the agent's processes, knows which program made each request, applies process controls, and forwards TCP and DNS traffic to the supervisor.",
      nodes: ["sandbox", "agent"],
      link: { label: "Inside the boundary", href: DOCS + "/about/architecture#inside-the-sandbox-boundary" }
    },
    {
      id: "fence",
      icon: "shield",
      title: "Outer network fence",
      summary:
        "Denies all network egress from the workload except its protected connection to the supervisor. Each runtime builds this with its own native tools.",
      nodes: ["fence"],
      link: { label: "Deny-by-default egress", href: DOCS + "/security/best-practices#deny-by-default-egress" }
    },
    {
      id: "supervisor",
      icon: "cpu",
      title: "Supervisor",
      summary:
        "Lives on the trusted side of the boundary. It checks requests against policy, supplies credentials, resolves DNS, opens approved connections, and keeps the link to the gateway alive. One isolation backend interface works with every runtime.",
      nodes: ["supervisor"],
      link: { label: "Inside the boundary", href: DOCS + "/about/architecture#inside-the-sandbox-boundary" }
    },
    {
      id: "policies",
      icon: "file",
      title: "Policies",
      summary:
        "Describe what the agent can touch: files, processes, network destinations, API calls, and where provider credentials can go.",
      nodes: ["propose", "approve", "reload"],
      link: { label: "Policies overview", href: DOCS + "/how-it-works/policies/overview" }
    },
    {
      id: "providers",
      icon: "key",
      title: "Providers",
      summary:
        "Connect a service name to a stored credential. The supervisor hands that credential out only where policy allows it.",
      nodes: ["supervisor", "services", "models"],
      link: { label: "Providers overview", href: DOCS + "/how-it-works/providers/overview" }
    },
    {
      id: "policy-prover",
      icon: "gauge",
      title: "Policy prover",
      summary:
        "Runs in the gateway and uses formal verification to check agent-proposed network rules. Any finding blocks auto-approval. It also ships as the standalone openshell-prover command for CI.",
      nodes: ["policy-prover", "prover-check"],
      link: { label: "Policy prover", href: DOCS + "/how-it-works/policies/prover" }
    },
    {
      id: "gateway",
      icon: "server",
      title: "Gateway",
      summary:
        "Checks who you are and remembers everything about your sandboxes. It delivers policy and settings, attaches providers, decides who can do what, and coordinates connections into sandboxes.",
      nodes: ["api-server", "durable-state", "compute-driver", "policy-prover"],
      link: { label: "Gateways overview", href: DOCS + "/how-it-works/gateways/overview" }
    },
    {
      id: "compute-runtime",
      icon: "layers",
      title: "Compute runtime",
      summary:
        "Creates the sandbox, starts the supervisor and the workload, sets up the private channel between them, and builds the network fence. It reports status back and cleans up when the sandbox goes away.",
      nodes: ["compute-driver", "fence", "sandbox"],
      link: { label: "Runtimes", href: DOCS + "/how-it-works/sandboxes/runtimes" }
    }
  ];

  var sdks = [
    { name: "Python", install: "uv add openshell", note: "Bindings and CLI packaging" },
    { name: "TypeScript", install: "npm install @nvidia/openshell-sdk", note: "GitHub Packages" },
    { name: "Go", install: "go get github.com/NVIDIA/OpenShell/sdk/go@latest", note: "Go module" },
    { name: "Rust", install: "cargo add openshell-sdk --git https://github.com/NVIDIA/OpenShell", note: "Pinned to a release tag" }
  ];

  var pillars = [
    {
      icon: "shield",
      title: "Kernel-level enforcement",
      body: "Each agent runs in an isolated sandbox. Kernel controls confine which files it can access and which system calls it can make, and every network connection passes through a policy check before it leaves the sandbox. Agents never see real credentials; OpenShell adds them only to requests bound for approved endpoints."
    },
    {
      icon: "prover",
      title: "Formally verified policy changes",
      body: "Before a policy change is approved, OpenShell uses formal verification to flag risky new access it would grant, such as reaching a new host with credentials or calling a new API method, so those changes wait for human review."
    }
  ];

  /*
   * Order used by the diagram's auto-play tour. Each id must exist in `nodes`.
   * The sequence follows a request: a user starts at the CLI, the gateway places
   * the sandbox and verifies policy, the workload is fenced off from the network,
   * the supervisor mediates approved reach, and policy changes loop back.
   */
  var tour = [
    "cli",
    "api-server",
    "policy-prover",
    "compute-driver",
    "sandbox",
    "agent",
    "fence",
    "supervisor",
    "services",
    "propose",
    "approve",
    "reload"
  ];

  window.OS_DATA = {
    brand: {
      name: "OpenShell",
      tagline: "The safe, private runtime for fleets of autonomous AI agents",
      repo: "https://github.com/NVIDIA/OpenShell",
      docs: DOCS,
      install: "curl -LsSf https://raw.githubusercontent.com/NVIDIA/OpenShell/main/install.sh | sh"
    },
    nodes: nodes,
    components: components,
    sdks: sdks,
    pillars: pillars,
    tour: tour
  };
})();
