document.addEventListener("DOMContentLoaded", () => {
  const progress = document.getElementById("reading-progress");
  const articleContent = document.querySelector(".article-content");

  const updateProgress = () => {
    if (!progress) return;

    const scrollTop = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const width = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;

    progress.style.width = `${Math.min(100, Math.max(0, width))}%`;
  };

  const updateReadingTime = () => {
    const target = document.querySelector("[data-reading-time]");
    if (!target || !articleContent) return;

    const text = articleContent.textContent || "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    target.textContent = `${minutes} MIN LEITURA`;
  };

  const buildArticleToc = () => {
    const toc = document.querySelector("[data-article-toc]");
    const list = document.querySelector("[data-article-toc-list]");
    if (!toc || !list || !articleContent) return;

    const headings = Array.from(articleContent.querySelectorAll("h1, h2, h3"))
      .map((heading, index) => {
        const anchor = heading.querySelector(".anchor[id]");
        const text = heading.textContent.trim();
        let id = heading.id || anchor?.id;

        if (!id) {
          id = `secao-${index + 1}`;
          heading.id = id;
        }

        return { id, text, level: Number(heading.tagName.slice(1)), heading };
      })
      .filter((item) => item.text);

    if (headings.length < 2) return;

    const links = headings.map((item) => {
      const link = document.createElement("a");
      link.href = `#${item.id}`;
      link.textContent = item.text;
      link.className = `article-toc-link article-toc-level-${Math.min(3, item.level)}`;
      list.appendChild(link);
      return { ...item, link };
    });

    toc.hidden = false;

    const setActive = (id) => {
      links.forEach((item) => {
        item.link.classList.toggle("article-toc-active", item.id === id);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          const current = links.find((item) => item.heading === visible[0].target);
          if (current) setActive(current.id);
        }
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0.01 }
    );

    links.forEach((item) => observer.observe(item.heading));
    setActive(links[0].id);
  };

  const initSearch = () => {
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
      if (item.slug?.startsWith("artigos-")) return "ARTIGO";
      if (item.slug?.startsWith("notas-")) return "NOTA";
      return "PAGINA";
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
      } catch {
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

  updateProgress();
  updateReadingTime();
  buildArticleToc();
  initSearch();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
});
