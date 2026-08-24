function readPackage(pkg, context) {
  if (pkg.name === "express" && pkg.version === "4.22.1" && pkg.dependencies?.qs !== "6.15.2") {
    pkg.dependencies = { ...pkg.dependencies, qs: "6.15.2" };
    context.log("Security override: express@4.22.1 now resolves qs@6.15.2");
  }
  return pkg;
}

module.exports = {
  hooks: { readPackage },
};
