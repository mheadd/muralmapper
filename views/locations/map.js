function(doc) {
    if(doc.geo) {
        emit(doc._id, {id: doc._id, lat: doc.geo.coordinates[0], lon: doc.geo.coordinates[1], text: doc.text, tweet_image: doc.tweet_image, thumbnail: doc.user.profile_image_url, name: doc.user.screen_name});
    }
}
