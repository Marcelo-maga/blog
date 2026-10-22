export const initSearch = () => {
    const overlay = document.querySelector("[data-search-overlay]");
    const input = document.querySelector("[data-search-input]");
    const resultsEl = document.querySelector("[data-search-results]");
    const statusEl = document.querySelector("[data-search-status]");
    const openButtons = document.querySelectorAll("[data-search-open]");
    const closeButton = document.querySelector("[data-search-close]");

    if (!overlay || !input || !resultsEl || !statusEl || !openButtons.length) return;

    let index = [];
    let currentResults = [];
    let activeIndex = 0;
    let loaded = false;

    const normalize = (value) =>
      String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const escapeHtml = (value) =>
      String(value || "").replace(/[&<>"']/g, (char) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
      ));

    const itemType = (item) => {
      if (item.slug === "about" || item.slug === "grafo") return "PAGINA";
      return "POST";
    };

    const itemText = (item) => {
      const fallback = item.html || "";
      return item.description && item.description !== "null" ? item.description : fallback;
    };

    const scoreItem = (item, terms, rawQuery) => {
      const title = normalize(item.title);
      const tags = normalize((item.tags || []).join(" "));
      const text = normalize(itemText(item));
      let score = 0;

      for (const term of terms) {
        if (title === term) score += 90;
        else if (title.startsWith(term)) score += 55;
        else if (title.includes(term)) score += 35;
        if (tags.includes(term)) score += 22;
        if (text.includes(term)) score += 8;
      }

      if (normalize(item.title).includes(rawQuery)) score += 20;
      return score;
    };

    const setActiveResult = (nextIndex) => {
      const items = Array.from(resultsEl.querySelectorAll(".search-result"));
      activeIndex = Math.max(0, Math.min(nextIndex, items.length - 1));
      items.forEach((item, index) => {
        item.classList.toggle("search-result-active", index === activeIndex);
      });
    };

    const render = () => {
      const query = input.value.trim();
      const normalizedQuery = normalize(query);
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);

      resultsEl.innerHTML = "";

      if (!query) {
        currentResults = [];
        statusEl.textContent = loaded ? "Digite para buscar no vault." : "Carregando indice...";
        return;
      }

      currentResults = index
        .map((item) => ({ item, score: scoreItem(item, terms, normalizedQuery) }))
        .filter((result) => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((result) => result.item);

      statusEl.textContent = currentResults.length
        ? `${currentResults.length} resultado${currentResults.length === 1 ? "" : "s"}`
        : "Nenhum resultado encontrado.";

      currentResults.forEach((item) => {
        const href = `${item.slug}.html`;
        const tags = (item.tags || []).slice(0, 2);
        const summary = itemText(item).replace(/\s+/g, " ").trim();
        const article = document.createElement("a");
        article.className = "search-result";
        article.href = href;
        article.innerHTML = `
          <span class="search-result-type">${itemType(item)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(summary).slice(0, 190)}</small>
          <span class="search-result-tags">${tags.map((tag) => `#${escapeHtml(tag)}`).join(" ")}</span>
        `;
        resultsEl.appendChild(article);
      });

      setActiveResult(0);
    };

    const loadIndex = async () => {
      if (loaded) return;
      try {
        const response = await fetch(document.body.dataset.searchIndex || "static/search_index.json");
        index = await response.json();
        loaded = true;
        render();
      } catch (error) {
        console.error("Não foi possível carregar o índice de busca.", error);
        statusEl.textContent = "Busca indisponivel neste build.";
      }
    };

    const openSearch = () => {
      overlay.hidden = false;
      document.body.classList.add("search-open");
      loadIndex();
      requestAnimationFrame(() => input.focus());
    };

    const closeSearch = () => {
      overlay.hidden = true;
      document.body.classList.remove("search-open");
      input.value = "";
      render();
    };

    openButtons.forEach((button) => button.addEventListener("click", openSearch));
    closeButton?.addEventListener("click", closeSearch);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeSearch();
    });
    input.addEventListener("input", render);

    document.addEventListener("keydown", (event) => {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        openSearch();
        return;
      }

      if (overlay.hidden) return;

      if (event.key === "Escape") {
        closeSearch();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveResult(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveResult(activeIndex - 1);
      } else if (event.key === "Enter" && currentResults[activeIndex]) {
        window.location.href = `${currentResults[activeIndex].slug}.html`;
      }
    });
  };
