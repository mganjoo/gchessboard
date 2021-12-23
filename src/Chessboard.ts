export class Chessboard {
  boardElement: HTMLDivElement
  name: string | undefined

  constructor(container: HTMLElement) {
    this.boardElement = document.createElement("div")
    this.updateContent()
    container.appendChild(this.boardElement)
  }

  private updateContent() {
    this.boardElement.textContent = `Hello there, ${this.name || "stranger"}`
    // this.boardElement.innerText = `Hello there, ${this.name || "stranger"}`;
  }

  setName(name: string) {
    this.name = name
    this.updateContent()
  }
}
