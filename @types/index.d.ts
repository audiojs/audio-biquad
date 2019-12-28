declare module 'audio-biquad' {
    interface myParamsInterface{
        type:"bandpass"|"lowpass"|"highpass",
        frequency: number,
        Q: number,
        gain: number,
    }
    class Biquad {
        constructor(params:myParamsInterface);
        process(buffer:any);
    }
    export=Biquad;
}
