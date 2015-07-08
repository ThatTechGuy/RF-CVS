(function(){
  var app = angular.module('riskFactor', ['firebase', 'ngRoute', 'ngJustGage', 'risk-service']);

  app.config(function($routeProvider){
    $routeProvider.when('/', {
      templateUrl: 'views/list.html',
      controller: 'ListController',
      controllerAs: 'list'
    }).when('/chek', {
      templateUrl: 'views/chek.html',
      controller: 'FormController',
      controllerAs: 'form'
    }).when('/info', {
      templateUrl: 'views/info.html',
      controller: 'FormController',
      controllerAs: 'form'
    }).when('/spec/:urlKey', {
      templateUrl: 'views/spec.html',
      controller: 'SpecController',
      controllerAs: 'spec'
    }).otherwise({
      redirectTo: '/'
    });
  });

  app.factory('checkFactory', ['$firebase', function($firebase){
    var ref = new Firebase("https://riskfactor.firebaseio.com/checks");
    return $firebaseArray(ref);
  }]);

  app.factory('storeFactory', ['$firebase', function($firebase){
    var ref = new Firebase("https://riskfactor.firebaseio.com/store");
    return $firebaseObject(ref);
  }]);

  app.factory('dataFactory', function(){
    return {};
  });

  app.controller('AppController', ['$location', function($location){
    this.pageLoad = function(page){
      $location.path('/'+page);
    };
  }]);

  app.controller('ListController', ['checkFactory','$location', function(checkFactory,$location){
    this.checkList = checkFactory;

    this.viewCheck = function(check){
      var ref = this.checkList.$keyAt(check);
      $location.path('/spec/'+ref);
    };

  }]);

  app.controller('FormController', ['checkFactory','storeFactory','dataFactory','rfService','$location',
  function(checkFactory,storeFactory,dataFactory,rfService,$location){
    this.checkList = checkFactory;
    this.storeList = storeFactory;
    this.dataStore = dataFactory;

    this.check = this.dataStore.check || {};
    this.dataStore.check = this.dataStore.check || {};
    this.riskFactor = this.dataStore.rfactor || 0;

    this.update = function(state){
      this[state].rfactor = this.dataStore.check.rfactor;
      var req = rfService[state](this[state]);

      if(state === 'check'){
        this.check = req.check;

        for (var key in req.store){
          this.dataStore[key] = req.store[key];
        };
      }else if(state === 'verify'){
        this.check = {};

        for (var key in this.dataStore.check){
          this.check[key] = this.dataStore.check[key];
        };

        this.check.verify = req.verify;
        this.check.rfactor = req.rfactor;
      }

      this.riskFactor = Math.max(0,this.check.rfactor);
      this.riskFactor = Math.min(10,this.riskFactor);
    };

    this.storeCheck = function(){
      this.dataStore.check = this.check;
      this.dataStore.rfactor = this.riskFactor;

      if(this.check.verify){
        var date = new Date();
        this.check.timestamp = date.toJSON();

        for (var key in this.check.verify){
          this.check.verify[key] = this.check.verify[key] || 0;
        };

        this.checkList.$add(this.check).then(function(ref){
          $location.path('/spec/'+ref.key());
        });

        this.dataStore.check = {};
        this.dataStore.rfactor = 0;
      }
    };

  }]);

  app.controller('SpecController', ['$routeParams','checkFactory','storeFactory','$location',
  function($routeParams,checkFactory,storeFactory,$location){
    this.checkList = checkFactory;
    this.storeList = storeFactory;
    this.editOn = false;

    var cKey = $routeParams.urlKey;
    this.check = this.checkList.$getRecord(cKey);

    this.toggleEdit = function(){
      if(this.editOn){
        this.editOn = false;
      }else{
        this.editOn = true;
      }
    };

    this.delCheck = function(){
      this.checkList.$remove(this.check);
      $location.path('/');
    };

  }]);

})();
