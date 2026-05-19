window.StudioBoothAudio = (() => {
    let audioCtx;

    function getAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function beep(freq = 880, dur = 0.1) {
        const a = getAudio();
        const o = a.createOscillator();
        const g = a.createGain();
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.08, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
        o.connect(g);
        g.connect(a.destination);
        o.start();
        o.stop(a.currentTime + dur);
    }

    function shutterSound() {
        const a = getAudio();
        const buf = a.createBuffer(1, a.sampleRate * 0.08, a.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (a.sampleRate * 0.015));
        const s = a.createBufferSource();
        s.buffer = buf;
        const g = a.createGain();
        g.gain.value = 0.3;
        s.connect(g);
        g.connect(a.destination);
        s.start();
    }

    return { getAudio, beep, shutterSound };
})();