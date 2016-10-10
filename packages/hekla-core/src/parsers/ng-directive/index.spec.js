'use strict';

const path = require('path');
const AngularDirectiveParser = require('./index');

function makeModule(path) {
  return {
    path: path,
    contents: loadContents(path)
  };
}

function getComponentFromResults(results) {
  if (results.errors.length > 0) {
    console.error('Error while extracting components:');
    console.error(results.errors[0].stack);
  }
  expect(results.components).have.length(1);
  expect(results.errors).to.have.length(0);
  return results.components[0];
}

describe('AngularDirectiveParser', () => {
  let basicModule;
  let inlineModule;
  let inlineConcatModule;
  let inlineArrayJoinModule;
  let templateUrlModule;
  let templateUrlFnModule;

  before(() => {
    basicModule = makeModule(path.resolve(__dirname, './test-examples/basic.js'));
    inlineModule = makeModule(path.resolve(__dirname, './test-examples/inline.js'));
    inlineConcatModule = makeModule(path.resolve(__dirname, './test-examples/inline-concat.js'));
    inlineArrayJoinModule = makeModule(path.resolve(__dirname, './test-examples/inline-array-join.js'));
    templateUrlModule = makeModule(path.resolve(__dirname, './test-examples/template-url.js'));
    templateUrlFnModule = makeModule(path.resolve(__dirname, './test-examples/template-url-function.js'));
  });

  describe('extractComponents', () => {

    it('should extract a basic directive', (done) => {
      const parser = new AngularDirectiveParser();
      parser.extractComponents(basicModule)
        .then(getComponentFromResults)
        .then(component => {
          expect(component.name).to.equal('myPetShop');
          expect(component.altNames).to.deep.equal(['my-pet-shop']);
          expect(component.type).to.equal('angular-directive');
          expect(component.properties).to.deep.equal({
            angularModule: 'app',
            scope: [
              'title',
              'dogs',
              'cats',
              'quoted'
            ]
          });
          done();
        })
        .catch(err => done(err));
    });

    it('should extract a directive with required template file', (done) => {
      const parser = new AngularDirectiveParser();
      parser.extractComponents(basicModule)
        .then(getComponentFromResults)
        .then(component => {
          expect(component.dependencies).to.deep.equal([
            'my-pet-title'
          ]);
          done();
        })
        .catch(err => done(err));
    });

    it('should extract a directive with a simple inline template', (done) => {
      const parser = new AngularDirectiveParser();
      parser.extractComponents(inlineModule)
        .then(getComponentFromResults)
        .then(component => {
          expect(component.name).to.equal('myPetShop');
          expect(component.type).to.equal('angular-directive');
          expect(component.dependencies).to.deep.equal([
            'my-pet-title'
          ]);
          done();
        })
        .catch(err => done(err));
    });

    it('should extract a directive with a contatenated inline template', (done) => {
      const parser = new AngularDirectiveParser();
      parser.extractComponents(inlineConcatModule)
        .then(getComponentFromResults)
        .then(component => {
          expect(component.dependencies).to.deep.equal([
            'my-pet-title'
          ]);
          done();
        })
        .catch(err => done(err));
    });

    it('should extract a directive with an inline template as a joined array', (done) => {
      const parser = new AngularDirectiveParser();
      parser.extractComponents(inlineArrayJoinModule)
        .then(getComponentFromResults)
        .then(component => {
          expect(component.dependencies).to.deep.equal([
            'my-pet-title'
          ]);
          done();
        })
        .catch(err => done(err));
    });

    it('should extract a directive with a templateUrl', (done) => {
      const parser = new AngularDirectiveParser();
      parser.extractComponents(templateUrlModule)
        .then(getComponentFromResults)
        .then(component => {
          expect(component.dependencies).to.deep.equal([
            'my-pet-title'
          ]);
          done();
        })
        .catch(err => done(err));
    });

    it('should gracefully fail with an evaluated templateUrl', (done) => {
      const parser = new AngularDirectiveParser();
      parser.extractComponents(templateUrlFnModule)
        .then(getComponentFromResults)
        .then(component => {
          expect(component.dependencies).to.deep.equal([]);
          done();
        })
        .catch(err => done(err));
    });

  });

});
