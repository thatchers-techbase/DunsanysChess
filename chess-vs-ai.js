// Board setup
var dunsanyFEN =
  "rnbqkbnr/pppppppp/8/8/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w KQkq - 0 1";

var hordeFEN =
  "rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w KQkq - 0 1";

var board = null;
var game = new Chess(dunsanyFEN);
var validation = game.validate_fen(dunsanyFEN);
console.log(validation);

var config = {
  draggable: true,
  position: dunsanyFEN,
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  showNotation: false,
  pieceTheme: pieceTheme,
};

var globalSum = 0; // Always from black's perspective. Negative for white's perspective.
var searchDepth = 2;

var whiteSquareGrey = "#809BEB";
var blackSquareGrey = "#6175B1";
var whiteSquareGreyEnemy = "#FF5D5D";
var blackSquareGreyEnemy = "#C53A3A";

var character = "wP";

// Gamepad control data
var cursorPosition = "a4";
var selectedSourcePosition = "";
var selectedTargetPosition = "";

var score = 0;
var startTime = Date.now();
var endTime = Date.now();
var highScore = localStorage.getItem("high-score");
const scoreSheet = {
  p: 100,
  n: 200,
  b: 200,
  r: 300,
  q: 500,
  k: 1000,
};
const difficultyLookup = {
  1: "Very Easy",
  2: "Easy",
  3: "Normal",
  4: "Hard",
  5: "Very Hard",
};

/*
 * Piece Square Tables, adapted from Sunfish.py:
 * https://github.com/thomasahle/sunfish/blob/master/sunfish.py
 */

var weights = { p: 100, n: 280, b: 320, r: 479, q: 929, k: 60000, k_e: 60000 };
var pst_w = {
  p: [
    [100, 100, 100, 100, 105, 100, 100, 100],
    [78, 83, 86, 73, 102, 82, 85, 90],
    [7, 29, 21, 44, 40, 31, 44, 7],
    [-17, 16, -2, 15, 14, 0, 15, -13],
    [-26, 3, 10, 9, 6, 1, 0, -23],
    [-22, 9, 5, -11, -10, -2, 3, -19],
    [-31, 8, -7, -37, -36, -14, 3, -31],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [-66, -53, -75, -75, -10, -55, -58, -70],
    [-3, -6, 100, -36, 4, 62, -4, -14],
    [10, 67, 1, 74, 73, 27, 62, -2],
    [24, 24, 45, 37, 33, 41, 25, 17],
    [-1, 5, 31, 21, 22, 35, 2, 0],
    [-18, 10, 13, 22, 18, 15, 11, -14],
    [-23, -15, 2, 0, 2, 0, -23, -20],
    [-74, -23, -26, -24, -19, -35, -22, -69],
  ],
  b: [
    [-59, -78, -82, -76, -23, -107, -37, -50],
    [-11, 20, 35, -42, -39, 31, 2, -22],
    [-9, 39, -32, 41, 52, -10, 28, -14],
    [25, 17, 20, 34, 26, 25, 15, 10],
    [13, 10, 17, 23, 17, 16, 0, 7],
    [14, 25, 24, 15, 8, 25, 20, 15],
    [19, 20, 11, 6, 7, 6, 20, 16],
    [-7, 2, -15, -12, -14, -15, -10, -10],
  ],
  r: [
    [35, 29, 33, 4, 37, 33, 56, 50],
    [55, 29, 56, 67, 55, 62, 34, 60],
    [19, 35, 28, 33, 45, 27, 25, 15],
    [0, 5, 16, 13, 18, -4, -9, -6],
    [-28, -35, -16, -21, -13, -29, -46, -30],
    [-42, -28, -42, -25, -25, -35, -26, -46],
    [-53, -38, -31, -26, -29, -43, -44, -53],
    [-30, -24, -18, 5, -2, -18, -31, -32],
  ],
  q: [
    [6, 1, -8, -104, 69, 24, 88, 26],
    [14, 32, 60, -10, 20, 76, 57, 24],
    [-2, 43, 32, 60, 72, 63, 43, 2],
    [1, -16, 22, 17, 25, 20, -13, -6],
    [-14, -15, -2, -5, -1, -10, -20, -22],
    [-30, -6, -13, -11, -16, -11, -16, -27],
    [-36, -18, 0, -19, -15, -15, -21, -38],
    [-39, -30, -31, -13, -31, -36, -34, -42],
  ],
  k: [
    [4, 54, 47, -99, -99, 60, 83, -62],
    [-32, 10, 55, 56, 56, 55, 10, 3],
    [-62, 12, -57, 44, -67, 28, 37, -31],
    [-55, 50, 11, -4, -19, 13, 0, -49],
    [-55, -43, -52, -28, -51, -47, -8, -50],
    [-47, -42, -43, -79, -64, -32, -29, -32],
    [-4, 3, -14, -50, -57, -18, 13, 4],
    [17, 30, -3, -14, 6, -1, 40, 18],
  ],

  // Endgame King Table
  k_e: [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
  ],
};
var pst_b = {
  p: pst_w["p"].slice().reverse(),
  n: pst_w["n"].slice().reverse(),
  b: pst_w["b"].slice().reverse(),
  r: pst_w["r"].slice().reverse(),
  q: pst_w["q"].slice().reverse(),
  k: pst_w["k"].slice().reverse(),
  k_e: pst_w["k_e"].slice().reverse(),
};

var pstOpponent = { w: pst_b, b: pst_w };
var pstSelf = { w: pst_w, b: pst_b };

function makeRandomMove() {
  var possibleMoves = game.moves();

  // Game over
  if (possibleMoves.length === 0) return;

  var randomIdx = Math.floor(Math.random() * possibleMoves.length);
  game.move(possibleMoves[randomIdx]);
  board.position(game.fen());
}

/*
 * Evaluates the board at this point in time,
 * using the material weights and piece square tables.
 */
function evaluateBoard(game, move, prevSum, color) {
  if (game.in_checkmate()) {
    // Opponent is in checkmate (good for us)
    if (move.color === color) {
      return 10 ** 10;
    }
    // Our king's in checkmate (bad for us)
    else {
      return -(10 ** 10);
    }
  }

  if (game.in_draw() || game.in_threefold_repetition() || game.in_stalemate()) {
    return 0;
  }

  if (game.in_check()) {
    // Opponent is in check (good for us)
    if (move.color === color) {
      prevSum += 50;
    }
    // Our king's in check (bad for us)
    else {
      prevSum -= 50;
    }
  }

  var from = [
    8 - parseInt(move.from[1]),
    move.from.charCodeAt(0) - "a".charCodeAt(0),
  ];
  var to = [
    8 - parseInt(move.to[1]),
    move.to.charCodeAt(0) - "a".charCodeAt(0),
  ];

  // Change endgame behavior for kings
  if (prevSum < -1500) {
    if (move.piece === "k") {
      move.piece = "k_e";
    }
    // Kings can never be captured
    // else if (move.captured === 'k') {
    //   move.captured = 'k_e';
    // }
  }

  if ("captured" in move) {
    // Opponent piece was captured (good for us)
    if (move.color === color) {
      prevSum +=
        weights[move.captured] +
        pstOpponent[move.color][move.captured][to[0]][to[1]];
    }
    // Our piece was captured (bad for us)
    else {
      prevSum -=
        weights[move.captured] +
        pstSelf[move.color][move.captured][to[0]][to[1]];
    }
  }

  if (move.flags.includes("p")) {
    // NOTE: promote to queen for simplicity
    move.promotion = "q";

    // Our piece was promoted (good for us)
    if (move.color === color) {
      prevSum -=
        weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum +=
        weights[move.promotion] +
        pstSelf[move.color][move.promotion][to[0]][to[1]];
    }
    // Opponent piece was promoted (bad for us)
    else {
      prevSum +=
        weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum -=
        weights[move.promotion] +
        pstSelf[move.color][move.promotion][to[0]][to[1]];
    }
  } else {
    // The moved piece still exists on the updated board, so we only need to update the position value
    if (move.color !== color) {
      prevSum += pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum -= pstSelf[move.color][move.piece][to[0]][to[1]];
    } else {
      prevSum -= pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum += pstSelf[move.color][move.piece][to[0]][to[1]];
    }
  }

  return prevSum;
}

/*
 * Performs the minimax algorithm to choose the best move: https://en.wikipedia.org/wiki/Minimax (pseudocode provided)
 * Recursively explores all possible moves up to a given depth, and evaluates the game board at the leaves.
 *
 * Basic idea: maximize the minimum value of the position resulting from the opponent's possible following moves.
 * Optimization: alpha-beta pruning: https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning (pseudocode provided)
 *
 * Inputs:
 *  - game:                 the game object.
 *  - depth:                the depth of the recursive tree of all possible moves (i.e. height limit).
 *  - isMaximizingPlayer:   true if the current layer is maximizing, false otherwise.
 *  - sum:                  the sum (evaluation) so far at the current layer.
 *  - color:                the color of the current player.
 *
 * Output:
 *  the best move at the root of the current subtree.
 */
function minimax(game, depth, alpha, beta, isMaximizingPlayer, sum, color) {
  //console.log(`Searching with a depth of ${depth} for player color ${color}`);
  positionCount++;
  var children = game.ugly_moves({ verbose: true });

  // Sort moves randomly, so the same move isn't always picked on ties
  children.sort(function (a, b) {
    return 0.5 - Math.random();
  });

  var currMove;
  // Maximum depth exceeded or node is a terminal node (no children)
  if (depth === 0 || children.length === 0) {
    return [null, sum];
  }

  // Find maximum/minimum from list of 'children' (possible moves)
  var maxValue = Number.NEGATIVE_INFINITY;
  var minValue = Number.POSITIVE_INFINITY;
  var bestMove;
  for (var i = 0; i < children.length; i++) {
    currMove = children[i];

    // Note: in our case, the 'children' are simply modified game states
    var currPrettyMove = game.ugly_move(currMove);
    var newSum = evaluateBoard(game, currPrettyMove, sum, color);
    var [childBestMove, childValue] = minimax(
      game,
      depth - 1,
      alpha,
      beta,
      !isMaximizingPlayer,
      newSum,
      color
    );

    game.undo();

    if (isMaximizingPlayer) {
      if (childValue > maxValue) {
        maxValue = childValue;
        bestMove = currPrettyMove;
      }
      if (childValue > alpha) {
        alpha = childValue;
      }
    } else {
      if (childValue < minValue) {
        minValue = childValue;
        bestMove = currPrettyMove;
      }
      if (childValue < beta) {
        beta = childValue;
      }
    }

    // Alpha-beta pruning
    if (alpha >= beta) {
      break;
    }
  }

  if (isMaximizingPlayer) {
    return [bestMove, maxValue];
  } else {
    return [bestMove, minValue];
  }
}

function checkStatus(color) {
  console.log(`---Status log for ${color}---`);
  if (game.in_checkmate()) {
    console.log(`Checkmate! Oops, ${color} lost.`);
  } else if (game.insufficient_material()) {
    console.log(`It's a draw! (Insufficient Material)`);
  } else if (game.in_threefold_repetition()) {
    console.log(`It's a draw! (Threefold Repetition)`);
  } else if (game.in_stalemate()) {
    console.log(`It's a draw! (Stalemate)`);
  } else if (game.in_draw()) {
    console.log(`It's a draw! (50-move Rule)`);
  } else if (game.in_check()) {
    console.log(`Oops, ${color} is in <b>check!</b>`);
    return false;
  } else {
    console.log(`No check, checkmate, or draw.`);
    return false;
  }
  return true;
}

function updateAdvantage() {
  if (globalSum > 0) {
    $("#advantageColor").text("Black");
    $("#advantageNumber").text(globalSum);
  } else if (globalSum < 0) {
    $("#advantageColor").text("White");
    $("#advantageNumber").text(-globalSum);
  } else {
    $("#advantageColor").text("Neither side");
    $("#advantageNumber").text(globalSum);
  }
  $("#advantageBar").attr({
    "aria-valuenow": `${-globalSum}`,
    style: `width: ${((-globalSum + 2000) / 4000) * 100}%`,
  });
}

/*
 * Calculates the best legal move for the given color.
 */
function getBestMove(game, color, currSum) {
  positionCount = 0;

  if (color === "b") {
    var depth = searchDepth;
  } else {
    var depth = searchDepth;
  }

  console.log("SEARCH DEPTH: " + searchDepth);

  var d = new Date().getTime();
  var [bestMove, bestMoveValue] = minimax(
    game,
    depth,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    true,
    currSum,
    color
  );
  var d2 = new Date().getTime();
  var moveTime = d2 - d;
  var positionsPerS = (positionCount * 1000) / moveTime;

  $("#position-count").text(positionCount);
  $("#time").text(moveTime / 1000);
  $("#positions-per-s").text(Math.round(positionsPerS));

  return [bestMove, bestMoveValue];
}

/*
 * Calculates the best legal move for the given color.
 */
function getBestMove(game, color, currSum) {
  positionCount = 0;

  if (color === "b") {
    var depth = searchDepth;
  } else {
    var depth = searchDepth;
  }

  var d = new Date().getTime();
  var [bestMove, bestMoveValue] = minimax(
    game,
    depth,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    true,
    currSum,
    color
  );
  var d2 = new Date().getTime();
  var moveTime = d2 - d;
  var positionsPerS = (positionCount * 1000) / moveTime;

  $("#position-count").text(positionCount);
  $("#time").text(moveTime / 1000);
  $("#positions-per-s").text(Math.round(positionsPerS));

  return [bestMove, bestMoveValue];
}

/*
 * Makes the best legal move for the given color.
 */
function makeBestMove(color) {
  if (color === "b") {
    var move = getBestMove(game, color, globalSum)[0];
  } else {
    var move = getBestMove(game, color, -globalSum)[0];
  }

  globalSum = evaluateBoard(game, move, globalSum, "b");
  updateAdvantage();

  game.move(move);
  board.position(game.fen());

  if (color === "b") {
    checkStatus("black");

    // Highlight black move
    if (typeof $board != "undefined") {
      $board.find("." + squareClass).removeClass("highlight-black");
      $board.find(".square-" + move.from).addClass("highlight-black");
      squareToHighlight = move.to;
      colorToHighlight = "black";

      $board
        .find(".square-" + squareToHighlight)
        .addClass("highlight-" + colorToHighlight);
    }
  } else {
    checkStatus("white");

    // Highlight white move
    $board.find("." + squareClass).removeClass("highlight-white");
    $board.find(".square-" + move.from).addClass("highlight-white");
    squareToHighlight = move.to;
    colorToHighlight = "white";

    $board
      .find(".square-" + squareToHighlight)
      .addClass("highlight-" + colorToHighlight);
  }
}

function removeGreySquares() {
  $("#board .square-55d63").css("background", "");
}

function greySquare(square, enemy) {
  var $square = $("#board .square-" + square);

  var background = whiteSquareGrey;
  if ($square.hasClass("black-3c85d")) {
    background = blackSquareGrey;
  }

  if (enemy) {
    var background = whiteSquareGreyEnemy;
    if ($square.hasClass("black-3c85d")) {
      background = blackSquareGreyEnemy;
    }
  }

  $square.css("background", background);
}

function cursorHighlight(square) {
  var $square = $("#board .square-" + square);
  $square.css("box-shadow", "inset 0 0 3px 3px yellow");
  //inset 0 0 3px 3px yellow;
}

function cursorUnhighlight(square) {
  var $square = $("#board .square-" + square);
  $square.css("box-shadow", "");
}

function onMouseoverSquare(square, piece) {
  cursorUnhighlight(cursorPosition);
  cursorHighlight(square);
  cursorPosition = square;

  // get list of possible moves for this square
  var isBlack = piece && piece.startsWith("b");
  var moves = game.moves({
    square: square,
    verbose: true,
    enemy: isBlack,
  });

  // Exit if there are no moves available for this square
  if (moves.length === 0) return;

  // Highlight the square they moused over
  greySquare(square, isBlack);

  // Highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to, isBlack);
  }
}

function onMouseoutSquare(square, piece) {
  removeGreySquares();
}

function onDragStart(source, piece, position, orientation) {
  // Do not pick up pieces if the game is over
  if (game.game_over()) {
    console.log("cant play, game is over");
    return false;
  }

  // Only pick up pieces for White
  if (piece.search(/^b/) !== -1) {
    return false;
  }
}

function onDrop(source, target, mouse) {
  removeGreySquares();

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: "q", // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) {
    console.log("not a move!");
    selectedSourcePosition = "";
    return "snapback";
  }

  if (!mouse) board.position(game.fen());

  if (move.captured) {
    score += scoreSheet[move.captured] * searchDepth;
    document.getElementById("score").innerHTML = `SCORE: ${score}`;
    if (score > highScore) {
      localStorage.setItem("high-score", score);
      document.getElementById("high-score").innerHTML = `HIGH SCORE: ${score}`;
    }

    if (move.captured == "k") {
      console.log("The king has been captured, well done.");
      showScoreScreen();
    }
  }

  // make random legal move for black
  //window.setTimeout(makeRandomMove, 250);

  if (!checkStatus("black")) {
    // Make the best move for black
    cursorUnhighlight(cursorPosition);
    window.setTimeout(function () {
      makeBestMove("b");
    }, 250);
  }
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
  board.position(game.fen());
}

function pieceTheme(piece) {
  if (piece == "wP") {
    return (
      "img/chesspieces/wikipedia/" +
      (typeof character != "undefined" ? character : "wP") +
      ".png"
    );
  } else {
    return "img/chesspieces/wikipedia/" + piece + ".png";
  }
}

function showScoreScreen() {
  document.getElementById("final-score").innerHTML = `SCORE: ${score}`;

  endTime = Date.now();
  var timeTaken = (endTime - startTime) / 1000; // Could potentially measure down to the millisecond if we feel like it
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken - minutes * 60;

  document.getElementById(
    "final-time"
  ).innerHTML = `TIME: ${minutes} minutes, ${seconds} seconds`;

  document.getElementById("setup").style.display = "none";
  document.getElementById("board-container").style.display = "none";
  document.getElementById("score-container").style.display = "block";
}

function startGame() {
  character = document.querySelector(
    'input[name="character-select"]:checked'
  ).value;
  var difficulty = document.querySelector(
    'input[name="difficulty"]:checked'
  ).value;

  console.log(`Play as: ${character} | Difficulty: ${difficulty}`);

  try {
    searchDepth = parseInt(difficulty);
  } catch (e) {
    searchDepth = 3; // fall back to medium
  }

  board = Chessboard("board", config);

  document.getElementById("difficulty-display").innerHTML =
    "DIFFICULTY: " + difficultyLookup[searchDepth];
  document.getElementById("high-score").innerHTML =
    "HIGH SCORE: " + (highScore ? highScore : "0");
  document.getElementById("setup").style.display = "none";
  document.getElementById("board-container").style.display = "block";

  startTime = Date.now();

  // Move the selection cursor with the arrow keys (will help with gamepad support too)
  document.addEventListener(
    "keydown",
    function (event) {
      var previousPosition = cursorPosition;
      var currentVertical = parseInt(cursorPosition[1]);
      var currentHorizontal = cursorPosition.charCodeAt(0) - 97;

      switch (event.key) {
        case "ArrowLeft":
          if (0 < currentHorizontal) {
            cursorPosition =
              String.fromCharCode(96 + currentHorizontal) + currentVertical;
          }
          break;
        case "ArrowRight":
          if (7 > currentHorizontal) {
            cursorPosition =
              String.fromCharCode(98 + currentHorizontal) + currentVertical;
          }
          break;
        case "ArrowDown":
          if (1 < currentVertical) {
            cursorPosition = cursorPosition[0] + (currentVertical - 1);
          }
          break;
        case "ArrowUp":
          if (8 > parseInt(currentVertical)) {
            cursorPosition = cursorPosition[0] + (currentVertical + 1);
          }
          break;
        case " ":
          if (selectedSourcePosition == "") {
            // Selecting a source square
            selectedSourcePosition = cursorPosition;
            console.log(`Player has selected ${selectedSourcePosition}`);
          } else if (selectedSourcePosition != ("" || cursorPosition)) {
            // Selecting a target
            selectedTargetPosition = cursorPosition;
            console.log(`Player has selected ${selectedTargetPosition}`);
            onDrop(selectedSourcePosition, selectedTargetPosition, false);
            selectedSourcePosition = "";
            selectedTargetPosition = "";
          } else if (cursorPosition == selectedSourcePosition) {
            // Cancelling
            selectedSourcePosition = "";
            selectedTargetPosition = "";
            console.log(`Player has cancelled their move`);
          }
          break;
      }
      //console.log(`Cursor position is now ${cursorPosition}`);

      if (selectedSourcePosition == "") {
        onMouseoutSquare();
        onMouseoverSquare(cursorPosition, null);
      }

      cursorUnhighlight(previousPosition);
      cursorHighlight(cursorPosition);
    },
    true
  );
}
