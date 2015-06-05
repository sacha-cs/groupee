function loaded() {
    var aClient = new HttpClient();
    aClient.get('get_photos', function(response) {
        var photos = JSON.parse(response);
    });
}
