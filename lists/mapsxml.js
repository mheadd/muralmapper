function(head, req) { 
  var markers = '<markers>'; 
  while (row = getRow()) { 
    var twtimg = (row.value.tweet_image) ?  row.value.tweet_image : '';
    markers += '<marker lat=\"' + row.value.lat + '\" lon=\"' + row.value.lon + '\" text=\"' + row.value.text + '\" imagepath=\"'+twtimg+'\" thumbnail=\"' + row.value.thumbnail + '\" name=\"' + row.value.name + '\"/>';
  }
  markers += '</markers>'; 
  send(markers);
}
