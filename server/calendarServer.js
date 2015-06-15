var groups = {};

postHandler.addHandler("calendar/post_event", calendarPostEvent, true);
getHandler.addHandler("calendar/calendar_update", calendarUpdate);
postHandler.addHandler("calendar/delete_event", deleteEvent);


function createGroupData(group) {
    groups[group] = { eventsNo: 0,
                      events : [],
                      waitingRequests: [] };
}

function calendarPostEvent(req, res, params) {
	params = JSON.parse(params);
	var username = utils.getUser(req);
	var group = utils.getViewingGroup(req);

    if(!groups[group])
        createGroupData(group);

    pg.connect(connectionString, function(err, client, done) {
		if(err) { return utils.respondError(err ,res); }
		var insertQuery = " INSERT INTO events(group_id, username, " +
						"event_start, event_end, colour, event_name)" +
						"VALUES(" + group + ", '" + username + "', '" +
						params.start_date + "', '" + params.end_date + "', '" +
						params.color + "', '" + params.text + "');" ;
		client.query(insertQuery, function(err, insertEvent) {
			if (err) { return utils.respondError(err, res); }
			done(client);
			return utils.respondPlain(res, "Event successfully updated");
		});
	});		
}

function calendarUpdate(req, res, params) {
	var group = utils.getViewingGroup(req);

	 pg.connect(connectionString, function(err, client, done) {
		if(err) { return utils.respondError(err ,response); }

		var getQuery = "SELECT * from events " +
					   " WHERE group_id =" +  group +";";
		client.query(getQuery, function(err, allEvents) {
			if (err) { return utils.respondError(err, res); }
			var events = [];
			for(var i =0; i<allEvents.rows.length; i++) {
				var event_data = {};
				event_data.start_date = allEvents.rows[i].event_start;
				event_data.end_date = allEvents.rows[i].event_end;
				event_data.color = allEvents.rows[i].colour;
				event_data.text = allEvents.rows[i].event_name;
				event_data.id = allEvents.rows[i].event_id;
				events.push(event_data);
			}
			res.writeHead(200, { "Content-Type": 'application/json' });
			res.end(JSON.stringify(events));
			done(client);
		})
	}); 
}

function deleteEvent(req, res, params) {
	var event_id = params.id;
	var deleteTodoQuery = "DELETE FROM events " +
						  "WHERE event_id=" + event_id;

	pg.connect(connectionString, function(err, client, done) {
		client.query(deleteTodoQuery, function(err, result) {
			done(client);
			if (err) { return utils.respondError(err, res); }
			return utils.respondPlain(res, "Y");			
		});
	});

}
