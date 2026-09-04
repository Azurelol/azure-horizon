---
layout: default
title: Gallery
permalink: /gallery/
---

<div class="gallery">
{% for image in site.static_files %}
  {% if image.path contains 'assets/img/gallery' %}
    <img src="{{ image.path | relative_url }}" alt="{{ image.basename }}">
  {% endif %}
{% endfor %}
</div>
