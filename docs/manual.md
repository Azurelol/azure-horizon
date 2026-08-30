---
layout: page
title: Manual
permalink: /manual/
---

<div class="entry__grid">
{% for entry in site.manual %}
<article>
<a href="{{ site.baseurl }}{{ entry.url }}">
<i class="{{ entry.icon }}"></i>
  <span>{{ entry.title }}</span>
</a>
</article>
{% endfor %}
</div>

