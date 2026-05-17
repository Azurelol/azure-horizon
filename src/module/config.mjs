const AH = {};

AH.chess = {
  pieces: {
    pawn: {
      label: "AH.Chess.Pieces.P",
      abbr: "P",
      value: 1,
    },
    knight: {
      label: "AH.Chess.Pieces.K",
      abbr: "N",
      value: 3,
    },
    bishop: {
      label: "AH.Chess.Pieces.B",
      abbr: "B",
      value: 3,
    },
    rook: {
      label: "AH.Chess.Pieces.R",
      abbr: "R",
      value: 5,
    },
    queen: {
      label: "AH.Chess.Pieces.Q",
      abbr: "Q",
      value: 9,
    },
    king: {
      label: "AH.Chess.Pieces.K",
      abbr: "K",
      value: Infinity,
    },
  },
};

export default AH;
