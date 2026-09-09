---
layout: page
title: Manual
permalink: /manual/
ext-js:
  - "/assets/js/manual.js"
---

<div class="toc-layout">
  <nav class="toc-sidebar">
    <h2>Contents</h2>
    <ul>
      {% for entry in site.manual %}
      <li>
        <a href="#{{ entry.slug }}" class="toc-link" data-target="{{ entry.slug }}">
          <i class="{{ entry.icon }}"></i>
          <span>{{ entry.title }}</span>
        </a>
      </li>
      {% endfor %}
    </ul>
  </nav>

  <main class="toc-content">
    {% for entry in site.manual %}
    <section id="{{ entry.slug }}">
      <h1><i class="{{ entry.icon }}"></i> {{ entry.title }}</h1>
      {{ entry.content }}
    </section>
    {% endfor %}
  </main>
</div>

