/* ✨ Animation Header au Scroll */
window.onscroll = function() {
    var header = document.querySelector("header");
    if (window.scrollY > 50) {
        header.style.background = "rgba(139, 0, 0, 1)";
    } else {
        header.style.background = "rgba(139, 0, 0, 0.9)";
    }
};