'use strict';

const path = require('path');
const babylon = require('babylon');
const walk = require('tree-walk');

module.exports = {
  parseAST,
  getNodesByType,
  filterNodes,
  isPromiseCall,
  isASTNode,
  getDeepProperty,
  reduceCallName,
  reduceMemberName,
  getFunctionDeclarationsByName,
  getVariableDeclarationsByName,
  resolveRequirePath
};

function parseAST(fileContents, filePath) {
  try {
    const ast = babylon.parse(fileContents, {
      sourceType: 'module'
    });
    return Promise.resolve(ast);
  } catch (err) {
    return Promise.reject(err);
  }
}

function getNodesByType(tree, nodeType) {
  return walk.filter(tree, walk.preorder, (value, key, parent) => isASTNode(value, key, parent) && value.type === nodeType);
}

function filterNodes(tree, filterFunction) {
  return walk.filter(tree, walk.preorder, (value, key, parent) => isASTNode(value, key, parent) && filterFunction(value, key, parent));
}

function isPromiseCall(callExpNode) {
  return (callExpNode.callee.property &&
    callExpNode.callee.property.type === 'Identifier' &&
    callExpNode.callee.property.name === 'then');
}

function isASTNode(value, key, parent) {
  return (value && typeof value === 'object' && value.type);
}

/**
 * Gets a deep property from a node, if it exists.
 * If the property does not exist, undefined is returned
 *
 * Example:
 * getDeepProperty(myCallNode, 'callee.property.name')
 */
function getDeepProperty(node, deepProperty) {
  const pieces = deepProperty.split('.');
  let currentChildNode = node;
  for (let i = 0; i < pieces.length; i++) {
    if (!currentChildNode.hasOwnProperty(pieces[i])) {
      // A property along the chain is missing
      return undefined;
    }

    if (i === pieces.length - 1) {
      // This is the deep property
      return currentChildNode[pieces[i]];
    }

    // Go to the next node down in the chain
    currentChildNode = currentChildNode[pieces[i]];
  }

  return undefined;
}

function reduceCallName(callExpressionNode) {
  const callee = callExpressionNode.callee;
  if (callee.type === 'Identifier') {
    return callee.name;
  } else if (callee.type === 'MemberExpression') {
    return reduceMemberName(callee);
  } else if (callee.type === 'CallExpression') {
    return '(CallExpression)';
  } else {
    throw new Error(`callee type not handled: ${callee.type}`);
  }
}

function reduceMemberName(memberExpressionNode) {
  let objectName;
  if (memberExpressionNode.object.type === 'MemberExpression') {
     objectName = reduceMemberName(memberExpressionNode.object);
  } else if (memberExpressionNode.object.type === 'Identifier') {
    objectName = memberExpressionNode.object.name;
  } else if (memberExpressionNode.object.type === 'CallExpression') {
    objectName = '(CallExpressionInMember)';
  } else if (memberExpressionNode.object.type === 'ArrayExpression') {
    objectName = '(ArrayExpressionInMember)';
  } else {
    throw new Error(`node type not handled: ${memberExpressionNode.object.type}`);
  }

  let propertyName = memberExpressionNode.property.name;

  return `${objectName}.${propertyName}`;
}

function getFunctionDeclarationsByName(node, identifierName) {
  return getNodesByType(node, 'FunctionDeclaration')
    .filter(node => getDeepProperty(node, 'id.name') === identifierName);
}

function getVariableDeclarationsByName(node, identifierName) {
  const results = [];

  const declarationNodes = getNodesByType(node, 'VariableDeclaration');
  declarationNodes.forEach(node => {
    node.declarations.forEach(declarator => {
      if (declarator.id.type === 'Identifier' && declarator.id.name === identifierName) {
        results.push(declarator.init);
      }
    });
  });

  return results;
}

function resolveRequirePath(requiredPathString, modulePath) {
  let cleanRequiredPath = requiredPathString;
  if (requiredPathString.indexOf('!') !== -1) {
    const pieces = requiredPathString.split('!');
    cleanRequiredPath = pieces[pieces.length - 1];
  }
  return path.resolve(modulePath, '..', cleanRequiredPath);
}

function simplifyFunctionDeclarationNode(node) {
  return {
    id: node.id.name
  };
}

function simplifyVariableDeclarationNode(node) {
  return {
    type: node.type,
    kind: node.kind,
    id: node.declarations[0].id.name
  };
}
