import {
  buildArticleToc,
  updateProgress,
  updateReadingTime,
} from "./theme/scripts/content.js";
import { initImageModal } from "./theme/scripts/image-modal.js";
import { initMobileMenu } from "./theme/scripts/navigation.js";
import { initSearch } from "./theme/scripts/search.js";

document.addEventListener("DOMContentLoaded", () => {
  updateProgress();
  updateReadingTime();
  buildArticleToc();
  initMobileMenu();
  initSearch();
  initImageModal();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
});
