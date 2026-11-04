// Hide carousel arrows when every card already fits on screen.
(() => {
  const update = () => document.querySelectorAll("[data-carousel]").forEach(car => {
    const track = car.querySelector(".car-track"), nav = car.querySelector(".car-nav");
    if (track && nav) nav.hidden = track.scrollWidth <= track.clientWidth + 2;
  });
  addEventListener("resize", update);
  addEventListener("load", update);
  update();
})();
