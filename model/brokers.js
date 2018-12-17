var connection = require("../database/connection");

module.exports = {
	
  getBrokerList: function(_brokerParentUserId,_size,_page,callback) {

    var pageQuery = "LIMIT " + _size;

    if(_page > 1)
    {
      pageQuery = "LIMIT " + _size * (_page -1) + "," +  _size; 
    }

    // console.log(pageQuery);
    if(_brokerParentUserId && _brokerParentUserId !== "" )
    {
     
      connection.query("SELECT COUNT (userId) as total FROM `XeVip-CRM`.TBL_BROKER WHERE parent_id = ? AND status >= 0 ",[_brokerParentUserId],function (err,count){
        if(!err)
        {
          var total = count[0].total;
          console.log(count[0].total);
          connection.query("SELECT userId as brokerUserId, username as brokerUsername, displayname as brokerDisplayName, level as brokerLevel  FROM `XeVip-CRM`.TBL_BROKER WHERE parent_id = ? AND status >= 0 " + pageQuery, [_brokerParentUserId],function(errCount,rows){
            callback(null,{"items": rows,"total":parseInt(total),"page":parseInt(_page),"size":parseInt(_size)})
          });
        }
        else
        {
          callback(errCount,null);
        }
      } );

      
    }
    else
    {
      connection.query("SELECT COUNT (userId) as total FROM `XeVip-CRM`.TBL_BROKER WHERE (parent_id IS NULL OR RTRIM(parent_id) = '') AND status >= 0 ",[_brokerParentUserId],function (err,count){
        if(!err)
        {
          var total = count[0].total;
          console.log(count[0].total);
          connection.query("SELECT userId as brokerUserId, username as brokerUsername, displayname as brokerDisplayName, level as brokerLevel  FROM `XeVip-CRM`.TBL_BROKER WHERE (parent_id IS NULL OR RTRIM(parent_id) = '') AND status >= 0 " + pageQuery,function(errCount,rows){
            if(!errCount)
            {
            callback(null,{"items":  rows,"total":parseInt(total),"page":parseInt(_page),"size":parseInt(_size)})
            }
            else
            {
              callback(errCount,null);
            }
          });
        }
        else
        {
          callback(err,null);
        }
      } );
     
     
    }
  },

  getBrokerInfo: function(_brokerUserId,callback) {

    var query = "SELECT " + 
     "userId as brokerUserId, "           +
      "username as brokerUsername, "      +
      "displayname as brokerDisplayName," +
      "regtime as regTime,"               +
      "parent_id as parentBrokerId, "     +
      "level as brokerLevel,"             +
      "userAvatar as userAvatar ,"        +
      "0 as totalBoughtFromBrokers, "     +
      "0 as totalSoldToBrokers, "         +
      "0 as totalBoughtFromUsers,"        +
      "0 as totalSoldToUsers, "           +
      "0 as commissionAmt, "              +
      "status as status "               +
      "FROM `XeVip-CRM`.TBL_BROKER WHERE userId = " + _brokerUserId 
      //+ " AND status >= 0"
      ;
    ;

    connection.query(query,callback);
  
  },

  addBroker: function(_userId, _parentBrokerId,_level, _Username, _userDisplayName, _userAvatar  ,callback) {


    console.log(_level);

    var query = "INSERT INTO TBL_BROKER (userId, username, displayname, level, parent_id, userAvatar) VALUES (?)";
    var values = [_userId,_Username,_userDisplayName,_level,_parentBrokerId,_userAvatar];
    
    connection.query(query,[values],callback);
  
  },

  deleteBroker: function(_userId,callback) {

    var query = "UPDATE TBL_BROKER SET status = '-1' WHERE userId = ?";
    connection.query(query,[_userId],callback);
  
  },

  updateSummaryBroker: function(_userId,_totalBoughtFromBrokers,_totalSoldToBrokers,_totalBoughtFromUsers,_totalSoldToUsers ,callback) {

    var query = "UPDATE TBL_BROKER SET totalBoughtFromBrokers = totalBoughtFromBrokers + ?, " 
    + "totalSoldToBrokers = totalSoldToBrokers + ?, " 
    + "totalBoughtFromUsers = totalBoughtFromUsers + ?, " 
    + "totalSoldToUsers = totalSoldToUsers + ? " 
    + "WHERE userId = ?";
    connection.query(query,[_totalBoughtFromBrokers,_totalSoldToBrokers,_totalBoughtFromUsers,_totalSoldToUsers,_userId],callback);
  
  },


  addTransfer: function(transId , otpFee , senderId ,
     senderBrokerLevel , receiverId , receiverBrokerLevel,
      ccy ,amount, fee,feeInPercent ,feePayeeUserId ,
      receiverUsername,receiverDisplayName,receiverAvatar,
      senderUsername ,senderDisplayName ,senderAvatar , time ,desc ,callback) {


    
        connection.beginTransaction(function(err) {
          if (err) { throw err; }


          var query = "INSERT INTO TBL_TRANSFER (transId , otpFee , senderId , senderBrokerLevel , receiverId , receiverBrokerLevel, ccy ,amount, fee,feeInPercent ,feePayeeUserId ,receiverUsername,receiverDisplayName,receiverAvatar,senderUsername ,senderDisplayName ,senderAvatar , timeTransfer ,note ) VALUES (?)";
          var values = [transId , otpFee , senderId , senderBrokerLevel ,
             receiverId , receiverBrokerLevel, ccy ,amount, fee,feeInPercent ,
             feePayeeUserId ,receiverUsername,receiverDisplayName,receiverAvatar,
             senderUsername ,senderDisplayName ,senderAvatar , time ,desc];
          
            //Save transfer to tranfer table
          connection.query(query, [values], function (error, results) {
            if (error) {
              return connection.rollback(function() {
                callback(error);
              });
            }
            else
            {
              var query = "select * from TBL_BROKER where userID in (?,?)";

              var senderIsBroker = false;
              var receiverIsBroker = false;

              connection.query(query,[senderId,receiverId],function(error, rows)
              {
                for (var i = 0; i < rows.length ; i++) {
                  if(senderId === rows[i].userId)
                  {
                    senderIsBroker = true;
                  }
                  if(receiverId === rows[i].userId)
                  {
                    receiverIsBroker = true;
                  }

                }
                // nguoi ban va nguoi mua deu la dai ly
                if(senderIsBroker && receiverIsBroker)
                {
                  // cap nhat thong tin nguwoi ban
                  module.exports.updateSummaryBroker(senderId,0,amount,0,0,function(error,resultsender){
                    if (error) {
                      return connection.rollback(function() {
                        callback(error);
                      });
                    }
                    else
                    {
                      // cap nhat thong tin nguuwoi mua
                      module.exports.updateSummaryBroker(receiverId,amount,0,0,0,function(error,resultsreceiver){
                        if (error) {
                          return connection.rollback(function() {
                            callback(error);
                          });
                        }
                        else
                        {
                          connection.commit(function(err) {
                            if (err) {
                              return connection.rollback(function() {
                                callback(error);
                              });
                            }
                            else
                            {
                              callback(error,results);
                            }
                          });
                        }
                      });
                    }
                  });
                }
                else
                {
                  // cap nhat thong tin broker ban cho user
                  if(senderIsBroker)
                  {
                    module.exports.updateSummaryBroker(senderId,0,0,0,amount,function(error,resultsreceiver){
                      if (error) {
                        return connection.rollback(function() {
                          callback(error);
                        });
                      }
                      else
                      {
                        connection.commit(function(err) {
                          if (err) {
                            return connection.rollback(function() {
                              callback(error);
                            });
                          }
                          else
                          {
                            callback(error,results);
                          }
                        });
                      }
                    });
                  }
                  // cap nhat thong tin broker mua cua user
                  if(receiverIsBroker)
                  {
                    module.exports.updateSummaryBroker(receiverId,0,0,amount,0,function(error,resultsreceiver){
                      if (error) {
                        return connection.rollback(function() {
                          callback(error);
                        });
                      }
                      else
                      {
                        connection.commit(function(err) {
                          if (err) {
                            return connection.rollback(function() {
                              callback(error);
                            });
                          }
                          else
                          {
                            callback(error,results);
                          }
                        });
                      }
                    });
                  }
                }

              }
              );
            }
        
          });
        });
        
      
      },

      getTransactionList: function(_transID,_senderID,_receiveID,_status,_fromDate,_toDate,_size,_page,callback) {

        var pageQuery = " LIMIT " + _size;
    
        if(_page > 1)
        {
          pageQuery = " LIMIT " + _size * (_page -1) + "," +  _size; 
        }
    
        var query = "SELECT transId, senderId, senderUsername, senderDisplayName, senderBrokerLevel, " +
        "receiverId, receiverUsername, receiverDisplayName, amount, timeTransfer FROM TBL_TRANSFER ";

        var countQuery = "SELECT COUNT (transId) as total FROM TBL_TRANSFER ";

        var filter = "";

        if(_transID && _transID !== "" )
        {
          filter = "WHERE transId = " + connection.escape(_transID) ;
        }
        else
        {
          if(_senderID && _senderID !== "" )
          {
            filter = " senderId = " + connection.escape(_senderID)  ;
          }

          if(_receiveID && _receiveID !== "" )
          {
            filter += (filter!="")? " AND ": "";
            filter = filter + " receiverId = " + connection.escape(_receiveID)  ;
          }
          if(_status && _status !== "" )
          {
            filter += (filter!="")? " AND ": "";
            filter = filter + " status = " + connection.escape(_status)  ;
          }
          if(_fromDate && _fromDate !== "" )
          {
            filter += (filter!="")? " AND ": "";
            filter = filter + " timeTransfer > " + connection.escape(_fromDate)  ;
          }
          if(_toDate && _toDate !== "" )
          {
            filter += (filter!="")? " AND ": "";
            filter = filter + " timeTransfer < " + connection.escape(_toDate)  ;
          }

          if(filter !== "")
          {
            filter = " WHERE " + filter;
          }
        }
        console.log(countQuery + filter);

          connection.query(countQuery + filter,function (errCount,count){
            if(!errCount)
            {
              var total = count[0].total;

              connection.query(query + filter + pageQuery,function(err,rows){
                if(!err)
                {
                callback(null,{"items": rows,"total":parseInt(total),"page":parseInt(_page),"size":parseInt(_size)})
                }
                else{callback(err,null);}
              });
            }
            else
            {
              callback(errCount,null);
            }
          } );
      },


};
