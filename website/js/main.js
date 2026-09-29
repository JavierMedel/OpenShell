/*
 * SPDX-FileCopyrightText: Copyright (c) 2025-2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Landing-page behaviour: renders component cards, SDK tiles, the pillar copy,
 * and wires the interactive architecture diagram to a detail panel.
 */
(function () {
  "use strict";

  var DATA = window.OS_DATA;

  var ICONS = {
    box: '<path d="M12 3l8 4.6v8.8L12 21l-8-4.6V7.6z"/><path d="M4 7.6l8 4.6 8-4.6M12 12.2V21"/>',
    shield: '<path d="M12 3l7 3v5.5c0 4.6-3 7.7-7 9.5-4-1.8-7-4.9-7-9.5V6z"/><path d="M9 12l2 2 4-4"/>',
    cpu: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M4 10v4M20 10v4M10 4h4M10 20h4M10 2v2M14 2v2M10 20v2M14 20v2M2 10h2M2 14h2M20 10h2M20 14h2"/>',
    file: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8 2 2-2 2 2 2-2 2-2-2-3 3"/>',
    gauge: '<path d="M4 19h16"/><path d="M7 16V9M12 16V5M17 16v-5"/><path d="M12 5l3 3"/>',
    server: '<rect x="3" y="5" width="18" height="6" rx="2"/><rect x="3" y="13" width="18" height="6" rx="2"/><path d="M7 8h.01M7 16h.01"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    prover: '<path d="M12 3l7 3v5.5c0 4.6-3 7.7-7 9.5-4-1.8-7-4.9-7-9.5V6z"/><path d="M12 8v4l2.5 2"/>',
    terminal: '<path d="M5 8l4 4-4 4M13 16h6"/>'
  };

  function icon(name) {
    var body = ICONS[name] || ICONS.box;
    return (
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      body +
      "</svg>"
    );
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ── Detail panel ───────────────────────────────────────────────── */
  var panel;
  var svgEl;
  var lastFocus = null;

  function clearFocus() {
    if (!svgEl) return;
    svgEl.querySelectorAll(".arch-node").forEach(function (n) {
      n.classList.remove("is-active", "is-related", "is-dim");
    });
  }

  function focusNodes(ids, activeId) {
    if (!svgEl) return;
    var set = {};
    (ids || []).forEach(function (i) { set[i] = true; });
    svgEl.querySelectorAll(".arch-node").forEach(function (n) {
      var id = n.getAttribute("data-node");
      if (activeId && id === activeId) {
        n.classList.add("is-active");
        n.classList.remove("is-dim", "is-related");
      } else if (set[id]) {
        n.classList.add("is-related");
        n.classList.remove("is-dim", "is-active");
      } else {
        n.classList.add("is-dim");
        n.classList.remove("is-active", "is-related");
      }
    });
  }

  function emptyPanel() {
    panel.innerHTML =
      '<div class="panel-empty">' +
      '<div class="panel-empty-icon">' + icon("terminal") + "</div>" +
      '<h3>Explore the architecture</h3>' +
      "<p>Select any box in the diagram — or a component card below — to see what it does and where it fits in the boundary.</p>" +
      '<div class="panel-hint">' +
      '<span class="chip chip-green">Kernel-enforced</span>' +
      '<span class="chip">Formally verified</span>' +
      '<span class="chip">Deny-by-default</span>' +
      "</div></div>";
    panel.classList.add("is-empty");
  }

  function relatedChips(ids) {
    if (!ids || !ids.length) return "";
    return (
      '<div class="panel-related"><span class="panel-related-label">Related</span><div class="chips">' +
      ids
        .map(function (id) {
          var n = DATA.nodes[id];
          if (!n) return "";
          return '<button type="button" class="chip chip-btn" data-goto="' + id + '">' + esc(n.title) + "</button>";
        })
        .join("") +
      "</div></div>"
    );
  }

  function renderNode(node) {
    panel.classList.remove("is-empty");
    panel.innerHTML =
      '<article class="panel-detail">' +
      '<div class="panel-col panel-col-a">' +
      '<div class="panel-head">' +
      '<span class="panel-kicker">' + esc(node.kicker || "Architecture") + "</span>" +
      "<h3>" + esc(node.title) + "</h3>" +
      (node.subtitle ? '<span class="panel-sub">' + esc(node.subtitle) + "</span>" : "") +
      "</div>" +
      (node.link
        ? '<a class="panel-link" href="' + node.link.href + '" target="_blank" rel="noopener">' +
          esc(node.link.label) + " " + arrow() + "</a>"
        : "") +
      "</div>" +
      '<div class="panel-col panel-col-b">' +
      '<p class="panel-body">' + esc(node.body) + "</p>" +
      (node.bullets && node.bullets.length
        ? '<ul class="panel-list">' +
          node.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") +
          "</ul>"
        : "") +
      relatedChips(node.related) +
      "</div></article>";
  }

  function showNode(id, opts) {
    var n = DATA.nodes[id];
    if (!n) return;
    lastFocus = id;
    focusNodes([id].concat(n.related || []), id);
    renderNode(Object.assign({ id: id }, n));
    if ((!opts || !opts.noScroll) && window.matchMedia("(max-width: 900px)").matches) {
      scrollToPanel();
    }
  }

  function showComponent(comp) {
    lastFocus = comp.id;
    focusNodes(comp.nodes || [], null);
    panel.classList.remove("is-empty");
    panel.innerHTML =
      '<article class="panel-detail">' +
      '<div class="panel-col panel-col-a">' +
      '<div class="panel-head">' +
      '<span class="panel-kicker">Component</span>' +
      "<h3>" + esc(comp.title) + "</h3>" +
      "</div>" +
      (comp.link
        ? '<a class="panel-link" href="' + comp.link.href + '" target="_blank" rel="noopener">' +
          esc(comp.link.label) + " " + arrow() + "</a>"
        : "") +
      "</div>" +
      '<div class="panel-col panel-col-b">' +
      '<p class="panel-body">' + esc(comp.summary) + "</p>" +
      (comp.nodes && comp.nodes.length
        ? '<div class="panel-related"><span class="panel-related-label">Highlights</span><div class="chips">' +
          comp.nodes
            .map(function (id) {
              var n = DATA.nodes[id];
              return n ? '<button type="button" class="chip chip-btn" data-goto="' + id + '">' + esc(n.title) + "</button>" : "";
            })
            .join("") +
          "</div></div>"
        : "") +
      "</div></article>";
    if (window.matchMedia("(max-width: 900px)").matches) scrollToPanel();
  }

  function arrow() {
    return '<svg class="icon icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  }

  function scrollToPanel() {
    var el = document.getElementById("architecture");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── Auto-play tour ─────────────────────────────────────────────── */
  var tour = DATA.tour && DATA.tour.length ? DATA.tour : Object.keys(DATA.nodes);
  var STEP_MS = 3200;
  var play = { wanted: false, timer: null, idx: 0, anim: null, visible: true, autoStarted: false };

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function updatePlayUi() {
    var btn = document.getElementById("arch-play");
    if (!btn) return;
    btn.classList.toggle("is-playing", play.wanted);
    btn.setAttribute("aria-pressed", play.wanted ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      play.wanted ? "Pause the architecture tour" : "Auto-play the architecture tour"
    );
    var label = btn.querySelector(".play-label");
    if (label) label.textContent = play.wanted ? "Pause" : "Auto-play";
    var count = document.getElementById("tour-count");
    if (count) {
      count.hidden = !play.wanted;
      count.textContent = pad2(play.idx + 1) + " / " + tour.length;
    }
  }

  function cancelBar() {
    if (play.anim) {
      try {
        play.anim.cancel();
      } catch (e) {
        /* animation already finished */
      }
      play.anim = null;
    }
  }

  /* Restart the thin progress bar so it counts down to the next step. */
  function runBar() {
    var bar = document.getElementById("autoplay-bar");
    if (!bar) return;
    cancelBar();
    if (prefersReducedMotion() || typeof bar.animate !== "function") return;
    play.anim = bar.animate([{ width: "0%" }, { width: "100%" }], {
      duration: STEP_MS,
      easing: "linear",
      fill: "forwards"
    });
  }

  function clearBar() {
    cancelBar();
    var bar = document.getElementById("autoplay-bar");
    if (bar) bar.style.width = "0%";
  }

  function tourStep() {
    showNode(tour[play.idx % tour.length], { noScroll: true });
    updatePlayUi();
    runBar();
    play.idx = (play.idx + 1) % tour.length;
  }

  function stopTimer() {
    if (play.timer) {
      clearInterval(play.timer);
      play.timer = null;
    }
    clearBar();
  }

  function startTimer() {
    if (play.timer || !play.visible || document.hidden) return;
    play.timer = setInterval(tourStep, STEP_MS);
    runBar();
  }

  function startAutoplay() {
    play.wanted = true;
    updatePlayUi();
    tourStep();
    startTimer();
  }

  /* Stop the tour because the visitor took over. */
  function stopAutoplay() {
    play.wanted = false;
    stopTimer();
    updatePlayUi();
  }

  function syncTimer() {
    if (play.wanted && play.visible && !document.hidden) startTimer();
    else stopTimer();
  }

  /* ── Render content ─────────────────────────────────────────────── */
  function renderPillars() {
    var host = document.getElementById("pillars");
    if (!host) return;
    host.innerHTML = DATA.pillars
      .map(function (p, i) {
        return (
          '<article class="pillar reveal">' +
          '<div class="pillar-top"><span class="pillar-icon">' + icon(p.icon) + "</span>" +
          '<span class="pillar-num">0' + (i + 1) + "</span></div>" +
          "<h3>" + esc(p.title) + "</h3>" +
          "<p>" + esc(p.body) + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderComponents() {
    var host = document.getElementById("component-grid");
    if (!host) return;
    host.innerHTML = DATA.components
      .map(function (c, i) {
        var idx = (i + 1 < 10 ? "0" : "") + (i + 1);
        return (
          '<button type="button" class="component-card reveal" data-component="' + c.id + '">' +
          '<span class="component-index">' + idx + "</span>" +
          '<span class="component-icon">' + icon(c.icon) + "</span>" +
          "<h3>" + esc(c.title) + "</h3>" +
          "<p>" + esc(c.summary) + "</p>" +
          '<span class="component-cta">Show in diagram ' + arrow() + "</span>" +
          "</button>"
        );
      })
      .join("");
  }

  function renderSdks() {
    var host = document.getElementById("sdk-grid");
    if (!host) return;
    host.innerHTML = DATA.sdks
      .map(function (s) {
        return (
          '<div class="sdk-card reveal">' +
          '<div class="sdk-head"><span class="sdk-name">' + esc(s.name) + "</span>" +
          '<span class="sdk-note">' + esc(s.note) + "</span></div>" +
          '<code class="sdk-install">' + esc(s.install) + "</code>" +
          "</div>"
        );
      })
      .join("");
  }

  /* ── Copy button ────────────────────────────────────────────────── */
  function wireCopy() {
    var btn = document.getElementById("copy-install");
    var code = document.getElementById("install-cmd");
    if (!btn || !code) return;
    btn.addEventListener("click", function () {
      var text = code.textContent.trim();
      var done = function () {
        btn.classList.add("is-copied");
        btn.setAttribute("aria-label", "Copied");
        var label = btn.querySelector(".copy-label");
        var prev = label ? label.textContent : "";
        if (label) label.textContent = "Copied";
        setTimeout(function () {
          btn.classList.remove("is-copied");
          if (label) label.textContent = prev;
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else {
        done();
      }
    });
  }

  /* ── Nav ────────────────────────────────────────────────────────── */
  function wireNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) nav.classList.remove("is-open");
      });
    }

    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);
    if (!("IntersectionObserver" in window) || !sections.length) return;
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = "#" + entry.target.id;
          links.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { obs.observe(s); });
  }

  /* ── Reveal on scroll ───────────────────────────────────────────── */
  function wireReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("is-visible"); });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e, idx) {
          if (!e.isIntersecting) return;
          var el = e.target;
          setTimeout(function () { el.classList.add("is-visible"); }, idx * 45);
          obs.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    items.forEach(function (i) { obs.observe(i); });
  }

  /* ── Boot ───────────────────────────────────────────────────────── */
  function init() {
    renderPillars();
    renderComponents();
    renderSdks();
    wireCopy();
    wireNav();

    var stage = document.getElementById("arch-stage");
    panel = document.getElementById("arch-panel");
    if (stage && panel) {
      svgEl = window.OpenShellArchitecture.render(stage);
      emptyPanel();

      stage.addEventListener("click", function (e) {
        var g = e.target.closest(".arch-node");
        if (!g) return;
        stopAutoplay();
        showNode(g.getAttribute("data-node"));
      });
      stage.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        var g = e.target.closest(".arch-node");
        if (!g) return;
        e.preventDefault();
        stopAutoplay();
        showNode(g.getAttribute("data-node"));
      });
      panel.addEventListener("click", function (e) {
        var b = e.target.closest("[data-goto]");
        if (!b) return;
        stopAutoplay();
        showNode(b.getAttribute("data-goto"));
      });

      var playBtn = document.getElementById("arch-play");
      if (playBtn) {
        playBtn.addEventListener("click", function () {
          if (play.wanted) stopAutoplay();
          else startAutoplay();
        });
      }

      var archSection = document.getElementById("architecture");
      if (archSection && "IntersectionObserver" in window) {
        var archObs = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              play.visible = entry.isIntersecting;
              if (!entry.isIntersecting) {
                stopTimer();
                return;
              }
              if (!play.autoStarted && !play.wanted && !prefersReducedMotion()) {
                play.autoStarted = true;
                startAutoplay();
              } else {
                syncTimer();
              }
            });
          },
          { threshold: 0.25 }
        );
        archObs.observe(archSection);
      }

      document.addEventListener("visibilitychange", syncTimer);
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && play.wanted) stopAutoplay();
      });
    }

    document.addEventListener("click", function (e) {
      var card = e.target.closest("[data-component]");
      if (!card) return;
      var comp = DATA.components.filter(function (c) { return c.id === card.getAttribute("data-component"); })[0];
      if (!comp) return;
      stopAutoplay();
      document.querySelectorAll(".component-card").forEach(function (c) { c.classList.remove("is-selected"); });
      card.classList.add("is-selected");
      showComponent(comp);
      scrollToPanel();
    });

    var reset = document.getElementById("arch-reset");
    if (reset) {
      reset.addEventListener("click", function () {
        stopAutoplay();
        clearFocus();
        document.querySelectorAll(".component-card").forEach(function (c) { c.classList.remove("is-selected"); });
        emptyPanel();
      });
    }

    wireReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
