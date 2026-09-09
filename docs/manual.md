---
layout: page
title: Manual
permalink: /manual/
ext-js:
  - "/assets/js/manual.js"
---

<button id="toc-toggle" class="toc-toggle" aria-label="Toggle table of contents">
  <i class="fa fa-bars"></i> Contents
</button>

<div class="toc-layout">
  <nav class="toc-sidebar" id="toc-sidebar">
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

  <div class="toc-content">
    {% for entry in site.manual %}
    <section id="{{ entry.slug }}">
      <h1><i class="{{ entry.icon }}"></i> {{ entry.title }}</h1>
      {{ entry.content }}
    </section>
    {% endfor %}
  </div>
</div>

