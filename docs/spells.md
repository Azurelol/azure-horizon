---
layout: page
title: Spells
permalink: /spells/
---

<ul>
{% for entry in site.spells %}
  <li><a href="{{ site.baseurl }}{{ entry.url }}">{{ entry.title }}</a></li>
{% endfor %}
</ul>
