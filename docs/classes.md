---
layout: collection
title: Classes
permalink: /classes/
---

<div class="entry__grid">
{% for entry in site.classes %}
<article>
<a href="{{ site.baseurl }}{{ entry.url }}">
<img src="{{ site.baseurl }}{{ entry.img }}" />
  <span>{{ entry.title }}</span>
</a>
</article>
{% endfor %}
</div>
