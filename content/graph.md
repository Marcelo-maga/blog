+++
title = "Grafo"
description = "Mapa visual dos posts, tags e links do vault."
slug = "grafo"
+++

<section class="graph-view" data-graph-view>
  <div class="graph-toolbar">
    <div class="graph-legend" aria-label="Legenda do grafo">
      <span><span class="graph-dot graph-dot-post" aria-hidden="true"></span>Posts</span>
      <span><span class="graph-dot graph-dot-tag" aria-hidden="true"></span>Tags</span>
    </div>
    <div class="graph-actions">
      <button class="graph-button" type="button" data-graph-reset>Centralizar</button>
      <button class="graph-button" type="button" data-graph-labels>Rótulos</button>
    </div>
  </div>
  <div class="graph-canvas-wrap">
    <canvas id="vault-graph" aria-label="Grafo interativo do vault"></canvas>
    <div class="graph-tooltip" data-graph-tooltip hidden></div>
  </div>
</section>

<script src="static/graph.js" defer></script>
