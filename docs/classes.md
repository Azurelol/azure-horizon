---
layout: page
title: Classes
permalink: /classes/
---

<div class="class__grid">
{% for entry in site.classes %}
<article>
<a href="{{ site.baseurl }}{{ entry.url }}">
  {{ entry.title }}
  <img src="{{ site.baseurl }}/assets/icons/classes/{{entry.id}}/{{entry.id}}.png" alt="classes" />
</a>
</article>
{% endfor %}
</div>
