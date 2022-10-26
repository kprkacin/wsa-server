import { Square, SquareSymbol } from "../types/Square";

export const defineWinner = (squares: Square[]): SquareSymbol | null => {
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < winningCombinations.length; i++) {
    const [a, b, c] = winningCombinations[i];
    if (
      squares[a].symbol &&
      squares[a].symbol === squares[b].symbol &&
      squares[a].symbol === squares[c].symbol
    ) {
      return squares[a].symbol!;
    }
  }
  return null;
};
