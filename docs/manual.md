---
layout: page
title: Manual
permalink: /manual/
---

<ul>
{% for page in site.manual %}
  <li><a href="{{ site.baseurl }}{{ page.url }}">{{ page.title }}</a></li>
{% endfor %}
</ul>

