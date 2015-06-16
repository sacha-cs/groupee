var TIMEOUT_TIME = 30 * 1000;

getHandler.addHandler("notifications/get_new", getNew);
getHandler.addHandler("notifications/get_some", getSome);

var connections = {};

function createConnectionData(user, callback) {
    if(connections[user])
        return callback();
    pg.connect(connectionString, function(err, client, done) {
        var query="SELECT last_seen " +
                  "FROM users " +
                  "WHERE username='" + user + "'";
        client.query(query, function(err, result) {
            var lastSeen = result.rows[0].last_seen;
            connections[user] = {
                response: null,
                lastSeen: lastSeen,
                timeOut: null
            }
            callback();
            done(client);
        });
    });
}

this.checkForNotification = function(message, fromUser, group, feature) {
    var users=message.match(/@[^\s]+/g);
    if(!users)
        return;
    pg.connect(connectionString, function(err, client, done) {
        for(var i = 0; i < users.length; i++) {
            var toUser = users[i].substring(1);
            toUser = toUser.toLowerCase();
            var query = "SELECT username, group_id " +
                        "FROM member_of " +
                        "WHERE username='" + toUser + "' " + 
                        "  AND group_id=" + group + ";";
            client.query(query, function(err, result) {
                if(err) return;
                if(!result.rows || result.rows.length == 0) {
                    return;
                }
                //We know the user exists and is in the current group
                notify(fromUser, toUser, group, feature);
            });
        }
        client.on('drain', function() { done(client); });
    });
}

function notify(fromUser, toUser, group, feature) {
    if(connections[toUser]) {
        pg.connect(connectionString, function(err, client, done) {
            var query = "SELECT group_name " +
                        "FROM groups " +
                        "WHERE group_id=" + group;
            client.query(query, function(err, res) {
                var groupName = res.rows[0].group_name;
                var response = connections[toUser].response;
                utils.respondJSON(response, {
                    fromUser: fromUser,
                    group: groupName,
                    feature: feature,
                    success: true
                });
                done(client);
            });
        });
    }
    pg.connect(connectionString, function(err, client, done) {
        var query = "INSERT INTO notifications(from_user, to_user, feature, group_id, notification_time) " +
                    "VALUES ('" + fromUser + "', '" + toUser + "', '" + feature + "', " + group + ", now())";
        client.query(query, function(err, response) {
            done(client);
        });
    });
}

function getNew(request, response) {
    var user = utils.getUser(request);
    createConnectionData(user, function() {
        connections[user].response = response;
        connections[user].timeOut = setTimeout(function(response) {
            utils.respondJSON(response, {success:false});
        }, TIMEOUT_TIME, response);
    });
}

function getSome(request, response, params) {
    var number = params.number;
    var user = utils.getUser(request);
    var payload = {
        success: true,
        notifications: []
    }
    pg.connect(connectionString, function(err, client, done) {
        var query = "SELECT * FROM notifications " +
                    "WHERE to_user='" + user + "' " +
                    "ORDER BY notification_id " +
                    "LIMIT " + number;
        client.query(query, function(err, res) {
            if(err) { return utils.respondJSON(response, {success:false}); }
            for(var i = 0; i < res.rows.length; i++) {
                var row = res.rows[i];
                payload.notifications.push({
                    fromUser: row.from_user,
                    group: row.group_id,
                    feature: row.feature
                });
            }
            utils.respondJSON(response, payload);
            done(client);
        });
    });
}
