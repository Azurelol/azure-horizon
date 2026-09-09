document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".toc-link");
  const sections = document.querySelectorAll(".toc-content section");
  const sidebar = document.getElementById("toc-sidebar");
  const toggle = document.getElementById("toc-toggle");
  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
  // Close the drawer after picking a section (mobile only)
  links.forEach((link) => {
    link.addEventListener("click", () => {
      sidebar.classList.remove("open");
    });
  });
  // Close if tapping outside the open sidebar
  document.addEventListener("click", (e) => {
    if (
      sidebar.classList.contains("open") &&
      !sidebar.contains(e.target) &&
      e.target !== toggle &&
      !toggle.contains(e.target)
    ) {
      sidebar.classList.remove("open");
    }
  });
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
