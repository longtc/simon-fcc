class Sound {

  constructor(context) {
    this.context = context;
  }

  init() {
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.oscillator.type = "sine";
  }

  makeDistortion() {
    this.oscillator = this.context.createOscillator();
    this.distortion = this.context.createWaveShaper();
    this.gainNode = this.context.createGain();

    this.oscillator.connect(this.distortion);
    this.distortion.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);

    this.distortion.curve = makeDistortionCurve(400);
    this.oscillator.type = "sine";
  }

  playDistortion(value, time) {
    this.makeDistortion();

    this.oscillator.frequency.value = value;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);

    this.oscillator.start(time);
    this.stop(time);
  }

  play(value, time) {
    this.init();

    this.oscillator.frequency.value = value;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);

    this.oscillator.start(time);
    this.stop(time);
  }

  stop(time) {
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1);
    this.oscillator.stop(time + 1);
  }
}

/* eslint no-undef: 0 */

const simonModel = (function () {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const note = new Sound(context);

  const buzz = () => note.playDistortion(100, context.currentTime);
  const noteG3 = () => note.play(196, context.currentTime);
  const noteC4 = () => note.play(261.63, context.currentTime);
  const noteG4 = () => note.play(392, context.currentTime);
  const noteC5 = () => note.play(523.25, context.currentTime);

  const buttons = {
    "simon__btn-upper-left": noteG3,
    "simon__btn-upper-right": noteC4,
    "simon__btn-lower-left": noteG4,
    "simon__btn-lower-right": noteC5
  };
  const buttonOrder = ["simon__btn-upper-left", "simon__btn-upper-right", "simon__btn-lower-left", "simon__btn-lower-right"];

  const series = [];
  const playerMoves = [];
  let isOn = false;
  let isPlayerTurn = true;
  let count = 0;
  let tempCount;
  let guessNumber = 0;
  let strictMode = false;

  function toggleOnOff() {
    isOn = !isOn;
    document.querySelector(".simon__sw-on-off").classList.toggle("simon__sw-on-off--is-on");
    // buttonOrder.forEach(function (btn) { // Change mouse to pointer on hover
    //   document.querySelector("." + btn).classList.toggle("simon__btn--sw-on");
    // });

    if (!isOn) {
      clearAllTimeouts();
      series.length = 0;
      playerMoves.length = 0;
      isPlayerTurn = true;
      count = 0;
      guessNumber = 0;
    }
  }

  function toggleStrict(ev) {
    if (isOn) {
      strictMode = !strictMode;
      ev.target.classList.toggle("simon__btn-strict--is-on");
    }
    // simon__btn-strict
  }

  function clearAllTimeouts() {
    let id = window.setTimeout(() => {}, 0);

    while (id--) {
      window.clearTimeout(id);
    }
  }

  function lightBtn(btn, delay) {
    const button = document.querySelector("." + btn);

    setTimeout(() => button.classList.add("simon__btn--is-pressed"), delay);

    const remove = () => button.classList.remove("simon__btn--is-pressed");
    setTimeout(remove, delay + 300);
  }

  function playSeries(cooldown) {
    if (isOn) {
      isPlayerTurn = false;
      guessNumber = 0;
      playerMoves.length = 0;

      for (let i = 0; i < count; i++) {
        if (isOn) {
          const btn = buttonOrder[series[i]];
          const note = buttons[btn]; // .bind(this);

          setTimeout(note, i * cooldown); // Play corresponding note after every *cooldown*
          lightBtn(btn, i * cooldown);
        }
      }

      setTimeout(() => isPlayerTurn = true, count * cooldown);
    }
  }

  function randomNote() {
    count++;
    const random = Math.trunc(Math.random() * 4);
    series.push(random);

    document.getElementById("simon__count").value = count; // < 10 ? "0" + count : count;

    if (count < 5) playSeries(1000);
    else playSeries(600);
  }

  function makeAGuess(ev) {
    if (isOn && isPlayerTurn) {
      playerMoves.push(buttonOrder.indexOf(ev.target.className));

      if (series[guessNumber] === playerMoves[guessNumber]) { // Check if move is valid
        guessNumber++;

        if (guessNumber === 20) { // Condition for victory
          lightBtn(ev.target.className, 0);
          buttons[ev.target.className]();
          setTimeout(() => document.querySelector(".simon__victory-noti").classList.add("simon__victory-noti--is-visible"), 500);
          setTimeout(() => document.querySelector(".simon__victory-noti").classList.remove("simon__victory-noti--is-visible"), 2500);
          setTimeout(start, 2500);
        } else {
          lightBtn(ev.target.className, 0);
          buttons[ev.target.className]();

          if (guessNumber < count) {
            isPlayerTurn = false;
            setTimeout(() => isPlayerTurn = true, 250);
          } else setTimeout(randomNote, 1000);
        }

      } else {
        tempCount = count;
        count = "! !";
        setTimeout(() => count = tempCount, 1000);
        buzz();
        if (strictMode) {
          setTimeout(() => start(), 2000);
        } else {
          isPlayerTurn = false;
          setTimeout(() => playSeries(600), 2000);
        }
      }
    }
  }

  function start() {
    if (isOn) {
      clearAllTimeouts();
      series.length = 0;
      playerMoves.length = 0;
      isPlayerTurn = true;
      count = 0;
      guessNumber = 0;
      setTimeout(randomNote, 1000);
    }
  }

  return {
    getCount: () => count,
    toggleOnOff,
    toggleStrict,
    start,
    makeAGuess,
  };
})();

// http://stackoverflow.com/questions/22312841/waveshaper-node-in-webaudio-how-to-emulate-distortion
function makeDistortionCurve(amount) {
  const k = typeof amount === "number" ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  let i = 0;
  let x;

  for (; i < n_samples; ++i) {
    x = i * 2 / n_samples - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

const SimonCircle = {
  view() {
    return (
      <section class="simon-game">
        <div class="simon__btn-upper">
          <div class="simon__btn-upper-left" onclick={ simonModel.makeAGuess }></div>
          <div class="simon__btn-upper-right" onclick={ simonModel.makeAGuess }></div>
        </div>
        <h1 class="simon__victory-noti">GRATZ!!! YOU ARE A WINNER!</h1>
        <div class="simon__controllers">
          <div class="simon__playing">
            <div class="simon__count">
              <input type="text" id="simon__count" disabled value={ simonModel.getCount() === 0 ? "- -" : simonModel.getCount() }/>
              <label for="simon__count">COUNT</label>
            </div>
            <div class="simon__btn-start">
              <button type="button" id="simon__btn-start" onclick={ simonModel.start }></button>
              <label for="simon__btn-start">START</label>
            </div>
            <div class="simon__btn-strict">
              <button type="button" id="simon__btn-strict" onclick={ simonModel.toggleStrict }></button>
              <label for="simon__btn-strict">STRICT</label>
            </div>
          </div>
          <div class="simon__on-off">
            <h3>OFF</h3>
            <div class="simon__sw-on-off" onclick={ simonModel.toggleOnOff }><div class="simon__switch"></div></div>
            <h3>ON</h3>
          </div>
        </div>
        <div className="simon__btn-lower">
          <div class="simon__btn-lower-left" onclick={ simonModel.makeAGuess }></div>
          <div class="simon__btn-lower-right" onclick={ simonModel.makeAGuess }></div>
        </div>
      </section>
    );
  }
};

m.mount(document.body, SimonCircle);