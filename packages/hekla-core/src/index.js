module.exports = {
  Analyzer: require('./Analyzer'),
  Module: require('./Module'),
  ConfigValidator: require('./ConfigValidator'),
  DependencyGraph: require('./utils/dependency-graph'),
  astUtils: require('./utils/ast-utils'),
  fsUtils: require('./utils/fs-utils'),
  plugins: require('./plugins')
};
