---
title: "Adventures"
permalink: /adventures/
classes: single
header:
  image: "/images/BG_Home.png"
---

<p><a class="btn btn--primary" href="{{ '/admin/' | relative_url }}">Add new post</a> <small>Owner access</small></p>

{% assign adventures = site.pages | where: "adventure", true | sort: "adventure_date" | reverse %}
{% for adventure in adventures %}
<article>
  <h2><a href="{{ adventure.url | relative_url }}">{{ adventure.title | escape }}</a></h2>
  <p><time datetime="{{ adventure.adventure_date }}">{{ adventure.adventure_date | date: "%b %-d, %Y" }}</time></p>
  {% if adventure.cover and adventure.cover != "" %}
  <a href="{{ adventure.url | relative_url }}"><img src="{{ adventure.cover | relative_url | escape }}" alt="{{ adventure.title | escape }}" loading="lazy"></a>
  {% endif %}
  {% if adventure.excerpt %}<p>{{ adventure.excerpt }}</p>{% endif %}
</article>
{% endfor %}
