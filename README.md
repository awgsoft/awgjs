# README #

## AWG.js

AWG is MML(music macro language) sound driver for windows.
AWG -> awgsoft.com (japanese site)

AWG.js is browser edition of AWG using Web Audio API.

## Features of AWG

* Modulor synth
* All data(tone data, sequence) is written by MML
* OSC(sin/square etc.) + ADSR EG
* almost unlimited numbers of modules is available
* FM modulation

## Screen (AWG UI repository)
https://awgsoft.github.io/awgui/

## Environment

* npm(node.js) + typescript + webpack
* Web Audio API (Audio Worklet)
* Chrome browser

## usage

### use by HTML

#### build by webpack
```
npm run build
```

#### basically
copy `./dist/awg.js,awgproc.js` and link from your HTML

```
Awg.load(mml, options);
Awg.play();
```
For more information, Please refer to [AWG UI repository](https://github.com/awgsoft/awgui)

### from node.js (headless)
In the future, support headless(browserless) playback

## LICENSE

Apache License 2.0

## MML manual
under construction

