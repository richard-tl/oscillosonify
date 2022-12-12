document.addEventListener("DOMContentLoaded", function (event) {


    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(0.5, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);

    var waveform;

    var activeOscSynths = [];
    var activeGainSynths = [];

    const keyboardFrequencyMap = {
        '90': 261.625565300598634,  //Z - C
        '83': 277.182630976872096, //S - C#
        '88': 293.664767917407560,  //X - D
        '68': 311.126983722080910, //D - D#
        '67': 329.627556912869929,  //C - E
        '86': 349.228231433003884,  //V - F
        '71': 369.994422711634398, //G - F#
        '66': 391.995435981749294,  //B - G
        '72': 415.304697579945138, //H - G#
        '78': 440.000000000000000,  //N - A
        '74': 466.163761518089916, //J - A#
        '77': 493.883301256124111,  //M - B
        '81': 523.251130601197269,  //Q - C
        '50': 554.365261953744192, //2 - C#
        '87': 587.329535834815120,  //W - D
        '51': 622.253967444161821, //3 - D#
        '69': 659.255113825739859,  //E - E
        '82': 698.456462866007768,  //R - F
        '53': 739.988845423268797, //5 - F#
        '84': 783.990871963498588,  //T - G
        '54': 830.609395159890277, //6 - G#
        '89': 880.000000000000000,  //Y - A
        '55': 932.327523036179832, //7 - A#
        '85': 987.766602512248223,  //U - B
    }

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    activeOscillators = {}
    activeGains = {}

    const sineWave = document.getElementById('sine');
    const sawtoothWave = document.getElementById('sawtooth');

    const nothing = document.getElementById('none');
    const additive = document.getElementById('additive');
    const ampmod = document.getElementById('AM');
    const freqmod = document.getElementById('FM');

    const inParallel = document.getElementById('ParMMFM');

    const lfoAdded = document.getElementById('LFO');
    var lfoFreq = document.getElementById('lfoBar');

    var FMfreq = document.getElementById('fmBar');

    var depthVar = document.getElementById('depthVar');



    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            playNote(key);
        }
        
    }


    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            
            for(var i = 0; i < activeGains[key].length; i++){
                activeGains[key][i].gain.cancelScheduledValues(audioCtx.currentTime)
                activeGains[key][i].gain.setTargetAtTime(0, audioCtx.currentTime, 0.05)
            }

            for(var i = 0; i < activeOscillators[key].length; i++){
                activeOscillators[key][i].stop(audioCtx.currentTime + .5)
            }

            delete activeGains[key];
            delete activeOscillators[key];

            setTimeout(function(){
                delete activeGainSynths;
                delete activeOscSynths;
            }, 2)
        }

    }


    function changeDepth(val){
        depth.gain.value = val;
        depth_gain = val;
    }


    function playNote(key) {
        const osc = audioCtx.createOscillator();
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)

        // check which oscillator to use
        if (sineWave.checked == true) {
            waveform = 'sine'
        }
        else if (sawtoothWave.checked == true){
            waveform = 'sawtooth'
        }


        // check which synthesis method to use
        if (nothing.checked){
            const gainNode = audioCtx.createGain(); //new gain node for each node to control the adsr of that note
            osc.type = waveform

            gainNode.gain.setValueAtTime(.4, audioCtx.currentTime) // higher initial gain to prevent clipping on repeated press
    
            gainNode.gain.linearRampToValueAtTime(.5, audioCtx.currentTime + .5) //Attack
            gainNode.gain.exponentialRampToValueAtTime(.3, audioCtx.currentTime + .3) // Decay
    
            osc.connect(gainNode).connect(globalGain) //you will need a new gain node for each node to control the adsr of that note
            osc.start();
            
            activeOscSynths.push(osc);
            activeGainSynths.push(gainNode);

            if (lfoAdded.checked){
                var lfo = audioCtx.createOscillator();
                lfo.type = waveform;
                lfo.frequency.value = 0.5; //initial LFO freq
                var lfoGain = audioCtx.createGain();
                lfoGain.gain.value = 10;
                lfo.connect(lfoGain).connect(gainNode);
                lfo.start();

                activeGainSynths.push(lfoGain)
                activeOscSynths.push(lfo)
            }
        }

        // ADDITIVE SYNTHESIS
        if (additive.checked){
            // make oscillators to add sine tones
            var add_osc1 = audioCtx.createOscillator();
            var add_osc2 = audioCtx.createOscillator();
            var add_osc3 = audioCtx.createOscillator();

            add_osc1.frequency.value = 1 * keyboardFrequencyMap[key];
            add_osc2.frequency.value = (2 * keyboardFrequencyMap[key]) + Math.random() * 15;
            add_osc3.frequency.value = (3 * keyboardFrequencyMap[key]) + Math.random() * 15;

            const addGain = audioCtx.createGain();
            addGain.gain.setTargetAtTime(0.1, audioCtx.currentTime, 0.05); //same envelope?

            add_osc1.type = waveform
            add_osc2.type = waveform
            add_osc3.type = waveform
    
            addGain.gain.value = 0.0001;
            addGain.gain.setTargetAtTime(0.5, audioCtx.currentTime, 0.05);
            addGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime + 0.2, 1);
    
            activeOscSynths.push(add_osc1);
            activeOscSynths.push(add_osc2);
            activeOscSynths.push(add_osc3);
            activeGainSynths.push(addGain);
    
            add_osc1.start();
            add_osc2.start();
            add_osc3.start(); 
            
            add_osc1.connect(addGain);
            add_osc2.connect(addGain);
            add_osc3.connect(addGain);
            addGain.connect(globalGain);

            if (lfoAdded.checked){
                var lfo = audioCtx.createOscillator();
                lfo.frequency.value = 0.5;
                var lfoGain = audioCtx.createGain();
                lfoGain.gain.value = 10;
                lfo.connect(lfoGain).connect(addGain);
                lfo.start();
                
                activeGainSynths.push(lfoGain)
                activeOscSynths.push(lfo)
            }
        }

        // AM SYNTHESIS
        if (ampmod.checked){
            var carrier = audioCtx.createOscillator();
            carrier.frequency.value = keyboardFrequencyMap[key]; //the carrier frequency should be the frequency associated wiht the key you press
    
            var modulatorFreq = audioCtx.createOscillator();

            const modulated = audioCtx.createGain();
            const depth = audioCtx.createGain();

            carrier.type = waveform

            depth.gain.value = 0.5 //scale modulator output to [-0.5, 0.5]
            modulated.gain.value = 1.0 - depth.gain.value; //modulated signal now has output gain at [0,1]
            
            modulatorFreq.type = waveform
            modulatorFreq.frequency.value = 200;
    
            modulatorFreq.connect(depth).connect(modulated.gain);
            carrier.connect(modulated);
            modulated.connect(audioCtx.destination);
    
            activeGainSynths.push(depth)
            activeGainSynths.push(modulated)
    
            activeOscSynths.push(carrier)
            activeOscSynths.push(modulatorFreq)
    
            carrier.start();
            modulatorFreq.start();

            if (lfoAdded.checked){
                var lfo = audioCtx.createOscillator();
                lfo.frequency.value = 0.5;
                var lfoGain = audioCtx.createGain();
                lfoGain.gain.value = 10;
                lfo.connect(lfoGain).connect(modulated);
                lfo.start();
                
                activeGainSynths.push(lfoGain);
                activeOscSynths.push(lfo)
            }
        }
        
        // FM SYNTHESIS
        if (freqmod.checked){
            var carrier = audioCtx.createOscillator();
            carrier.frequency.value = keyboardFrequencyMap[key]; //the carrier frequency should be the frequency associated wiht the key you press

            var modulatorFreq = audioCtx.createOscillator();

            var modulationIndex = audioCtx.createGain();


            carrier.type = waveform

            modulatorFreq.type = waveform
            modulatorFreq.frequency.value = 300;
    
    
            modulationIndex.gain.value = .1;
    
    
            modulatorFreq.connect(modulationIndex);
            modulationIndex.connect(carrier.frequency)
    
            carrier.connect(audioCtx.destination);
    
            carrier.start();
            modulatorFreq.start();
    
            activeGainSynths.push(modulationIndex)
            activeOscSynths.push(carrier)
            activeOscSynths.push(modulatorFreq)


            if (lfoAdded.checked){
                var lfo = audioCtx.createOscillator();
                lfo.frequency.value = 0.5;
                var lfoGain = audioCtx.createGain();
                lfoGain.gain.value = 10;
                lfo.connect(lfoGain).connect(modulationIndex);
                lfo.start();
                
                activeGainSynths.push(lfoGain)
                activeOscSynths.push(lfo)
            }

        }

        if (inParallel.checked){
                var carrier = audioCtx.createOscillator();
            carrier.frequency.value = keyboardFrequencyMap[key]; //the carrier frequency should be the frequency associated wiht the key you press

            var modulatorFreq = audioCtx.createOscillator();

            var modulationIndex = audioCtx.createGain();


            carrier.type = waveform

            modulatorFreq.type = waveform
            modulatorFreq.frequency.value = 300;


            modulationIndex.gain.value = .1;


            modulatorFreq.connect(modulationIndex);
            modulationIndex.connect(carrier.frequency)

            carrier.connect(audioCtx.destination);

            carrier.start();
            modulatorFreq.start();

            activeGainSynths.push(modulationIndex)
            activeOscSynths.push(carrier)
            activeOscSynths.push(modulatorFreq)

            modulatorFreq2 = audioCtx.createOscillator();
            modulationIndex2 = audioCtx.createGain();
            modulationIndex2.gain.value = 0.01;
            modulatorFreq2.frequency.value = 200;
            modulatorFreq2.connect(modulationIndex2);
            modulationIndex2.connect(carrier.frequency);

            carrier.connect(audioCtx.destination);
        
            carrier.start();
            modulatorFreq.start();
            modulatorFreq2.start();
            
            activeOscSynths.push(carrier)
            activeGainSynths.push(modulatorIndex2)
            activeOscSynths.push(modulatorFreq2)
        }
            
        activeOscillators[key] = activeOscSynths
        activeGains[key] = activeGainSynths
    }

    function changeFMfreq(freq){
        modulatorFreq.frequency.value = freq;
    }

    function changeLFO(freq){
        lfoFrequency = freq;
    }




})


