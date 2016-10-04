'use strict';

const utils = require('../../utils');
const htmlParser = require('../../html-parser');

module.exports = {
  analyzeAllInFile: analyzeAllInFile
};

function analyzeAllInFile(ast, filePath, rootPath) {
  return Promise.resolve(getDirectiveCallNodes(ast))
    .then(directiveCallNodes => {
      return Promise.all(directiveCallNodes.map(node => getComponentDetails(node, filePath)));
    })
    .then(components => {
      return {
        components: components,
        errors: []
      };
    })
    .catch(err => {
      return {
        components: [],
        errors: [err]
      };
    });
}

function getDirectiveCallNodes(ast) {
  return utils.getNodesByType(ast.program, 'CallExpression')
    .filter(node => {
      return (node.callee && node.callee.property && node.callee.property.name === 'directive');
    });
}

function getComponentDetails(node, filePath) {
  // TODO: it's 1:30am and I'm getting sloppy - clean up this whole flow
  const templatePath = filePath.replace('.js', '.html');
  return getDependencies(templatePath)
    .then(dependencies => {
      return {
        type: 'angular-directive',
        path: filePath,
        name: getName(node),
        module: getModuleName(node),
        scope: getScope(node, filePath),
        templatePath: getTemplate(node),  // TODO: reuse?
        dependencies: dependencies
      };
    });
}

function getName(directiveCallNode) {
  const directiveNameNode = directiveCallNode.arguments[0];
  if (directiveNameNode.type === 'StringLiteral') {
    return directiveNameNode.value;
  } else {
    throw new Error('directive name type not handled: ', directiveNameNode.type);
  }
}

function getModuleName(directiveCallNode) {
  if (directiveCallNode.callee.type === 'MemberExpression' &&
      directiveCallNode.callee.object.type === 'CallExpression' &&
      directiveCallNode.callee.object.callee.property.name === 'module') {

    const ngModuleCallNode = directiveCallNode.callee.object;
    return ngModuleCallNode.arguments[0].value;
  } else {
    return null;
  }
}

function getScope(directiveCallNode, filePath) {
  const scopeNodes = utils.getNodesByType(directiveCallNode, 'ObjectProperty')
    .filter(node => (node.key && node.key.name && node.key.name === 'scope'));

  if (scopeNodes.length === 0) {
    return null;
  } else if (scopeNodes.length > 1) {
    // TODO: this can happen with chained module.directive().directive() calls
    throw new Error('Parser bug: multiple scope declarations found', scopeNodes);
  }

  const scopeNode = scopeNodes[0];
  if (scopeNode.value.properties) {
    return scopeNode.value.properties
      .map(property => property.key.name);
  } else if (scopeNode.value.type === 'BooleanLiteral') {
    return scopeNode.value.value;
  } else {
    throw new error('Parser bug while parsing scope value');
  }
}

function getTemplate(directiveCallNode) {
  const templateUrl = getTemplateUrl(directiveCallNode);

  // TODO: handle `template` as well as `templateUrl`

  // TODO: get HTML and parse it

  // TODO: get component dependencies out of the HTML

  // console.log('template:', templateUrl);
  return templateUrl;
}

function getTemplateUrl(directiveCallNode) {
  const templateUrlNodes = utils.getNodesByType(directiveCallNode, 'ObjectProperty')
    .filter(node => (node.key && node.key.name === 'templateUrl'));

  if (templateUrlNodes.length === 0) {
    return null;
  }

  const templateUrlNode = templateUrlNodes[0];
  if (templateUrlNode.value.type === 'StringLiteral') {
    return templateUrlNode.value.value;
  } else {
    throw new Error('Unrecognized directive templateUrl:', templateUrlNode);
  }
}

function getDependencies(templatePath) {
  return utils.getFileContents(templatePath)
    .then(templateContents => htmlParser.getDependencies(templateContents, templatePath))
    .catch(err => {
      if (err.code === 'ENOENT') {
        console.log('does not exist, bro');
        return [];
      } else {
        return Promise.reject(err);
      }
    });
}




function debugNode(node) {
  // TODO: remove this function
  console.log(JSON.stringify(node, null, 2));
}
