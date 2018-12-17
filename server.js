
var express = require('express');
var bodyParser = require('body-parser');

var proxy = require('express-http-proxy');

var broker = require('./model/brokers.js');
var users = require('./model/users.js');

var app = express();

// app.use(express.static(__dirname + '/files'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/private/broker-access/login', proxy('http://localhost:9000/private/broker-access/login'));
// app.post('/private/auth', proxy('http://localhost:9000/private/auth',{
//   proxyReqPathResolver: function(req) {
//     return new Promise(function (resolve, reject) {
//       setTimeout(function () {   // simulate async
//         var parts = req.url.split('?');
//         var queryString = parts[1];
//         var updatedPath = parts[0].replace(/test/, 'tent');
//         var resolvedPathValue = updatedPath + (queryString ? '?' + queryString : '');
//         resolve(resolvedPathValue);
//       }, 200);
//     });
//   }
// }));

// app.post("/private/broker-access/login",function(req,res){
//   console.log(req.body);
// });

app.listen(3007,function(){
    console.log('Node server running @ http://localhost:3007')
});

app.get("/",function(req,res){

  res.json("XEVIP Club API is running");
});



const PAGING_SIZE = 30;

app.get("/getUserList",function(req,res){

  users.getUsersList(function(err,rows)
  {
   if(!err)
   {
    res.json({"data":rows,"status":"ok"});
    return;
   }
   else
   {
    res.json({"error":err,"status":"false"});
   }
  })
});



app.post("/login",function(req,res){
  console.log(req.body);
  var userId            = req.body.username ;
  var password            = req.body.password ;

                       
  if(userId !== undefined && userId.trim() !== '' && password !== undefined && password.trim() !== '')
  {
    users.getUser(userId,password,
      function(err, rows, fields) 
      {
         if (!err)
       {
         if(rows.length >0)
         {
          res.json({"data":rows,"statusCode":"Ok"});
         }
       }
       else
       {
        res.json({"error":err,"statusCode":"false"});
       }
       
       // console.log('The solution is: ', row1);
       
      });
  }
  else
  {


    res.json({"error":"NOTFOUND","status":"false"});

  }

});

app.post("/private/remove-broker",function(req,res){

  var userId            = req.body.userId ;
                          
  if(userId !== undefined && userId.trim() !== '')
  {
    broker.getBrokerInfo(userId.trim(),function(err,rows)                          // Kiểm tra mã đại lý có tồn tại không
    {
     if(!err)
     {
       
        if(rows.length > 0)                                                       // tim thay  thong tin dai ly
        {
          // console.log(rows[0].status);
          if(rows[0].status >= 0)                                                 //dai ly hop le
          {
            console.log(rows[0]);
            var parentBrokerId = rows[0].parentBrokerId;                          // lấy mã đại lý cấp trên
            var brokerLevel =  rows[0].brokerLevel;
            broker.deleteBroker(userId,function(err,bLevel)
            {
              if(!err)
              {
                res.json({"data":{"parentBrokerId":parentBrokerId,"brokerLevel":brokerLevel},"status":"ok"});
                return;
              }
              else
              {
                res.json({"error":err,"status":"false"});
              }
            })
          }  
          else                                                                    //Dai ly da bi xoa hoac banned
          {
            var errDelete = new Error();
            errDelete.code = "403";
            errDelete.message = "Broker has been banned or deleted!";
            res.json({"error":errDelete,"status":"false"});
          }
        }
          
        else                                                                      // Khong tim thay thong tin dai ly
        {
          var errNotFound = new Error();
          errNotFound.code = "404";
          errNotFound.message = "Broker not found!";
          res.json({"error":errNotFound,"status":"false"});
        }
         
      return;
     }
     else
     {
      res.json({"error":err,"status":"false"});
     }
    })
  }
  else
  {
    var errNotFound = new Error();
    errNotFound.code = "404";
    errNotFound.message = "userId param is missing!";
    res.json({"error":errNotFound,"status":"false"});
  }

});

app.post("/private/accept-transfer",function(req,res){

  var transId                 = req.body.transId  ;
  var otpFee                  = req.body.otpFee   ;
  var senderId                = req.body.senderId   ;
  var senderBrokerLevel       = req.body.senderBrokerLevel   ;
  var receiverId              = req.body.receiverId   ;
  var receiverBrokerLevel     = req.body.receiverBrokerLevel;
  var ccy                     = req.body.ccy   ;
  var amount                  = req.body.amount   ;
  var fee                     = req.body.fee   ;
  var feeInPercent            = req.body.feeInPercent   ;
  var feePayeeUserId          = req.body.feePayeeUserId    ;
  var receiverUsername        = req.body.receiverUsername    ;
  var receiverDisplayName     = req.body.receiverDisplayName    ;
  var receiverAvatar          = req.body.receiverAvatar ;
  var senderUsername          = req.body.senderUsername     ;
  var senderDisplayName       = req.body.senderDisplayName     ;
  var senderAvatar            = req.body.senderAvatar     ;
  var time                    = req.body.time    ;
  var desc                    = req.body.desc     ;
                          
  if(transId !== undefined && transId.trim() !== '' && senderId !== undefined && senderId.trim() !== '' && receiverId !== undefined && receiverId.trim() !== '')
  {
    broker.addTransfer(transId , otpFee , senderId ,
      senderBrokerLevel , receiverId , receiverBrokerLevel,
       ccy ,amount, fee,feeInPercent ,feePayeeUserId ,
       receiverUsername,receiverDisplayName,receiverAvatar,
       senderUsername ,senderDisplayName ,senderAvatar , time ,desc,function(err,rows)  
    {
     if(!err)
     {
      res.json({"data":{"transId":transId},"status":"ok"});
     }
     else
     {
      res.json({"error":err,"status":"false"});
     }
    })
  }
  else
  {
    var errNotFound = new Error();
    errNotFound.code = "404";
    errNotFound.message = "userId param is missing!";
    res.json({"error":errNotFound,"status":"false"});
  }

});

app.get("/private/get-transaction-list",function(req,res){
  

    var _transID = req.query.transID;
    var _senderID = req.query.senderID;
    var _receiveID = req.query.receiveID;
    var _status = req.query.status;
    var _fromDate = Number(req.query.fromDate);
    var _toDate = Number(req.query.toDate);
    var _page = req.query.page;
    var _size =  req.query.size; 
  
      if(_transID === undefined)
      _transID = '';

      if(_size === undefined || _size === 0)
        size = PAGING_SIZE;
      
      if(_page === undefined || _page === 0)
        page = 1;
  
    broker.getTransactionList(_transID,_senderID,_receiveID,_status,_fromDate,_toDate,_size,_page,function(err,rows)
    {
     if(!err)
     {
      res.json({"data":rows,"status":"ok"});
      return;
     }
     else
     {
      res.json({"error":err,"status":"false"});
     }
    })
  });