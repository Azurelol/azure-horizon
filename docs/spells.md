---
layout: page
title: Spells
permalink: /spells/
---

<div class="entry__grid --large">
{% for entry in site.spells %}
<article>
<a href="{{ site.baseurl }}{{ entry.url }}">
<img src="{{ site.baseurl }}{{ entry.img }}" />
  <span>{{ entry.title }}</span>
</a>
</article>
{% endfor %}
</div>
