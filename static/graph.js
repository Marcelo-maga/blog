(() => {
  const canvas = document.getElementById("vault-graph");
  if (!canvas) return;

  const wrap = canvas.closest(".graph-canvas-wrap");
  const tooltip = document.querySelector("[data-graph-tooltip]");
  const resetButton = document.querySelector("[data-graph-reset]");
  const labelsButton = document.querySelector("[data-graph-labels]");
  const ctx = canvas.getContext("2d");
  const colors = {
    note: "#b8b8b8",
    article: "#e6df66",
    tag: "#39d071",
  };

  let graph = { nodes: [], edges: [] };
  let width = 0;
  let height = 0;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let alpha = 1;
  let hovered = null;
  let dragged = null;
  let panning = false;
  let panStart = null;
  let pressTarget = null;
  let pressPoint = null;
  let didMove = false;
  let fitted = false;
  let showLabels = false;
  let pointer = { x: 0, y: 0 };

  function resize() {
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = Math.max(320, rect.width);
    height = Math.max(360, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetLayout() {
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    fitted = false;
    const cx = width / 2;
    const cy = height / 2;
    const groups = {
      tag: graph.nodes.filter((node) => node.kind === "tag"),
      article: graph.nodes.filter((node) => node.kind === "article"),
      note: graph.nodes.filter((node) => node.kind === "note"),
    };
    const outerRadius = Math.min(width, height) * 0.34;
    const noteRadius = Math.max(96, outerRadius);
    const tagRadius = Math.max(34, outerRadius * 0.34);
    const articleRadius = Math.max(64, outerRadius * 0.56);

    function placeRing(nodes, radius, angleOffset) {
      nodes.forEach((node, index) => {
        const angle = angleOffset + (index / Math.max(1, nodes.length)) * Math.PI * 2;
        const jitter = (index % 3) * 7;
        node.x = cx + Math.cos(angle) * (radius + jitter);
        node.y = cy + Math.sin(angle) * (radius + jitter);
        node.vx = 0;
        node.vy = 0;
      });
    }

    placeRing(groups.tag, tagRadius, -Math.PI / 2);
    placeRing(groups.article, articleRadius, Math.PI / 5);
    placeRing(groups.note, noteRadius, 0);
    graph.nodes.forEach((node) => {
      node.vx = 0;
      node.vy = 0;
    });
    alpha = 1;
    for (let i = 0; i < 90; i++) tick();
    fitToView();
    fitted = true;
  }

  function fitToView() {
    if (!graph.nodes.length) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of graph.nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    }
    const graphWidth = Math.max(1, maxX - minX);
    const graphHeight = Math.max(1, maxY - minY);
    const padding = Math.min(96, Math.max(36, width * 0.08));
    scale = Math.min(
      1.35,
      Math.max(0.42, Math.min((width - padding * 2) / graphWidth, (height - padding * 2) / graphHeight))
    );
    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;
    offsetX = width / 2 - graphCenterX * scale;
    offsetY = height / 2 - graphCenterY * scale;
  }

  function prepare(data) {
    const byId = new Map();
    graph.nodes = data.nodes.map((node) => ({
      ...node,
      radius: node.kind === "tag" ? 5.2 : node.kind === "article" ? 5.6 : 4.6,
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
    }));
    graph.nodes.forEach((node) => byId.set(node.id, node));
    graph.edges = data.edges
      .map((edge) => ({ ...edge, sourceNode: byId.get(edge.source), targetNode: byId.get(edge.target) }))
      .filter((edge) => edge.sourceNode && edge.targetNode);
    resetLayout();
  }

  function tick() {
    const nodes = graph.nodes;
    const edges = graph.edges;
    const centerStrength = 0.012 * alpha;
    const linkStrength = 0.04 * alpha;
    const repelStrength = 55 * alpha;
    const cx = width / 2;
    const cy = height / 2;

    for (const edge of edges) {
      const a = edge.sourceNode;
      const b = edge.targetNode;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const target = edge.kind === "tag" ? 58 : 82;
      const force = (distance - target) * linkStrength;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      if (!a.fixed) { a.vx += fx; a.vy += fy; }
      if (!b.fixed) { b.vx -= fx; b.vy -= fy; }
    }

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x - a.x || 0.01;
        const dy = b.y - a.y || 0.01;
        const distanceSq = Math.max(80, dx * dx + dy * dy);
        const force = repelStrength / distanceSq;
        const fx = dx * force;
        const fy = dy * force;
        if (!a.fixed) { a.vx -= fx; a.vy -= fy; }
        if (!b.fixed) { b.vx += fx; b.vy += fy; }
      }
    }

    for (const node of nodes) {
      if (!node.fixed) {
        node.vx += (cx - node.x) * centerStrength;
        node.vy += (cy - node.y) * centerStrength;
        const dx = node.x - cx;
        const dy = node.y - cy;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const maxRadius = Math.min(width, height) * 0.39;
        if (distance > maxRadius) {
          const pull = (distance - maxRadius) * 0.018 * alpha;
          node.vx -= (dx / distance) * pull;
          node.vy -= (dy / distance) * pull;
        }
        node.vx *= 0.86;
        node.vy *= 0.86;
        node.x += node.vx;
        node.y += node.vy;
      }
    }
    alpha = Math.max(0.02, alpha * 0.992);
  }

  function toScreen(node) {
    return {
      x: node.x * scale + offsetX,
      y: node.y * scale + offsetY,
    };
  }

  function fromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function findNode(point) {
    for (let i = graph.nodes.length - 1; i >= 0; i--) {
      const node = graph.nodes[i];
      const p = toScreen(node);
      const radius = Math.max(9, node.radius * scale + 5);
      if (Math.hypot(point.x - p.x, point.y - p.y) <= radius) return node;
    }
    return null;
  }

  function draw() {
    tick();
    if (!fitted && alpha < 0.18) {
      fitToView();
      fitted = true;
    }
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.lineWidth = 1 / scale;
    for (const edge of graph.edges) {
      ctx.strokeStyle = edge.kind === "tag" ? "rgba(57, 208, 113, 0.2)" : "rgba(185, 185, 185, 0.18)";
      ctx.beginPath();
      ctx.moveTo(edge.sourceNode.x, edge.sourceNode.y);
      ctx.lineTo(edge.targetNode.x, edge.targetNode.y);
      ctx.stroke();
    }

    for (const node of graph.nodes) {
      ctx.fillStyle = colors[node.kind] || colors.note;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node === hovered ? node.radius + 2.5 : node.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (showLabels || hovered) {
      ctx.font = `${12 / scale}px Inter, sans-serif`;
      ctx.textBaseline = "middle";
      for (const node of graph.nodes) {
        if (!showLabels && node !== hovered) continue;
        ctx.fillStyle = "rgba(229, 226, 225, 0.92)";
        ctx.fillText(node.label, node.x + node.radius + 7, node.y);
      }
    }
    ctx.restore();

    if (hovered && tooltip) {
      tooltip.hidden = false;
      tooltip.textContent = hovered.label;
      tooltip.style.transform = `translate(${pointer.x + 14}px, ${pointer.y + 14}px)`;
    } else if (tooltip) {
      tooltip.hidden = true;
    }
    requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointermove", (event) => {
    pointer = fromEvent(event);
    if (pressPoint && Math.hypot(pointer.x - pressPoint.x, pointer.y - pressPoint.y) > 5) {
      didMove = true;
    }
    if (dragged) {
      dragged.x = (pointer.x - offsetX) / scale;
      dragged.y = (pointer.y - offsetY) / scale;
      dragged.vx = 0;
      dragged.vy = 0;
      alpha = 0.4;
      return;
    }
    if (panning && panStart) {
      offsetX = panStart.offsetX + pointer.x - panStart.x;
      offsetY = panStart.offsetY + pointer.y - panStart.y;
      return;
    }
    hovered = findNode(pointer);
    canvas.style.cursor = hovered ? "pointer" : "grab";
  });

  canvas.addEventListener("pointerdown", (event) => {
    pointer = fromEvent(event);
    dragged = findNode(pointer);
    pressTarget = dragged;
    pressPoint = pointer;
    didMove = false;
    if (dragged) {
      dragged.fixed = true;
      canvas.setPointerCapture(event.pointerId);
    } else {
      panning = true;
      panStart = { x: pointer.x, y: pointer.y, offsetX, offsetY };
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(event.pointerId);
    }
  });

  canvas.addEventListener("pointerup", (event) => {
    const releasedOn = findNode(pointer);
    const shouldOpen = pressTarget && releasedOn === pressTarget && !didMove && pressTarget.url;
    if (dragged) {
      dragged.fixed = false;
      dragged = null;
    }
    panning = false;
    panStart = null;
    canvas.style.cursor = hovered ? "pointer" : "grab";
    canvas.releasePointerCapture(event.pointerId);
    if (shouldOpen) window.location.href = pressTarget.url;
    pressTarget = null;
    pressPoint = null;
  });

  canvas.addEventListener("dblclick", () => {
    if (hovered && hovered.url) window.location.href = hovered.url;
  });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const next = Math.min(2.2, Math.max(0.55, scale + (event.deltaY > 0 ? -0.08 : 0.08)));
    const point = fromEvent(event);
    offsetX = point.x - ((point.x - offsetX) / scale) * next;
    offsetY = point.y - ((point.y - offsetY) / scale) * next;
    scale = next;
  }, { passive: false });

  resetButton?.addEventListener("click", resetLayout);
  labelsButton?.addEventListener("click", () => {
    showLabels = !showLabels;
    labelsButton.classList.toggle("graph-button-active", showLabels);
  });

  window.addEventListener("resize", () => {
    resize();
    resetLayout();
  });

  resize();
  fetch("static/graph-data.json")
    .then((response) => response.json())
    .then((data) => {
      prepare(data);
      requestAnimationFrame(draw);
    })
    .catch(() => {
      if (tooltip) {
        tooltip.hidden = false;
        tooltip.textContent = "Não foi possível carregar o grafo.";
      }
    });
})();
