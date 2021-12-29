// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path")

module.exports = {
  process(sourceText, filePath) {
    return `module.exports = '${JSON.stringify(path.basename(filePath))}';`
  },
}
