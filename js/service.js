(function(){
  var app = angular.module('risk-service', []);

  app.service('rfService', function(){

    this.check = function(check){
      var store = {};
      check.redflag = [];

      check.class = false;
      store.reqCust = false;
      store.reqMake = false;
      store.reqCall = false;
      store.reqBank = false;

      switch(check.type){
        case 'Personal':
          check.rfactor = 6;
          if(check.customer !== 'Frequent'){
            store.reqCust = true;
          }
          break;
        case 'Government':
          check.rfactor = 2;
          if(check.maker === 'New'){
            store.reqMake = true;
          }
          break;
        case 'Payroll':
          check.rfactor = 2;
          if(check.customer === ('New' || 'Seasonal')){
            store.reqCust = true;
          }
          if(check.maker !== 'Regular'){
            store.reqMake = true;
          }
          break;
        case 'Corporate':
          check.rfactor = 4;
          if(check.amount > 1000){
            check.redflag.push('COR');
            check.class = true;
          }
          if(check.redflag.indexOf('COR') === -1){
            check.redflag.push('DBA');
          }
          if(check.customer !== 'Frequent'){
            store.reqCust = true;
          }
          if(check.maker === 'New'){
            store.reqMake = true;
          }
          break;
        case 'Other':
          check.rfactor = 6;
          if(check.customer !== 'Frequent'){
            store.reqCust = true;
          }
          if(check.maker !== 'Regular'){
            store.reqMake = true;
          }
          break;
        default:
          check.rfactor = 0;
          break;
      };

      if(check.amount <= 100){
        check.rfactor = 2;

      }else if(check.amount < 300){
        check.rfactor += 2;
        store.reqCall = true;

      }else if(check.amount < 500){
        check.rfactor += 4;
        store.reqCall = true;
        store.reqBank = true;

      }else if(check.amount < 1000){
        check.rfactor += 6;
        store.reqCall = true;
        store.reqBank = true;

      }else if(check.amount < 2000){
        check.rfactor += 8;
        check.redflag.push('COT');
        check.class = true;
        store.reqCall = true;
        store.reqBank = true;

      }else if(check.amount >= 2000){
        check.rfactor += 10;
        check.redflag.push('COT');
        check.class = true;
        store.reqCall = true;
        store.reqBank = true;
      }

      var x = check.number / 100;
      var y = x % 10;

      if(x >= 1.5){
        check.rfactor -= 1;
      }else if(check.number){
        check.redflag.push('LCN');
        check.class = true;
      }
      if(y >= 1.5){
        check.rfactor -= 1;
      }else if(check.number && check.redflag.indexOf('LCN') === -1){
        check.redflag.push('PLC');
      }
      if(check.customer === 'Frequent'){
        check.rfactor -= 4;
        store.reqCall = false;
        store.reqBank = false;
        var custFreq = true;
      }
      if(check.maker === 'Regular'){
        check.rfactor -= 2;
        store.reqCall = false;
        store.reqBank = false;
        var makeReg = true;
      }
      if(check.customer === 'New' && check.maker === 'New'){
        check.redflag.push('NCM');
      }
      if(check.amount > 1000 && (!custFreq || !makeReg)){
        store.reqCall = true;
        store.reqBank = true;
      }

      if(check.class === true){
        check.class = 'label label-danger';
      }else{
        check.class = 'label label-warning';
      }

      return {check: check, store: store};
    };

    this.verify = function(field){
      var store = {};
      store.verify = {};
      var temp = {};

      temp.cRec = field.cRec || 0;
      temp.mRec = field.mRec || 0;
      temp.cDoc = field.cDoc || 0;
      temp.mDoc = field.mDoc || 0;
      temp.cBus = field.cBus || 0;
      temp.mBus = field.mBus || 0;
      temp.job = field.job || 0;
      temp.cmk = field.cmk || 0;
      temp.bof = field.bof || 0;

      for (var key in temp){
        if([0,4].indexOf(parseInt(temp[key])) === -1){
          temp[key] = 1;
        }else{
          temp[key] = 0;
        }
      };

      store.verify.rec = temp.cRec + temp.mRec;
      store.verify.doc = temp.cDoc + temp.mDoc;
      store.verify.bus = temp.cBus + temp.mBus;
      store.verify.job = temp.job;
      store.verify.cmk = temp.cmk;
      store.verify.bof = temp.bof;

      temp.lessRisk = 0;

      for (var key in store.verify){
        temp.lessRisk += store.verify[key];
      };

      store.rfactor = field.rfactor - temp.lessRisk;

      if(temp.cDoc){
        store.rfactor -= 1;
      }
      if(temp.cBus && temp.mBus){
        store.rfactor -= 2;
      }else if(temp.cBus || temp.mBus){
        store.rfactor -= 1;
      }
      if(['2','3'].indexOf(field.bof) >= 0){
        store.rfactor -= 1;
      }


      return store;
    };

  });

})();
