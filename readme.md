# audio-biquad [![Build Status](https://travis-ci.org/audiojs/audio-biquad.svg?branch=master)](https://travis-ci.org/audiojs/audio-biquad) [![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Biquad filter stream. API is similar to [BiquadFilterNode](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode).

[![npm install audio-biquad](https://nodei.co/npm/audio-biquad.png?mini=true)](https://npmjs.org/package/audio-biquad/)


```js
var BiquadFilter = require('audio-biquad');
var Speaker = require('audio-speaker');
var Generator = require('audio-generator');

Generator(function () {
	return Math.random() * 2 - 1;
}, {
	duration: 2
})
.pipe(BiquadFilter({
	type: 'bandpass',
	frequency: 440,
	Q: 100,
	gain: 25
}))
.pipe(Speaker());
```

> [BiquadFilterNode](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode) — all the options for the filters.</br>
> [BiquadFilterNode chromium source](https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/platform/audio/Biquad.cpp&rcl=1443871507&l=283) — source code inspiration.</br>
> [EQ Cookbook](http://www.musicdsp.org/files/Audio-EQ-Cookbook.txt) — description of all the kinds of filters.</br>
