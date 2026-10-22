const progress = document.getElementById("reading-progress");
const articleContent = document.querySelector(".article-content");

export const updateProgress = () => {
    if (!progress) return;

    const scrollTop = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const width = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;

    progress.style.width = `${Math.min(100, Math.max(0, width))}%`;
  };

export const updateReadingTime = () => {
    const target = document.querySelector("[data-reading-time]");
    if (!target || !articleContent) return;

    const text = articleContent.textContent || "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    target.textContent = `${minutes} MIN LEITURA`;
  };

export const buildArticleToc = () => {
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
