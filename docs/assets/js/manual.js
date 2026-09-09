document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".toc-link");
  const sections = document.querySelectorAll(".toc-content section");

  const setActive = (id) => {
    links.forEach((link) => {
      link.classList.toggle("active", link.dataset.target === id);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    { rootMargin: "-20% 0px -70% 0px" },
  );

  sections.forEach((section) => observer.observe(section));
});
