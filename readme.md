[![npm install audio-biquad](https://nodei.co/npm/audio-biquad.png?mini=true)](https://npmjs.org/package/audio-biquad/)


```js
var BiquadFilter = require('audio-biquad');
var Speaker = require('audio-speaker');
var Generator = require('audio-generator');

Generator({
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

> **Related**<br/>
> [BiquadFilterNode](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode) — all the options for the filters</br>
> [BiquadFilterNode](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode) — all the options for the filters</br>
> [EQ Cookbook](http://www.musicdsp.org/files/Audio-EQ-Cookbook.txt) — description of all the kings of filters</br>