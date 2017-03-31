// main game object
var game = {
  gameOn: false, // toggle between true if game is on, false otherwise
  playback: true, // toggle between true when console is playing pattern to user, false otherwise
  userPlayback: false, // toggle between true when user is playing, false otherwise
  strict: false, // toggle between true when strict mode is selected, false otherwise
  buttons: '#green-button, #red-button, #blue-button, #yellow-button',
  score: 0, // current score, default is 0
  setScore: function() { $('#score-display').html(this.score); }, // display current score
  gameSequence: [], // store pattern during CPU presses here
  timeouts: [], // store all CPU button presses in case clearing is needed (user turns console off mid-play)
  isUserCorrectAtN: 1, // incremented and used to check if userSequence[n] == gameSequence[n] on user playback
  nextPlay: 0, // store random integer to choose next button to press when game in progress
  assignColor : function() {
    if (this.nextPlay == 0) { // press green
      return 'green-button';
    } else if (this.nextPlay == 1) { // press red
      return 'red-button';
    } else if (this.nextPlay == 2) { // press blue
      return 'blue-button';
    } else { // press yellow
      return 'yellow-button';
    }
  },
  gameOver: function() {
  // if playing in strict mode, a mistake causes the game to end, otherwise if a game is won or user turns console off during a game, reset all game data
    game.clearTimeouts();
    game['playback'] = true;
    game['userPlayback'] = false;
    jQuery(game['buttons']).css('cursor', 'default');
    game['score'] = 0;
    game.setScore();
    game['gameSequence'] = [];
    game['isUserCorrectAtN'] = 1;
  },
  wrongPress: function() {
  // if the user does not return to correct sequence in playback, the console notifies them via the count display
    this.userPlayback = false;
    this.isUserCorrectAtN = 1;
    var currentScore = game['score']; // keep score to display after notification
    game['score'] = '!!';
    game.setScore();
    setTimeout(function() {
      game['score'] = '';
      game.setScore();
      setTimeout(function() {
        game['score'] = '!!';
        game.setScore();
        setTimeout(function() {
          game['score'] = '';
          game.setScore();
          setTimeout(function() {
            game['score'] = currentScore;
            game.setScore();
          }, 100);
        }, 200);
      }, 100);
    }, 200);
  },
  clearTimeouts: function() {
    for (var i=0; i < game['timeouts'].length; i++) {
      clearTimeout(game['timeouts'][i]);
    }
    // also clear all button presses (using CSS as mouseup(s) are defined below)
    $('#green-button').css('background', 'green');
    $('#red-button').css('background', '#9F0F17');
    $('#blue-button').css('background', '#094A8F');
    $('#yellow-button').css('background', '#CCA707');
  },
  
    cpuPlay: function(makeAnotherMove) {
    //  
    jQuery(game['buttons']).css('cursor', 'default');
    game['userPlayback'] = false;
    if (makeAnotherMove) {
      var buttonToPress = '';
      game['nextPlay'] = Math.floor(Math.random()*4);
      //game['nextPlay'] = 0; // for testing
      game['gameSequence'].push(game.assignColor(game['nextPlay']));
    } // else just play back old sequence
    game['playback'] = true;
    for (var move = 0; move < game['gameSequence'].length; move++) {
      game.cpuPress(game['gameSequence'][move], move);
    }
    setTimeout(function() {
      game['playback'] = false;
      game['userPlayback'] = true;
      jQuery(game['buttons']).css('cursor', 'pointer');
    }, 1000*move);
  },

  cpuPress: function(buttonToPress, indexInSequence) {
    game['timeouts'].push(setTimeout(function() {
      game['playback'] = false; // allow computer to press
      $('#'+buttonToPress).trigger('mousedown');
      game['playback'] = true;
      game['timeouts'].push(setTimeout(function() {
        game['playback'] = false; // allow computer to press
        $('#'+buttonToPress).trigger('mouseup');
        game['playback'] = true;
      }, 500));
    }, 1000*indexInSequence));
  },
  
  userWins: function() {
  game['userPlayback'] = false;
  alert('You win! Imagine some nice animation to celebrate!');
  setTimeout(function() {
    game.gameOver();
  })
}
};

$('#power-button').click(function(e) {
  // toggle button between on and off
  if (game['gameOn']) {
    game['gameOn'] = false;
    $('#power-button').css('background', 'linear-gradient(90deg, lightBlue 50%, black 50%)');
    game.gameOver(); // in case the user quits mid-game
    game['score'] = '';
    game.setScore();
    game['strict'] = false;
  } else {
    game['gameOn'] = true;
    game['score'] = 0;
    game.setScore();
    $('#power-button').css('background', 'linear-gradient(90deg, black 50%, lightBlue 50%)');
    $('#score-display').html(game['score']);
  }
});

$('#start-button').mousedown(function(e) {
  $('#start-button').css('boxShadow', '0px 0px 0px #888888');
});

$('#start-button').mouseup(function(e) {
  $('#start-button').css('boxShadow', '2px 2px 15px #888888');
  if (game['gameOn']) { // power for game is on
    game.gameOver(); // reset console in case user is midway through game and restarts
    game['score'] = 1;
    game.setScore();
    setTimeout(function() {
      game.cpuPlay(true);
    }, 1000);
  } // else game is off, do nothing
});

$('#strict-button').click(function() {
  // toggle between regular mode and strict mode, if console is on
  if (game['gameOn']) {
    game['strict'] = !game['strict'];
  }
  if (game['strict']) {
    $('#strict-button').css('boxShadow', '0px 0px 0px #888888');
    $('#strict-button').css('color', 'red');
  } else {
    $('#strict-button').css('boxShadow', '2px 2px 15px #888888');
    $('#strict-button').css('color', 'yellow');
  }
});

$('#green-button').mousedown(function(e) {
  // when the buttons can be pressed, light up button and make sound
  if (game['gameOn'] && !game['playback']) {
    document.getElementById('green-sound').play();
    $(this).css('background', 'lightGreen');
    if (game['userPlayback']) {
      if (game['gameSequence'][game['isUserCorrectAtN']-1] != 'green-button') {
        game.wrongPress();
        if (game['strict']) {
          setTimeout(function() {
            game.gameOver();
          }, 1000);
        } else {
          setTimeout(function() {
            game.cpuPlay(false); // playback sequence
          }, 1000);
        }
      } else { // correct press, carry on unless the sequence is done
        if (game['isUserCorrectAtN'] == game['gameSequence'].length) {
          if (game['gameSequence'].length >= 20) { // game over, user wins
            game.userWins();
          } else {
            game['score']++;
            game.setScore();
            game['userPlayback'] = false;
            game['isUserCorrectAtN'] = 1;
            setTimeout(function() {
              game.cpuPlay(true); // add another move
            }, 1000);
          }
        } else {
          game['isUserCorrectAtN']++;
        }
      }
    }
  }
});

$('#green-button').mouseup(function(e) {
  // when the buttons can be pressed, light up button and make sound
  if (game['gameOn'] && !game['playback']) {
    $(this).css('background', 'green');
  }
});

$('#red-button').mousedown(function(e) {
  // when the buttons can be pressed, light up button and make sound
  if (game['gameOn'] && !game['playback']) {
    $(this).css('background', '#ffb3b3');
    document.getElementById('red-sound').play();
    if (game['userPlayback']) {
      if (game['gameSequence'][game['isUserCorrectAtN']-1] != 'red-button') {
        game.wrongPress();
        if (game['strict']) {
          setTimeout(function() {
            game.gameOver();
          }, 1000);
        } else {
          setTimeout(function() {
            game.cpuPlay(false); // playback sequence
          }, 1000);
        }
      } else { // correct press, carry on unless the sequence is done
        if (game['isUserCorrectAtN'] == game['gameSequence'].length) {
          if (game['gameSequence'].length >= 20) { // game over, user wins
            game.userWins();
          } else {
            game['score']++;
            game.setScore();
            game['userPlayback'] = false;
            game['isUserCorrectAtN'] = 1;
            setTimeout(function() {
              game.cpuPlay(true); // add another move
            }, 1000);
          }
        } else {
          game['isUserCorrectAtN']++;
        }
      }
    }
  }
});

$('#red-button').mouseup(function(e) {
  // when the buttons can be pressed, light up button and make sound
  if (game['gameOn'] && !game['playback']) {
    $(this).css('background', '#9F0F17');
  }
});

$('#blue-button').mousedown(function(e) {
  // when the buttons can be pressed, light up button and make sound
  if (game['gameOn'] && !game['playback']) {
    $(this).css('background', 'lightBlue');
    document.getElementById('blue-sound').play();
    if (game['userPlayback']) {
      if (game['gameSequence'][game['isUserCorrectAtN']-1] != 'blue-button') {
        game.wrongPress();
        if (game['strict']) {
          setTimeout(function() {
            game.gameOver();
          }, 1000);
        } else {
          setTimeout(function() {
            game.cpuPlay(false); // playback sequence
          }, 1000);
        }
      } else { // correct press, carry on unless the sequence is done
        if (game['isUserCorrectAtN'] == game['gameSequence'].length) {
          if (game['gameSequence'].length >= 20) { // game over, user wins
            game.userWins();
          } else {
            game['score']++;
            game.setScore();
            game['userPlayback'] = false;
            game['isUserCorrectAtN'] = 1;
            setTimeout(function() {
              game.cpuPlay(true); // add another move
            }, 1000);
          }
        } else {
          game['isUserCorrectAtN']++;
        }
      }
    }
  }
});

$('#blue-button').mouseup(function(e) {
  // when the buttons can be pressed, light up button and make sound
  if (game['gameOn'] && !game['playback']) {
    $(this).css('background', '#094A8F');
  }
});

$('#yellow-button').mousedown(function(e) {
  // when the buttons can be pressed, light up button and make sound
  if (game['gameOn'] && !game['playback']) {
    $(this).css('background', 'lightYellow');
    document.getElementById('yellow-sound').play();
    if (game['userPlayback']) {
      if (game['gameSequence'][game['isUserCorrectAtN']-1] != 'yellow-button') {
        game.wrongPress();
        if (game['strict']) {
          setTimeout(function() {
            game.gameOver();
          }, 1000);
        } else {
          setTimeout(function() {
            game.cpuPlay(false); // playback sequence
          }, 1000);
        }
      } else { // correct press, carry on unless the sequence is done
        if (game['isUserCorrectAtN'] == game['gameSequence'].length) {
          if (game['gameSequence'].length >= 20) { // game over, user wins
            game.userWins();
          } else {
            game['score']++;
            game.setScore();
            game['userPlayback'] = false;
            game['isUserCorrectAtN'] = 1;
            setTimeout(function() {
              game.cpuPlay(true); // add another move
            }, 1000);
          }
        } else {
          game['isUserCorrectAtN']++;
        }
      }
    }
  }
});

$('#yellow-button').mouseup(function(e) {
  // when the buttons can be pressed, light up button and make sound
  if (game['gameOn'] && !game['playback']) {
    $(this).css('background', '#CCA707');
  }
});
