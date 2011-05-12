function(doc) {
  if(doc.geo) {
   if(doc.text.search('http://') != -1) {
    emit(doc._id, {lat: doc.geo.coordinates[0], lon: doc.geo.coordinates[1], text: doc.text, thumbnail: doc.user.profile_image_url, name: doc.user.screen_name});
   }
  }
}
