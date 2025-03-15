document.addEventListener("DOMContentLoaded", function () {
    if (document.title.includes("404")) {
        const primeiraDiv = document.querySelector("div");
        primeiraDiv.classList.add("main-404");
    }
});
