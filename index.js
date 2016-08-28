/**
 * Biquad filter.
 * API is a somewhat copy of web-audio BiquadFilterNode.
 *
 * @module  audio-biquad
 */

'use strict';

var Through = require('audio-through');
var extend = require('xtend/mutable');
var inherits = require('inherits');


/**
 * Biquad class
 *
 * @constructor
 */
function Biquad (options) {
	if (!(this instanceof Biquad)) return new Biquad(options);

	Through.call(this, options);

	//init values for channels
	this.x1 = [];
	this.x2 = [];
	this.y1 = [];
	this.y2 = [];

	//init coefs
	this.update();
}

inherits(Biquad, Through);


/**
 * Basic filter params, defaults are the copy of web-audio.
 * Can be whether functions or constants.
 */
Biquad.prototype.frequency = 350;
Biquad.prototype.detune = 0;
Biquad.prototype.Q = 1;
Biquad.prototype.gain = 0;


/**
 * Type of filter:
 * lowpass
 * highpass
 * bandpass
 * lowshelf
 * highshelf
 * peaking
 * notch
 * allpass
 */
Biquad.prototype.type = 'lowpass';


/** Change filter param - should recalc coefs */
Biquad.prototype.update = function () {
	var method = 'set' + this.type[0].toUpperCase() + this.type.slice(1) + 'Params';

	var time = this.count / this.format.sampleRate;

	var f = typeof this.frequency === 'function' ? this.frequency(time) : this.frequency;
	var nyquist = 0.5 * this.format.sampleRate;
	var normalizedFrequency = f / nyquist;
	var detune = typeof this.detune === 'function' ? this.detune(time) : this.detune;
	if (detune) {
		normalizedFrequency *= Math.pow(2, detune / 1200);
	}

	var gain = typeof this.gain === 'function' ? this.gain(time) : this.gain;
	var Q = typeof this.Q === 'function' ? this.Q(time) : this.Q;

	this[method](normalizedFrequency, Q, gain);
};


/**
 * Processing function
 */
Biquad.prototype.process = function (buffer) {
	var self = this;

	//handle each channel
	for (var channel = 0, l = Math.min(buffer.numberOfChannels, self.format.channels); channel < l; channel++ ) {
		processChannel(channel, buffer.getChannelData(channel));
	}

	function processChannel (channel, channelData) {
		//create local copies of member variables
		var x1 = self.x1[channel] || 0;
		var x2 = self.x2[channel] || 0;
		var y1 = self.y1[channel] || 0;
		var y2 = self.y2[channel] || 0;
		var b0 = self.b0;
		var b1 = self.b1;
		var b2 = self.b2;
		var a1 = self.a1;
		var a2 = self.a2;

		var x, y;

		for (var i = 0; i < channelData.length; i++) {
			x = channelData[i];

			y = b0*x + b1*x1 + b2*x2 - a1*y1 - a2*y2;

			channelData[i] = y;

			// Update state variables
			x2 = x1;
			x1 = x;
			y2 = y1;
			y1 = y;
		}

		//save state
		self.x1[channel] = x1;
		self.x2[channel] = x2;
		self.y1[channel] = y1;
		self.y2[channel] = y2;
	}
}


module.exports = Biquad;


/**
 * The code below is adapted copy-paste of chromium’s source
 * https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/platform/audio/Biquad.cpp
 */

Biquad.prototype.setNormalizedCoefficients = function (b0, b1, b2, a0, a1, a2) {
	var a0Inverse = 1 / a0;

	this.b0 = b0 * a0Inverse;
	this.b1 = b1 * a0Inverse;
	this.b2 = b2 * a0Inverse;
	this.a1 = a1 * a0Inverse;
	this.a2 = a2 * a0Inverse;
}

Biquad.prototype.setLowpassParams = function (cutoff, resonance) {
	// Limit cutoff to 0 to 1.
	cutoff = Math.max(0.0, Math.min(cutoff, 1.0));

	if (cutoff == 1) {
		// When cutoff is 1, the z-transform is 1.
		this.setNormalizedCoefficients(1, 0, 0,
								  1, 0, 0);
	} else if (cutoff > 0) {
		// Compute biquad coefficients for lowpass filter
		resonance = Math.max(0.0, resonance); // can't go negative
		var g = Math.pow(10.0, 0.05 * resonance);
		var d = Math.sqrt((4 - Math.sqrt(16 - 16 / (g * g))) / 2);

		var theta = Math.PI * cutoff;
		var sn = 0.5 * d * Math.sin(theta);
		var beta = 0.5 * (1 - sn) / (1 + sn);
		var gamma = (0.5 + beta) * Math.cos(theta);
		var alpha = 0.25 * (0.5 + beta - gamma);

		var b0 = 2 * alpha;
		var b1 = 2 * 2 * alpha;
		var b2 = 2 * alpha;
		var a1 = 2 * -gamma;
		var a2 = 2 * beta;

		this.setNormalizedCoefficients(b0, b1, b2, 1, a1, a2);
	} else {
		// When cutoff is zero, nothing gets through the filter, so set
		// coefficients up correctly.
		this.setNormalizedCoefficients(0, 0, 0,
								  1, 0, 0);
	}
}

Biquad.prototype.setHighpassParams = function (cutoff, resonance) {
	// Limit cutoff to 0 to 1.
	cutoff = Math.max(0.0, Math.min(cutoff, 1.0));

	if (cutoff == 1) {
		// The z-transform is 0.
		this.setNormalizedCoefficients(0, 0, 0,
								  1, 0, 0);
	} else if (cutoff > 0) {
		// Compute biquad coefficients for highpass filter
		resonance = Math.max(0.0, resonance); // can't go negative
		var g = Math.pow(10.0, 0.05 * resonance);
		var d = Math.sqrt((4 - Math.sqrt(16 - 16 / (g * g))) / 2);

		var theta = Math.PI * cutoff;
		var sn = 0.5 * d * Math.sin(theta);
		var beta = 0.5 * (1 - sn) / (1 + sn);
		var gamma = (0.5 + beta) * Math.cos(theta);
		var alpha = 0.25 * (0.5 + beta + gamma);

		var b0 = 2 * alpha;
		var b1 = 2 * -2 * alpha;
		var b2 = 2 * alpha;
		var a1 = 2 * -gamma;
		var a2 = 2 * beta;

		this.setNormalizedCoefficients(b0, b1, b2, 1, a1, a2);
	} else {
	  // When cutoff is zero, we need to be careful because the above
	  // gives a quadratic divided by the same quadratic, with poles
	  // and zeros on the unit circle in the same place. When cutoff
	  // is zero, the z-transform is 1.
		this.setNormalizedCoefficients(1, 0, 0,
								  1, 0, 0);
	}
}

Biquad.prototype.setLowShelfParams = function (frequency, Q, dbGain) {
	// Clip frequencies to between 0 and 1, inclusive.
	frequency = Math.max(0.0, Math.min(frequency, 1.0));

	var A = Math.pow(10.0, dbGain / 40);

	if (frequency == 1) {
		// The z-transform is a constant gain.
		this.setNormalizedCoefficients(A * A, 0, 0,
								  1, 0, 0);
	} else if (frequency > 0) {
		var w0 = Math.PI * frequency;
		var S = 1; // filter slope (1 is max value)
		var alpha = 0.5 * Math.sin(w0) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
		var k = Math.cos(w0);
		var k2 = 2 * Math.sqrt(A) * alpha;
		var aPlusOne = A + 1;
		var aMinusOne = A - 1;

		var b0 = A * (aPlusOne - aMinusOne * k + k2);
		var b1 = 2 * A * (aMinusOne - aPlusOne * k);
		var b2 = A * (aPlusOne - aMinusOne * k - k2);
		var a0 = aPlusOne + aMinusOne * k + k2;
		var a1 = -2 * (aMinusOne + aPlusOne * k);
		var a2 = aPlusOne + aMinusOne * k - k2;

		this.setNormalizedCoefficients(b0, b1, b2, a0, a1, a2);
	} else {
		// When frequency is 0, the z-transform is 1.
		this.setNormalizedCoefficients(1, 0, 0,
								  1, 0, 0);
	}
}

Biquad.prototype.setHighShelfParams = function (frequency, Q, dbGain) {
	// Clip frequencies to between 0 and 1, inclusive.
	frequency = Math.max(0.0, Math.min(frequency, 1.0));

	var A = Math.pow(10.0, dbGain / 40);

	if (frequency == 1) {
		// The z-transform is 1.
		this.setNormalizedCoefficients(1, 0, 0,
								  1, 0, 0);
	} else if (frequency > 0) {
		var w0 = Math.PI * frequency;
		var S = 1; // filter slope (1 is max value)
		var alpha = 0.5 * Math.sin(w0) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
		var k = Math.cos(w0);
		var k2 = 2 * Math.sqrt(A) * alpha;
		var aPlusOne = A + 1;
		var aMinusOne = A - 1;

		var b0 = A * (aPlusOne + aMinusOne * k + k2);
		var b1 = -2 * A * (aMinusOne + aPlusOne * k);
		var b2 = A * (aPlusOne + aMinusOne * k - k2);
		var a0 = aPlusOne - aMinusOne * k + k2;
		var a1 = 2 * (aMinusOne - aPlusOne * k);
		var a2 = aPlusOne - aMinusOne * k - k2;

		this.setNormalizedCoefficients(b0, b1, b2, a0, a1, a2);
	} else {
		// When frequency = 0, the filter is just a gain, A^2.
		this.setNormalizedCoefficients(A * A, 0, 0,
								  1, 0, 0);
	}
}

Biquad.prototype.setPeakingParams = function (frequency, Q, dbGain) {
	// Clip frequencies to between 0 and 1, inclusive.
	frequency = Math.max(0.0, Math.min(frequency, 1.0));

	// Don't let Q go negative, which causes an unstable filter.
	Q = Math.max(0.0, Q);

	var A = Math.pow(10.0, dbGain / 40);

	if (frequency > 0 && frequency < 1) {
		if (Q > 0) {
			var w0 = Math.PI * frequency;
			var alpha = Math.sin(w0) / (2 * Q);
			var k = Math.cos(w0);

			var b0 = 1 + alpha * A;
			var b1 = -2 * k;
			var b2 = 1 - alpha * A;
			var a0 = 1 + alpha / A;
			var a1 = -2 * k;
			var a2 = 1 - alpha / A;

			this.setNormalizedCoefficients(b0, b1, b2, a0, a1, a2);
		} else {
			// When Q = 0, the above formulas have problems. If we look at
			// the z-transform, we can see that the limit as Q->0 is A^2, so
			// set the filter that way.
			this.setNormalizedCoefficients(A * A, 0, 0,
									  1, 0, 0);
		}
	} else {
		// When frequency is 0 or 1, the z-transform is 1.
		this.setNormalizedCoefficients(1, 0, 0,
								  1, 0, 0);
	}
}

Biquad.prototype.setAllpassParams = function (frequency, Q) {
	// Clip frequencies to between 0 and 1, inclusive.
	frequency = Math.max(0.0, Math.min(frequency, 1.0));

	// Don't let Q go negative, which causes an unstable filter.
	Q = Math.max(0.0, Q);

	if (frequency > 0 && frequency < 1) {
		if (Q > 0) {
			var w0 = Math.PI * frequency;
			var alpha = Math.sin(w0) / (2 * Q);
			var k = Math.cos(w0);

			var b0 = 1 - alpha;
			var b1 = -2 * k;
			var b2 = 1 + alpha;
			var a0 = 1 + alpha;
			var a1 = -2 * k;
			var a2 = 1 - alpha;

			this.setNormalizedCoefficients(b0, b1, b2, a0, a1, a2);
		} else {
			// When Q = 0, the above formulas have problems. If we look at
			// the z-transform, we can see that the limit as Q->0 is -1, so
			// set the filter that way.
			this.setNormalizedCoefficients(-1, 0, 0,
									  1, 0, 0);
		}
	} else {
		// When frequency is 0 or 1, the z-transform is 1.
		this.setNormalizedCoefficients(1, 0, 0,
								  1, 0, 0);
	}
}

Biquad.prototype.setNotchParams = function (frequency, Q) {
	// Clip frequencies to between 0 and 1, inclusive.
	frequency = Math.max(0.0, Math.min(frequency, 1.0));

	// Don't let Q go negative, which causes an unstable filter.
	Q = Math.max(0.0, Q);

	if (frequency > 0 && frequency < 1) {
		if (Q > 0) {
			var w0 = Math.PI * frequency;
			var alpha = Math.sin(w0) / (2 * Q);
			var k = Math.cos(w0);

			var b0 = 1;
			var b1 = -2 * k;
			var b2 = 1;
			var a0 = 1 + alpha;
			var a1 = -2 * k;
			var a2 = 1 - alpha;

			this.setNormalizedCoefficients(b0, b1, b2, a0, a1, a2);
		} else {
			// When Q = 0, the above formulas have problems. If we look at
			// the z-transform, we can see that the limit as Q->0 is 0, so
			// set the filter that way.
			this.setNormalizedCoefficients(0, 0, 0,
									  1, 0, 0);
		}
	} else {
		// When frequency is 0 or 1, the z-transform is 1.
		this.setNormalizedCoefficients(1, 0, 0,
								  1, 0, 0);
	}
}

Biquad.prototype.setBandpassParams = function (frequency, Q) {
	// No negative frequencies allowed.
	frequency = Math.max(0.0, frequency);

	// Don't let Q go negative, which causes an unstable filter.
	Q = Math.max(0.0, Q);

	if (frequency > 0 && frequency < 1) {
		var w0 = Math.PI * frequency;
		if (Q > 0) {
			var alpha = Math.sin(w0) / (2 * Q);
			var k = Math.cos(w0);

			var b0 = alpha;
			var b1 = 0;
			var b2 = -alpha;
			var a0 = 1 + alpha;
			var a1 = -2 * k;
			var a2 = 1 - alpha;

			this.setNormalizedCoefficients(b0, b1, b2, a0, a1, a2);
		} else {
			// When Q = 0, the above formulas have problems. If we look at
			// the z-transform, we can see that the limit as Q->0 is 1, so
			// set the filter that way.
			this.setNormalizedCoefficients(1, 0, 0,
									  1, 0, 0);
		}
	} else {
		// When the cutoff is zero, the z-transform approaches 0, if Q
		// > 0. When both Q and cutoff are zero, the z-transform is
		// pretty much undefined. What should we do in this case?
		// For now, just make the filter 0. When the cutoff is 1, the
		// z-transform also approaches 0.
		this.setNormalizedCoefficients(0, 0, 0,
								  1, 0, 0);
	}
}
