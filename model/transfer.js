var connection = require("../database/connection");

module.exports = {
    addTransfer: function(transId , otpFee , senderId
        ,senderBrokerLevel , receiverId , receiverBrokerLevel
        ,ccy ,amount, fee,feeInPercent ,feePayeeUserId
        ,receiverUsername,receiverDisplayName, time
        ,desc ,callback) {


        console.log(_level);
    
        var query = "INSERT INTO TBL_TRANSFER (transId , otpFee , senderId , senderBrokerLevel , receiverId , receiverBrokerLevel, ccy ,amount, fee,feeInPercent ,feePayeeUserId ,receiverUsername,receiverDisplayName, time ,desc ) VALUES (?)";
        var values = [_userId,_Username,_userDisplayName,_level,_parentBrokerId,_userAvatar];
        
        connection.query(query,[values],callback);
      
      },
}