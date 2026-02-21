module.exports = {
  path: process.cwd(),
  resolve: (pathToResolve) => require('path').join(process.cwd(), pathToResolve),
  toString: () => process.cwd()
};