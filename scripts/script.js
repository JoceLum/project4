var showApp = {};
showApp.key = "bd9f6a5c409c05ff7938f1d2d7cae63e";

showApp.getShows = function(show) {
    //first ajax call to retrieve TV show that's submitted by user from the api's database
    $.ajax({
        url: `https://api.themoviedb.org/3/search/tv?api_key=${showApp.key}&query=${show}`,
        method: 'GET',
        dataType: 'json',
        data: {
            key: showApp.key,
            format: 'json'
        }
    }).then(function(res) {
        //second ajax call to retrieve all shows that share the same genre as the show submitted by user
        return $.ajax({
            url: `https://api.themoviedb.org/3/discover/tv?with_genres=${res.results[0].genre_ids[0]}&api_key=${showApp.key}`,
            method: 'GET',
            dataType: 'json',
            data: {
                key: showApp.key,
                format: 'json'
            }
        });
    }).then(function(res) {
            //res will be the list of shows that have same genre of the TV show that's submitted by the user
            var results = res.results;
            showApp.displayShows(results);
    });
}

showApp.displayShows = function(showData) {
    //to empty show container when user doing a search on another show without refreshing page:
    $('#shows').empty();
    showData.forEach(function(show) {
        if (show.poster_path !== null) {
            //name of the show
            let titles = $('<h3>').text(show.name);
            //image path for the show's poster
            let imageUrl = `https://image.tmdb.org/t/p/w300_and_h450_bestv2/${show.poster_path}`;
            //bind image path and show ID to image tag of show poster
            let poster = $('<img>').attr('src', imageUrl).attr('dataId', show.id).addClass('lazy');
            //create containers to store poster and title content 
            let showContainer = $('<div>').addClass('show').append(poster, titles);
            //append containers to section with id of shows
            $('#shows').append(showContainer);
        }
    })
};

showApp.events = function() {
    //for user to submit the show that they just finished watching
    $('form').on('submit', function(e) {
        e.preventDefault();
        //store the value of the selected element
        //store input if there is something, and scroll to results section; otherwise, let user know that they need to submit something
        let usersChoice = $('#show').val();
        if (usersChoice !== "") {
                showApp.getShows(usersChoice);
                $('html, body').animate({
                    scrollTop: $("#shows").offset().top
                }, 1000);
                this.reset();
            // } else {
            //     alert("hmm, that one's a bit too obscure..");
            // }
        } else {
            $(this).find('#warning').text("Come on, we won't judge...");
        }
    });

    //when user clicks on TV show poster, will bring up modal with trailer for show
    $('#shows').on('click', '.show img', function() {
        //store TV show id in a variable to be passed into ajax call 
        var singleUrl = $(this).attr("dataId");
        // console.log(singleUrl);
        $.ajax({
            url: `https://api.themoviedb.org/3/tv/${singleUrl}/videos?api_key=${showApp.key}`,
            method: 'GET',
            dataType: 'json',
            data: {
                key: showApp.key,
                format: 'json'
            }
        }).then(function(res) {
            //after ajax call is complete, store value of the key in a variable called videos
            var videos = res.results;
            //only return videos with the type "Trailer or Opening Credits, otherwise display error that there are no videos
            var videoKey;
            //to narrow down to shows that have videos 
            if (videos.length !== 0) {
                //first, narrow down to shows that have trailers
                var trailers = videos.filter(function(video) {
                    return video.type === "Trailer";
                });
                //if there are no trailers, store first video of remaining video types (opening credits, featurettes, etc.)
                if (trailers.length === 0) {
                    videoKey = videos[0].key;
                } else {
                    //if there are trailers, store its corresponding key    
                    videoKey = trailers[0].key;
                }
            }
            //if the show has no videos at all
            else {
                return swal({
                    title: "Sorry!",
                    text: "We don't have any videos for this show",
                    imageUrl: "assets/broken_tv.png"
                });
            }
            //append the stored key from above to the Youtube URL and pass into lity function to open video in lightbox
            lity(`//www.youtube.com/watch?v=${videoKey}`)
        });
    });
}
//init function that initializes our code
showApp.init = function() {
    showApp.events();
};
//document ready that will run the init function
$(function() {
    showApp.init();
});