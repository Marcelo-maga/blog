+++
title = "Grafo"
description = "Mapa visual das notas, artigos, tags e links do vault."
slug = "grafo"
+++

<section class="graph-view" data-graph-view>
  <div class="graph-toolbar">
    <div class="graph-legend" aria-label="Legenda do grafo">
      <span><i class="graph-dot graph-dot-note"></i>Notas</span>
      <span><i class="graph-dot graph-dot-article"></i>Artigos</span>
      <span><i class="graph-dot graph-dot-tag"></i>Tags</span>
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
