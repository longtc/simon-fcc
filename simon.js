"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Sound = function () {
  function Sound(context) {
    _classCallCheck(this, Sound);

    this.context = context;
  }

  _createClass(Sound, [{
    key: "init",
    value: function init() {
      this.oscillator = this.context.createOscillator();
      this.gainNode = this.context.createGain();

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.context.destination);
      this.oscillator.type = "sine";
    }
  }, {
    key: "makeDistortion",
    value: function makeDistortion() {
      this.oscillator = this.context.createOscillator();
      this.distortion = this.context.createWaveShaper();
      this.gainNode = this.context.createGain();

      this.oscillator.connect(this.distortion);
      this.distortion.connect(this.gainNode);
      this.gainNode.connect(this.context.destination);

      this.distortion.curve = makeDistortionCurve(400);
      this.oscillator.type = "sine";
    }
  }, {
    key: "playDistortion",
    value: function playDistortion(value, time) {
      this.makeDistortion();

      this.oscillator.frequency.value = value;
      this.gainNode.gain.setValueAtTime(1, this.context.currentTime);

      this.oscillator.start(time);
      this.stop(time);
    }
  }, {
    key: "play",
    value: function play(value, time) {
      this.init();

      this.oscillator.frequency.value = value;
      this.gainNode.gain.setValueAtTime(1, this.context.currentTime);

      this.oscillator.start(time);
      this.stop(time);
    }
  }, {
    key: "stop",
    value: function stop(time) {
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1);
      this.oscillator.stop(time + 1);
    }
  }]);

  return Sound;
}();

/* eslint no-undef: 0 */

var simonModel = function () {
  var context = new (window.AudioContext || window.webkitAudioContext)();
  var note = new Sound(context);

  var buzz = function buzz() {
    return note.playDistortion(100, context.currentTime);
  };
  var noteG3 = function noteG3() {
    return note.play(196, context.currentTime);
  };
  var noteC4 = function noteC4() {
    return note.play(261.63, context.currentTime);
  };
  var noteG4 = function noteG4() {
    return note.play(392, context.currentTime);
  };
  var noteC5 = function noteC5() {
    return note.play(523.25, context.currentTime);
  };

  var buttons = {
    "simon__btn-upper-left": noteG3,
    "simon__btn-upper-right": noteC4,
    "simon__btn-lower-left": noteG4,
    "simon__btn-lower-right": noteC5
  };
  var buttonOrder = ["simon__btn-upper-left", "simon__btn-upper-right", "simon__btn-lower-left", "simon__btn-lower-right"];

  var series = [];
  var playerMoves = [];
  var isOn = false;
  var isPlayerTurn = true;
  var count = 0;
  var tempCount = void 0;
  var guessNumber = 0;
  var strictMode = false;

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
    var id = window.setTimeout(function () {}, 0);

    while (id--) {
      window.clearTimeout(id);
    }
  }

  function lightBtn(btn, delay) {
    var button = document.querySelector("." + btn);

    setTimeout(function () {
      return button.classList.add("simon__btn--is-pressed");
    }, delay);

    var remove = function remove() {
      return button.classList.remove("simon__btn--is-pressed");
    };
    setTimeout(remove, delay + 300);
  }

  function playSeries(cooldown) {
    if (isOn) {
      isPlayerTurn = false;
      guessNumber = 0;
      playerMoves.length = 0;

      for (var i = 0; i < count; i++) {
        if (isOn) {
          var btn = buttonOrder[series[i]];
          var _note = buttons[btn]; // .bind(this);

          setTimeout(_note, i * cooldown); // Play corresponding note after every *cooldown*
          lightBtn(btn, i * cooldown);
        }
      }

      setTimeout(function () {
        return isPlayerTurn = true;
      }, count * cooldown);
    }
  }

  function randomNote() {
    count++;
    var random = Math.trunc(Math.random() * 4);
    series.push(random);

    document.getElementById("simon__count").value = count; // < 10 ? "0" + count : count;

    if (count < 5) playSeries(1000);else playSeries(600);
  }

  function makeAGuess(ev) {
    if (isOn && isPlayerTurn) {
      playerMoves.push(buttonOrder.indexOf(ev.target.className));

      if (series[guessNumber] === playerMoves[guessNumber]) {
        // Check if move is valid
        guessNumber++;

        if (guessNumber === 20) {
          // Condition for victory
          lightBtn(ev.target.className, 0);
          buttons[ev.target.className]();
          setTimeout(function () {
            return document.querySelector(".simon__victory-noti").classList.add("simon__victory-noti--is-visible");
          }, 500);
          setTimeout(function () {
            return document.querySelector(".simon__victory-noti").classList.remove("simon__victory-noti--is-visible");
          }, 2500);
          setTimeout(start, 2500);
        } else {
          lightBtn(ev.target.className, 0);
          buttons[ev.target.className]();

          if (guessNumber < count) {
            isPlayerTurn = false;
            setTimeout(function () {
              return isPlayerTurn = true;
            }, 250);
          } else setTimeout(randomNote, 1000);
        }
      } else {
        tempCount = count;
        count = "! !";
        setTimeout(function () {
          return count = tempCount;
        }, 1000);
        buzz();
        if (strictMode) {
          setTimeout(function () {
            return start();
          }, 2000);
        } else {
          isPlayerTurn = false;
          setTimeout(function () {
            return playSeries(600);
          }, 2000);
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
    getCount: function getCount() {
      return count;
    },
    toggleOnOff: toggleOnOff,
    toggleStrict: toggleStrict,
    start: start,
    makeAGuess: makeAGuess
  };
}();

// http://stackoverflow.com/questions/22312841/waveshaper-node-in-webaudio-how-to-emulate-distortion
function makeDistortionCurve(amount) {
  var k = typeof amount === "number" ? amount : 50;
  var n_samples = 44100;
  var curve = new Float32Array(n_samples);
  var deg = Math.PI / 180;
  var i = 0;
  var x = void 0;

  for (; i < n_samples; ++i) {
    x = i * 2 / n_samples - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

var SimonCircle = {
  view: function view() {
    return m(
      "section",
      { "class": "simon-game" },
      m(
        "div",
        { "class": "simon__btn-upper" },
        m("div", { "class": "simon__btn-upper-left", onclick: simonModel.makeAGuess }),
        m("div", { "class": "simon__btn-upper-right", onclick: simonModel.makeAGuess })
      ),
      m(
        "h1",
        { "class": "simon__victory-noti" },
        "GRATZ!!! YOU ARE A WINNER!"
      ),
      m(
        "div",
        { "class": "simon__controllers" },
        m(
          "div",
          { "class": "simon__playing" },
          m(
            "div",
            { "class": "simon__count" },
            m("input", { type: "text", id: "simon__count", disabled: true, value: simonModel.getCount() === 0 ? "- -" : simonModel.getCount() }),
            m(
              "label",
              { "for": "simon__count" },
              "COUNT"
            )
          ),
          m(
            "div",
            { "class": "simon__btn-start" },
            m("button", { type: "button", id: "simon__btn-start", onclick: simonModel.start }),
            m(
              "label",
              { "for": "simon__btn-start" },
              "START"
            )
          ),
          m(
            "div",
            { "class": "simon__btn-strict" },
            m("button", { type: "button", id: "simon__btn-strict", onclick: simonModel.toggleStrict }),
            m(
              "label",
              { "for": "simon__btn-strict" },
              "STRICT"
            )
          )
        ),
        m(
          "div",
          { "class": "simon__on-off" },
          m(
            "h3",
            null,
            "OFF"
          ),
          m(
            "div",
            { "class": "simon__sw-on-off", onclick: simonModel.toggleOnOff },
            m("div", { "class": "simon__switch" })
          ),
          m(
            "h3",
            null,
            "ON"
          )
        )
      ),
      m(
        "div",
        { className: "simon__btn-lower" },
        m("div", { "class": "simon__btn-lower-left", onclick: simonModel.makeAGuess }),
        m("div", { "class": "simon__btn-lower-right", onclick: simonModel.makeAGuess })
      )
    );
  }
};

m.mount(document.body, SimonCircle);
