# FoundryVTT-GoDice

## Demonstration Video
[![FoundryVTT-GoDice](http://img.youtube.com/vi/rRrH6dsNcW8/0.jpg)](http://www.youtube.com/watch?v=rRrH6dsNcW8 "FoundryVTT-GoDice Overview")


## Module requirements

* This module was built and works genuinely with GoDice - [the first connected RPG dice](https://particula-tech.com/godice/https://particula-tech.com/shop/godice-rpg-bundle/).
* Requires installation of [Unfulfilled Rolls module](https://foundryvtt.com/packages/unfulfilled-rolls), by FoundryVTT.
* Requires a mobile installation of GoDice™ (Download on [Google Play](https://play.google.com/store/apps/details?id=com.particula.godice) OR on the [AppStore](https://apps.apple.com/us/app/id1609938803))
* For enhanced experience  - we strongly recommend using a 3D dice module (optional) - module name - Dice So Nice

![unnamed (5)](https://github.com/ParticulaCode/FoundryVTT-GoDice/assets/58478137/e7ef33eb-9ebf-4a48-b557-2a04fd2f5ba2)
![unnamed (6)](https://github.com/ParticulaCode/FoundryVTT-GoDice/assets/58478137/ff31db3a-b9fa-43db-a7ef-5d2846c8c550)
![unnamed (32](https://github.com/ParticulaCode/FoundryVTT-GoDice/assets/58478137/d0f08ea0-9567-4747-b55a-b3a1d38314b6)
![unnamed (4)](https://github.com/ParticulaCode/FoundryVTT-GoDice/assets/58478137/a9f7d37e-356d-4464-9122-923decb57472)


## Connecting your GoDice

Download the GoDice™ app, and make sure your mobile device and PC are connected to the same local network (i.e. the same router) either by WiFi or Cable.
Look for the FoundryVTT connector utility in GoDice™ library. 
Copy the IP address shown on the bottom, or share it to yourself.

![Screenshot_20230615_163517_GoDice](https://github.com/ParticulaCode/FoundryVTT-GoDice/assets/58478137/15091450-b03b-4ca0-a887-b5735d4f6fe5)

You’ll need to paste it in your GoDice Companion configurations in Foundry. Then click Save Changes.
![Untitled233322](https://github.com/ParticulaCode/FoundryVTT-GoDice/assets/58478137/69a5b0f7-65cb-421d-9f3c-225ddd7ef6b8)

And you’re good to go!

## How to use the FoundryVTT connector in the GoDice App 
* Make sure your dice are connected (in the dice management window)
* To change a dice type, click on the relevant die in the dice management, and choose the required shell

![Screenshot_20230615_170047_GoDice](https://github.com/ParticulaCode/FoundryVTT-GoDice/assets/58478137/82bbfb44-2eb7-4b4c-8c45-cd4c44fa50b9)


## How to use the GoDice Companion roll fulfillment window

* First, configure the dice to work with the GoDice smart connected RPG dice, by opening the "Dice Configuration" on the "Game Settings"
* 
![openDiceConf](https://github.com/ParticulaCode/FoundryVTT-GoDice/assets/58478137/f7a503a4-e13c-4d09-8d09-15e7f9023f32)

Then choose the Bluetooth Provider to be GoDice, and for each die type, its possible to choose whether the die output will be from the Bluetooth dice, Manual input or Foundry Digital roll

![window](https://github.com/ParticulaCode/FoundryVTT-GoDice/assets/58478137/0a5e567e-c62b-4379-90f2-094b80fc2294)

* Once you need to roll some dice, the GoDice Companion window will open, and the dice that should be rolled will start to blink.
Just roll them out, and the score will be set according to your dice outcome.

![gdcomp](https://github.com/ParticulaCode/FoundryVTT-GoDice/assets/58478137/a8c2613c-c38f-4a15-9075-1a989f006ce5)

* If you click on Submit without rolling your dice, Foundry will randomly pick the dice outcome for you
