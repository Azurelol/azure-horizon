---
layout: collection
title: Gallery
permalink: /gallery/
ext-css:
  - https://cdn.jsdelivr.net/npm/glightbox/dist/css/glightbox.min.css
after-content:
  - glightbox-init.html
---

<div class="gallery">
{% for image in site.static_files %}
  {% if image.path contains 'assets/img/gallery' %}
    <a href="{{ image.path | relative_url }}" class="glightbox" data-gallery="gallery1">
      <img src="{{ image.path | relative_url }}" alt="{{ image.basename }}">
    </a>
  {% endif %}
{% endfor %}
</div>
