function(head, req) { 
  var markers = '<markers>'; 
  while (row = getRow()) { 
    markers += '<marker lat=\"' + row.value.lat + '\" lon=\"' + row.value.lon + '\" text=\"' + row.value.text + '\" thumbnail=\"' + row.value.thumbnail + '\" name=\"' + row.value.name + '\"/>';
  }
  markers += '</markers>'; 
  send(markers);
}
