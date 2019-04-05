async function baneTransform(audioBuffer) {

  let ctx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
  let source = ctx.createBufferSource();
  source.buffer = audioBuffer;

  // Wave shaper
  let waveShaper = ctx.createWaveShaper();
  waveShaper.curve = makeDistortionCurve(7);
  function makeDistortionCurve(amount) {
    var k = typeof amount === 'number' ? amount : 50;
    var n_samples = 44100;
    var curve = new Float32Array(n_samples);
    var deg = Math.PI / 180;
    var x;
    for (let i = 0; i < n_samples; ++i ) {
      x = i * 2 / n_samples - 1;
      curve[i] = ( 3 + k ) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // Pitch
  let deeper = new Jungle( ctx );
  deeper.setPitchOffset(0.25);

  // Telephone
  // let lpf1 = ctx.createBiquadFilter();
  // lpf1.type = "lowpass";
  // lpf1.frequency.value = 5000.0;
  // let lpf2 = ctx.createBiquadFilter();
  // lpf2.type = "lowpass";
  // lpf2.frequency.value = 5000.0;
  let hpf1 = ctx.createBiquadFilter();
  hpf1.type = "highpass";
  hpf1.frequency.value = 500.0;
  // let hpf2 = ctx.createBiquadFilter();
  // hpf2.type = "highpass";
  // hpf2.frequency.value = 100.0;
  let compressor = ctx.createDynamicsCompressor();
  // lpf1.connect( lpf2 );
  // lpf2.connect( hpf1 );
  // hpf1.connect( hpf2 );
  // hpf2.connect( waveShaper );

  //whoosh
  let osc = ctx.createOscillator();
  let gain = ctx.createGain();
  let wetGain = ctx.createGain();

  gain.gain.value = 0.002; // depth of change to the delay:
  cdepth = gain;

  osc.type = 'sine';
  osc.frequency.value = 4.5;
  cspeed = osc;

  osc.connect( gain );
  gain.connect( hpf1.frequency );

  source.connect(deeper.input);
  deeper.output.connect(hpf1);
  hpf1.connect(waveShaper)

  waveShaper.connect( compressor );
  compressor.connect( ctx.destination );

  let underwater = ctx.createBufferSource();
  underwater.buffer = await ctx.decodeAudioData(await (await fetch("../audio/backgrounds/underwater1.mp3")).arrayBuffer());
  underwater.loop = true;
  let underwaterGain = ctx.createGain();
  underwaterGain.gain.value = 0.5; //0.3;

  underwater.connect(underwaterGain);
  underwaterGain.connect(compressor);

  let cheer = ctx.createBufferSource();
  cheer.buffer = await ctx.decodeAudioData(await (await fetch("../audio/concert-crowd.mp3")).arrayBuffer());
  cheer.loop = true;
  let cheerGain = ctx.createGain();
  underwaterGain.gain.value = 0.5; //0.3;

  cheer.connect(underwaterGain);
  cheerGain.connect(compressor);

  underwater.start(0);
  cheer.start(0);

  osc.start(0);
  source.start(0);
  return await ctx.startRendering();

}