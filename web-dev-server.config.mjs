const open = process.argv.includes("--open");
const watch = process.argv.includes("--watch");

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  open,
  watch,
  appIndex: "index.html",
});
