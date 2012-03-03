function(head, req) {
    var row, out, sep = '\n';

    // Send the same Content-Type as CouchDB would
    if (typeof(req.headers.Accept) != "undefined" && req.headers.Accept.indexOf('application/json')!=-1)
      start({"headers":{"Content-Type" : "application/json"}});
    else
      start({"headers":{"Content-Type" : "text/plain"}});

    if ('callback' in req.query) send(req.query['callback'] + "(");

    send('{"type": "FeatureCollection", "features":[');
    while (row = getRow()) {
        //if(row.value.coordinates) {
            //console.log(row.value.coordinates)
            out = '{"type": "Feature", "id": ' + JSON.stringify(row.id);
            out += ', "geometry": { "type":"Point", "coordinates": [' + row.value.lon +','+row.value.lat+'] }';
            delete row.value.lon;
            delete row.value.lat;
            out += ', "properties": ' + JSON.stringify(row.value) + '}';

            send(sep + out);
            sep = ',\n';
        //}
    }
    send("]}");
    if ('callback' in req.query) send(")");
    
};
