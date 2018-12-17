var connection = require("../database/connection");

module.exports = {
    getUsersList: function(callback) {
    
        var query = "SELECT * FROM Users";
        
        connection.query(query,callback);
      
      },

      getUser: function(_username,_password, callback) {
    
        connection.query('SELECT * from Users where username = ? and password = ? and state = 0',[_username,_password],callback)
        
      
      },
}