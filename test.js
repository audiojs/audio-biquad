var Generator = require('audio-generator');
var Speaker = require('audio-speaker');
var Volume = require('pcm-volume');
var Filter = require('./index');


Generator({
	generate: function () {
		return [Math.random(), Math.random()];
	},
	duration: 2
})
.pipe(Filter({
	type: 'bandpass',
	Q: 1000,
	frequency: 440,
	gain: 100
}))
.pipe(Volume(100))
.pipe(Speaker());


setTimeout(function () {}, 2000);
