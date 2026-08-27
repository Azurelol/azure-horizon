---
layout: page
title: Classes
permalink: /classes/
---

<div class="class__grid">
{% for entry in site.classes %}
<article>
<a href="{{ site.baseurl }}{{ entry.url }}">
<img src="{{ site.baseurl }} {{ entry.img }}" />
  {{ entry.title }}
</a>
</article>
{% endfor %}
</div>
