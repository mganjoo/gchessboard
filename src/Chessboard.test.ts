import { Chessboard } from "./Chessboard";

describe("Chessboard", () => {
  it("sets inner text correctly", () => {
    const el = document.createElement("div");
    const board = new Chessboard(el);
    board.setName("Jack");
    expect(el.textContent).toBe("Hello there, Jack");
  });
});
