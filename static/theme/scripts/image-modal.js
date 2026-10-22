const articleContent = document.querySelector(".article-content");

export const initImageModal = () => {
    if (!articleContent) return;

    const images = articleContent.querySelectorAll("img");
    if (!images.length) return;

    const modal = document.createElement("div");
    modal.className = "image-modal";
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    const closeIcon = new URL("../../x.svg", import.meta.url).href;
    modal.innerHTML = `
      <div class="image-modal-backdrop" data-image-modal-close></div>
      <figure class="image-modal-dialog" role="dialog" aria-modal="true" aria-label="Imagem ampliada">
        <button class="image-modal-close" type="button" aria-label="Fechar imagem" data-image-modal-close>
          <img src="${closeIcon}" alt="" aria-hidden="true">
        </button>
        <img class="image-modal-image" alt="">
        <figcaption class="image-modal-caption"></figcaption>
      </figure>
    `;
    document.body.appendChild(modal);

    const modalImage = modal.querySelector(".image-modal-image");
    const modalCaption = modal.querySelector(".image-modal-caption");
    const closeButton = modal.querySelector(".image-modal-close");
    let activeImage = null;

    const closeModal = () => {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("image-modal-open");
      if (activeImage) {
        activeImage.focus();
        activeImage = null;
      }
    };

    const openModal = (image) => {
      activeImage = image;
      modalImage.src = image.currentSrc || image.src;
      modalImage.alt = image.alt;
      modalCaption.textContent = image.alt;
      modalCaption.hidden = !image.alt;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("image-modal-open");
      closeButton.focus();
    };

    images.forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", image.alt ? `Ampliar imagem: ${image.alt}` : "Ampliar imagem");
      image.addEventListener("click", (event) => {
        event.preventDefault();
        openModal(image);
      });
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openModal(image);
        }
      });
    });

    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-image-modal-close]")) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeModal();
    });
  };
