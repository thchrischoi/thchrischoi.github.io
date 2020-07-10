---
title: "Arrests and Effects of Tear Gas Use in Hong Kong Protests"
classes: single
permalink: /projects/project_arrests-and-effects-of-tear-gas-use-in-hong-kong-protests/
header:
  image: "/images/BG_Home.png"
---

<img src="{{ site.url }}{{ site.baseurl }}/images/project_arrests-and-effects-of-tear-gas-use-in-hong-kong-protests/banner.jpg" alt="">

*Dec 2019*

###Introduction

Hong Kong has seen ongoing weekly protests since March 15. The protests began as a response against a proposed extradition bill, which would have allowed the extradition of fugitives from Hong Kong to mainland China and Taiwan. With little trust towards China's legal structure, many Hong Kongers felt that it was highly inappropriate, and possibly dangerous to have such a system in place. In addition, the protests were also fueled by the frustration of Hong Kongers towards the government's poor representation of the people, especially with the prominence of pro-China key figures in politics and the lack of universal suffrage.

The police responded to the protests, the majority of which were peaceful, with what many believed was an excessive use of force. The use of tear gas grenades, rubber bullets, and batons against largely peaceful protestors was shocking to the general public. Moreover, the police's usage of the "rioting" charge against protestors, a loosely defined law that has been unchanged since the 1967 riots and carries a maximum 10 year sentence, felt extremely disproportionate to use against the largely peaceful protests (Purbrick. M, 2019).


###Map I - Locations of Protest Related Arrests

<INSERT MAPBOX MAP>

The above map (Map I) shows the recorded locations of 2163, of 5890 arrests (as of Nov 29th). The data was sourced from the "Hong Kong Watch - Protest Prosecution Database". Due to the lack of transparency regarding the details of the arrests by the Hong Kong Police, I was not able to locate all the arrests that have occured in the last 6 months.



The data was digitized as points on "geojson.io" and converted into a csv (Appendix I). The csv was added as a layer into "ArcMap" and the 200m buffer was applied using the buffer tool. The buffer was exported as a polygon shapefile and uploaded onto "studio.mapbox" as a "fill-extrusion" with the height of the polygon set to equate the ['Total Arrests' * '10']. The map was stylized using black and greyscale as to represent the protestors, as black is the main colour worn by them during protests. The light red for the water features was picked to connote the blood spilled by the violence that has occured, which has included 3 protestors that have been shot at point blank range by the police.

From the map we can see the largest number of arrests occured at Polytechnic University (1151 arrests), which occured in a week long standoff between students and police at the campus which lasted from Nov 18 - Nov 29. The map also identifies concentrated areas of a arrests. These include: the Wanchai, Central and Western, Yau Tsim Mong, and Sha Tin districts.


<img src="{{ site.url }}{{ site.baseurl }}/images/project_arrests-and-effects-of-tear-gas-use-in-hong-kong-protests/AQHI.jpg" alt="">
