angular.module('app').directive('myPetShop', function() {
  return {
    scope: {
      title: '@',
      dogs: '=',
      cats: '=',
      'quoted': '='
    },
    template: require('./basic.html'),
    link: function (scope, el, attrs) {
      console.log('This is my pet shop!');
    }
  };
});
