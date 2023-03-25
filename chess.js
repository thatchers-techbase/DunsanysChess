var dunsanyFEN = "rnbqkbnr/pppppppp/8/8/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP";

function pieceTheme(piece) {
  // wikipedia theme for white pieces
  if (piece.search(/w/) !== -1) {
    return "img/chesspieces/wikipedia/" + piece + ".png";
  }

  // alpha theme for black pieces
  return "img/chesspieces/alpha/" + piece + ".png";
}

var config = {
  draggable: true,
  dropOffBoard: "snapback",
  position: "start",
  // pieceTheme: pieceTheme()
};

var board1 = Chessboard("board", config);
