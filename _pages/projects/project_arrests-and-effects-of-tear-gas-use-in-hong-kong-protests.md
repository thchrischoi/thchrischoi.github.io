---
title: "Arrests and Effects of Tear Gas Use in Hong Kong Protests"
classes: single
permalink: /projects/project_arrests-and-effects-of-tear-gas-use-in-hong-kong-protests/
header:
  image: "/images/BG_Home.png"
---

<img src="{{ site.url }}{{ site.baseurl }}/images/project_arrests-and-effects-of-tear-gas-use-in-hong-kong-protests/banner.jpg" alt="">

*Dec 2019*

### Introduction

Hong Kong has seen ongoing weekly protests since March 15. The protests began as a response against a proposed extradition bill, which would have allowed the extradition of fugitives from Hong Kong to mainland China and Taiwan. With little trust towards China's legal structure, many Hong Kongers felt that it was highly inappropriate, and possibly dangerous to have such a system in place. In addition, the protests were also fueled by the frustration of Hong Kongers towards the government's poor representation of the people, especially with the prominence of pro-China key figures in politics and the lack of universal suffrage.

The police responded to the protests, the majority of which were peaceful, with what many believed was an excessive use of force. The use of tear gas grenades, rubber bullets, and batons against largely peaceful protestors was shocking to the general public. Moreover, the police's usage of the "rioting" charge against protestors, a loosely defined law that has been unchanged since the 1967 riots and carries a maximum 10 year sentence, felt extremely disproportionate to use against the largely peaceful protests (Purbrick. M, 2019).


### Map I - Locations of Protest Related Arrests

<INSERT MAPBOX MAP>

The above map (Map I) shows the recorded locations of 2163, of 5890 arrests (as of Nov 29th). The data was sourced from the "Hong Kong Watch - Protest Prosecution Database". Due to the lack of transparency regarding the details of the arrests by the Hong Kong Police, I was not able to locate all the arrests that have occured in the last 6 months.

The data was digitized as points on "geojson.io" and converted into a csv (Appendix I). The csv was added as a layer into "ArcMap" and the 200m buffer was applied using the buffer tool. The buffer was exported as a polygon shapefile and uploaded onto "studio.mapbox" as a "fill-extrusion" with the height of the polygon set to equate the ['Total Arrests' * '10']. The map was stylized using black and greyscale as to represent the protestors, as black is the main colour worn by them during protests. The light red for the water features was picked to connote the blood spilled by the violence that has occured, which has included 3 protestors that have been shot at point blank range by the police.

From the map we can see the largest number of arrests occured at Polytechnic University (1151 arrests), which occured in a week long standoff between students and police at the campus which lasted from Nov 18 - Nov 29. The map also identifies concentrated areas of a arrests. These include: the Wanchai, Central and Western, Yau Tsim Mong, and Sha Tin districts.


### Map II - Hours of Severe AQHI Levels between June and November

<img src="{{ site.url }}{{ site.baseurl }}/images/project_arrests-and-effects-of-tear-gas-use-in-hong-kong-protests/AQHI.jpg" alt="image-center" class="align-center">

Since the start of the protests, the police have fired up to 10,000 canisters of tear gas. Other than the immediate raspatory burning and eye irritant effects of teargas, one of the concerns of so much tear gas being fired is the long-term effects to those exposed. Since most of the protesting has been mobile in a city with one the highest population densities in the world, up to 88% of Hong Kong's population has been exposed to the teargas. Another component in the abundant usage of tear gas is the break down of chemicals in the tear gas into Dioxin, a highly toxic chemical that can have a half life in the human of up to 50 years.

The map above (Map II) displays the number of hours different districts in Hong Kong have had recorded levels of Severe air quality (the highest level) by the Hong Kong Environmental Protection Department within the months of the protests (Jun - Nov) in 2019, and the same months in 2018 as a control and reference towards what should be observed from normal air quality.

The map was aggregates monthly data from the AQHI (Air Quality Health Index) provided by the Hong Kong Environmental Protection Department for the months in question. The data was first compiled into a csv by hours of severe AQHI levels per district per month. In ArcMap, I "Tabular Joined" the csv to a Hong Kong Voting Districts shapefile, provided by the data.gov.hk website. The map was then displayed using graduated colours at equal intervals by the hours of severe AQHI levels. Exported as an image, the map was uploaded onto flickr and embedded onto this webpage as a link.

From what we can see in Map II, there is a far higher number of instances in which Severe air was observed. In 2018, the total number of hours between Jun and Nov of Severe air quality was 92 hours. During the same time, in 2019, with the protests occurring, the number of hours shot up to 310.


### Conclusion

Over the last 6 months, Hong Kong's weekly battleground between protestors and the police have begun to show what some of the long term effects of this protest has led to. The incarceration of a high number of young adults, mainly comprised of university students, and the degrading of air quality are only some of the other many results of this conflict. The inability of the Hong Kong governement to correctly address the societal issues, such as considerable worsening economic disparity, with a growing low-income section of society not benefiting from the economic growth of the city, has led to tand fueled these protests. Moving forward, even if the protests die down, without addressing these societal issues, it would be reasonable to assume that protests are likely to erupt again, like the current protests, which are considered to be in tandem of the Umbrella Revolution in 2014.


### Appendix

---
{{< rawhtml >}}
<table>
		<tr>
			<th>Location</th>
			<th>District</th>
			<th>Number of Arrests</th>
		</tr>
		<tr>
			<td>Legislative Council</td>
			<td>Wan Chai</td>
			<td>22</td>
		</tr>
		<tr>
			<td>Lung Wo Road & Harcourt Road</td>
			<td>Wan Chai</td>
			<td>11</td>
		</tr>
		<tr>
			<td>Police Headquaters</td>
			<td>Wan Chai</td>
			<td>1</td>
		</tr>
		<tr>
			<td>Nathan Road & Argyle St</td>
			<td>Yau Tsin Mong</td>
			<td>8</td>
		</tr>
		<tr>
			<td>Sheung Wan Station</td>
			<td>Central and Western</td>
			<td>2</td>
		</tr>
		<tr>
			<td>Sha Tin</td>
			<td>Sha Tin</td>
			<td>50</td>
		</tr>
		<tr>
			<td>Yuen Long</td>
			<td>Yuen Long</td>
			<td>20</td>
		</tr>
		<tr>
			<td>Sai Ying Pun & Sheung Wan</td>
			<td>Central and Western</td>
			<td>49</td>
		</tr>
		<tr>
			<td>Fo Tan</td>
			<td>Sha Tin</td>
			<td>8</td>
		</tr>
		<tr>
			<td>Wong Tai Sin</td>
			<td>Wong Tai Sin</td>
			<td>21</td>
		</tr>
		<tr>
			<td>Tsim Sha Tsui</td>
			<td>Yau Tsim Mong</td>
			<td>39</td>
		</tr>
		<tr>
			<td>Hong Kong International Airport</td>
			<td>Islands</td>
			<td>5</td>
		</tr>
		<tr>
			<td>Tin Shui Wai</td>
			<td>Yuen Long</td>
			<td>8</td>
		</tr>
		<tr>
			<td>Tsuen Wan</td>
			<td>Tsuen Wan</td>
			<td>29</td>
		</tr>
		<tr>
			<td>Sham Shui Po</td>
			<td>Sham Shui Po</td>
			<td>18</td>
		</tr>
		<tr>
			<td>Yau Tong</td>
			<td>Kwun Tong</td>
			<td>2</td>
		</tr>
		<tr>
			<td>Wan Chai Southern Stadium</td>
			<td>Wan Chai</td>
			<td>8</td>
		</tr>
		<tr>
			<td>500 Hennessy Rd</td>
			<td>Wan Chai</td>
			<td>7</td>
		</tr>
		<tr>
			<td>Prince Edward Station</td>
			<td>Yau Tsim Mong</td>
			<td>63</td>
		</tr>
		<tr>
			<td>Hung Hom</td>
			<td>Kowloon City</td>
			<td>4</td>
		</tr>
		<tr>
			<td>North Point</td>
			<td>Eastern</td>
			<td>24</td>
		</tr>
		<tr>
			<td>Fortress Hill</td>
			<td>Eastern</td>
			<td>1</td>
		</tr>
		<tr>
			<td>New Town Plaza</td>
			<td>Sha Tin</td>
			<td>3</td>
		</tr>
		<tr>
			<td>Mong Kok Police Station</td>
			<td>Yau Tsim Mong</td>
			<td>8</td>
		</tr>
		<tr>
			<td>Admiraly</td>
			<td>Central and Wester</td>
			<td>146</td>
		</tr>
		<tr>
			<td>Ma On Shan MOSTown Shopping Centre</td>
			<td>Sha Tin</td>
			<td>5</td>
		</tr>
		<tr>
			<td>Fan Ling</td>
			<td>Northern</td>
			<td>26</td>
		</tr>
		<tr>
			<td>Nan Fung Centre</td>
			<td>Tsuen Wan</td>
			<td>3</td>
		</tr>
		<tr>
			<td>Tai Po</td>
			<td>Tai Po</td>
			<td>4</td>
		</tr>
		<tr>
			<td>Yee On Street</td>
			<td>Kwun Tong</td>
			<td>2</td>
		</tr>
		<tr>
			<td>Tuen Mun Town Centre</td>
			<td>Tuen Mun</td>
			<td>73</td>
		</tr>
		<tr>
			<td>Swatow Street</td>
			<td>Wan Chai</td>
			<td>1</td>
		</tr>
		<tr>
			<td>Victoria Peak</td>
			<td>Central and Western</td>
			<td>2</td>
		</tr>
		<tr>
			<td>Prudential Hotel</td>
			<td>Yau Tsim Mong</td>
			<td>1</td>
		</tr>
		<tr>
			<td>City Plaza</td>
			<td>Eastern</td>
			<td>4</td>
		</tr>
		<tr>
			<td>Mong Kok</td>
			<td>Yau Tsim Mong</td>
			<td>30</td>
		</tr>
		<tr>
			<td>Festival Walk</td>
			<td>Kowloon City</td>
			<td>29</td>
		</tr>
		<tr>
			<td>Sai Wan ho</td>
			<td>Eastern</td>
			<td>2</td>
		</tr>
		<tr>
			<td>Science Museum</td>
			<td>Yau Tsim Mong</td>
			<td>50</td>
		</tr>
		<tr>
			<td>Polytechnic University</td>
			<td>Kowloon City</td>
			<td>1151</td>
		</tr>
		<tr>
			<td>Bute Street</td>
			<td>Yau Tsim Mong</td>
			<td>213</td>
		</tr>
		<tr>
			<td>Caritas Secondary School</td>
			<td>Sha Tin</td>
			<td>2</td>
		</tr>
		<tr>
			<td>Ma On Shan Promenade</td>
			<td>Sha Tin</td>
			<td>8</td>
		</tr>
	</table>
{{< /rawhtml >}}



---
---


### Sources:

* Martin Purbrick (2019) A REPORT OF THE 2019 HONG KONG PROTESTS,
Asian Affairs, 50:4, 465-487, DOI: 10.1080/03068374.2019.1672397
* https://www.hongkongwatch.org/protest-prosecution
* https://www.aqhi.gov.hk/en/aqhi/statistics-of-aqhi/aqhi-monthly-summary.html*
