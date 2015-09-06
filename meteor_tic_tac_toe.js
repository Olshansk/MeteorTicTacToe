TicTacToe = new Mongo.Collection("tic_tac_toe");

var isFirstPlayer = function() {
  return window.location.pathname == "/player1";
};

var isSecondPlayer = function() {
  return window.location.pathname == "/player2";
};

var getActingPlayer = function() {
  return TicTacToe.findOne({"player_num": { $gt: 0, $lt: 3}});
};

var getActingPlayerNumber = function() {
  return getActingPlayer().player_num;
};

var togglePlayerTurn = function() {
  var actingPlayer = getActingPlayer();
  var nextPlayerNum = actingPlayer.player_num == 1 ? 2 : 1;

  TicTacToe.update(actingPlayer._id, {
    $set: { "player_num": nextPlayerNum }
  });
};

// Parameters correspond to the last move made in the game (type inserted in in position r c)
var isWinningMove = function(r, c, type) {
  player_state = TicTacToe.find({ "c": { $gt: -1, $lt: 3 } }).fetch().filter(function(object) {
    return object.type == type;
  });

  // Check vertical win
  var isVerticalWin = player_state.filter(function(object) {
    return object.c == c;
  }).length == 3;

  // Check horizontal win
  var isHorizontalWin = player_state.filter(function(object) {
    return object.r == r;
  }).length == 3;

  // Check diagonal wins
  var isTopLeftBottomRightWin = player_state.filter(function(object) {
    return object.c == object.r;
  }).length == 3;

  var isBottomLeftTopRightWin = player_state.filter(function(object) {
    return (object.c == 2 && object.r == 0) || (object.c == 1 && object.r == 1) || (object.c == 0 && object.r == 2);
  }).length == 3;

  return isVerticalWin || isHorizontalWin || isTopLeftBottomRightWin || isBottomLeftTopRightWin;
};

var isTie = function() {
  return TicTacToe.find({ "c": { $gt: -1, $lt: 3 } }).fetch().length == 9;
}

if (Meteor.isClient) {
  
  Template.body.helpers({
    rows: [
      { row: 0 },
      { row: 1 },
      { row: 2 },
    ],
    columns: function() {
      var row = this.row;
      return $.map([0,1,2], function(column) { 
        var data = TicTacToe.findOne({ r: row, c: column });
        var type = data === undefined ? '_' : data.type;
        return { type: type };
      });
    }
  });

  Template.user_message.helpers({
    message: function() {
      var message;
      if (isFirstPlayer()) {
        if (getActingPlayerNumber() == 1) {
          message = "Player 1, it's your turn!";
        } else {
          message = "Player 1, be patient while player 2 makes their move.";
        }
      } else if (isSecondPlayer()) {
        if (getActingPlayerNumber() == 2) {
          message = "Player 2, it's your turn!";
        } else {
          message = "Player 2, be patient while player 1 makes their move.";
        }
      } else {
          message = "You are a spectator! Watch players 1 & 2 battle it out.";
      }
      return message;
    }
  });

  Template.grid_space.events({
    "click .grid_space": function (elem) {
      var row = elem.delegateTarget.rowIndex;
      var column = elem.currentTarget.cellIndex;

      var actingPlayer = getActingPlayerNumber();
      var isSelected = TicTacToe.findOne({ r: row, c: column }) !== undefined
      var isMyTurn = ((isFirstPlayer() && actingPlayer == 1) || (isSecondPlayer() && actingPlayer == 2));

      if (isSelected || !isMyTurn) {
        return;
      }

      var type;
      if(isFirstPlayer()) {
        elem.target.classList.add('grid_space_with_x');  
        type = 'x';
      } else if (isSecondPlayer()) {
        elem.target.classList.add('grid_space_with_o');
        type = 'o';
      } else {
        return;
      }

      togglePlayerTurn();

      TicTacToe.insert({ r: row, c: column, type: type });

      if (isWinningMove(row, column, type)) {
        alert("Player " + actingPlayer + " wins!");
        Meteor.call("resetGame");
      } else if (isTie()) {
        alert("Tie game!");
        Meteor.call("resetGame");
      }
    }
  });
}

if (Meteor.isServer) {
  Meteor.methods({
    resetGame: function() { 
      TicTacToe.remove({});
      TicTacToe.insert({ "player_num": 1 });
    }
  });

  Meteor.startup(function () {
    var player1Turn = TicTacToe.findOne({"player_num": 1}) !== undefined;
    var player2Turn = TicTacToe.findOne({"player_num": 2}) !== undefined;
    if (!player1Turn && !player2Turn) {
      TicTacToe.insert({"player_num": 1});
    }
  });
}
