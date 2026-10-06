---
layout: collection
title: Equipment
permalink: /equipment/
---

<div class="entry__grid --large">
{% for entry in site.equipment %}
<article>
<a href="{{ site.baseurl }}{{ entry.url }}">
<img src="{{ site.baseurl }}{{ entry.img }}" />
  <span>{{ entry.title }}</span>
</a>
</article>
{% endfor %}
</div>
