let showApp = {};
showApp.key = "bd9f6a5c409c05ff7938f1d2d7cae63e";
showApp.pageCount = 1;
showApp.shows = {};

showApp.getShows = (show) => {
    $('#warning').empty();
    //first ajax call to retrieve TV show that's submitted by user from the api's database
    $.ajax({
        url: 'https://api.themoviedb.org/3/search/tv',
        method: 'GET',
        dataType: 'json',
        data: {
            api_key: showApp.key,
            query: show,
            format: 'json'
        }
    }).then((res) => {
        if (res.results !== null && res.results.length > 0) {
            showApp.genreId = res.results[0].genre_ids[0];
            return showApp.getShowsByGenre(showApp.genreId);
        } else {
            //show error message if user's input doesn't match any show in the api's database
            $('#warning').text("Hmm, that show's a bit too obscure...");
        }
    });
}


//second ajax call to retrieve all shows that share the same genre as the show submitted by user
showApp.getShowsByGenre = (genreId) => {
    $.ajax({
        url: `https://api.themoviedb.org/3/discover/tv`,
        method: 'GET',
        dataType: 'json',
        data: {
            api_key: showApp.key,
            page: showApp.pageCount,
            with_genres: genreId,
            format: 'json'
        }
    }).then((res) => {
        //res will be the list of shows that have same genre of the TV show that's submitted by the user
        let results = res.results;
        results.forEach((result) => {
            // console.log(result.id);
            // console.log(result);
            showApp.shows[result.id] = result;
        });
        showApp.displayShows(results);
    });
}

showApp.displayShows = (showData) => {
    $('#playMsg').text('Tap on the posters to view videos');

    showData.forEach((show) => {
        if (show.poster_path !== null) {
            //name of the show
            let titles = $('<h3>').text(show.name);
            //more details button
            let moreDetails = $('<a>').addClass('moreDetails').text('More Details');
            //image path for the show's poster
            let imageUrl = `https://image.tmdb.org/t/p/w300_and_h450_bestv2/${show.poster_path}`;
            //bind image path and show ID to image tag of show poster
            let poster = $('<img>').attr('src', imageUrl).addClass('poster');
            let playIcon = $('<img>').attr('src', 'assets/play_button.png').addClass('playButton');
            // create containers to store poster and title content 
            let showContainer = $('<div>').addClass('show').attr('dataId', show.id).append(poster, playIcon, titles, moreDetails);
            //append containers to section with id of shows
            $('#shows').append(showContainer);
            // console.log(show);
            //show load more & new search buttons below results
            $('#loadMore').css('display', 'block');
            $('#restart').css('display', 'block');
        }
    });
};

showApp.events = () => {
    //for user to submit the show that they just finished watching
    $('form').on('submit', function(e) {
        e.preventDefault();
        $('#shows').empty();
        //store the value of the selected element
        //store input if there is something, and scroll to results section; otherwise, let user know that they need to submit something
        let usersInput = $('#show').val();
        if (usersInput !== "") {
            showApp.getShows(usersInput);
            $('html, body').animate({
                scrollTop: $("#shows").offset().top
            }, 1000);
            this.reset();
        } else {
            $(this).find('#warning').text("Come on, we won't judge...");
        }
    });

    //when click "More Details" button, display more info about each show
    $('#shows').on('click', '.moreDetails', function() {
        let showId = $(this).parent().attr('dataid');
        let showName = showApp.shows[showId].name;
        let showOverview = showApp.shows[showId].overview;
        let showAirDate = showApp.shows[showId].first_air_date;
        let showVoteAvg = showApp.shows[showId].vote_average;
        let showVoteCount = showApp.shows[showId].vote_count;
        swal({
            title: `<h3 class="showName">${showName}</h3>`,
            html: `<ul class="showInfo"><li><span>Overview: </span>${showOverview}</li><li><span>First Air Date: </span>${showAirDate}</li><li><span>Vote Average: </span>${showVoteAvg}</li><li><span>Vote Count: </span>${showVoteCount}</li></ul>`,
            background: '#6FD2F2',
            width: 800 

        })
    });

    //show play button upon hovering over show poster
    $('#shows').on('mouseenter', '.poster', function() {
        let posterWrapper = $(this).parent();
        posterWrapper.find('.playButton').show();
    }).on('mouseleave', '.poster', function() {
        let posterWrapper = $(this).parent();
        posterWrapper.find('.playButton').hide();
    });

    //when user clicks on TV show poster, will open up lightbox with trailer for show
    $('#shows').on('click', '.show img.playButton', function() {
        //store TV show id in a variable to be passed into ajax call 

        let singleUrl = $(this).parent().attr("dataId");
        
        $.ajax({
            url: `https://api.themoviedb.org/3/tv/${singleUrl}/videos`,
            method: 'GET',
            dataType: 'json',
            data: {
                api_key: showApp.key,
                format: 'json'
            }
        }).then((res) => {
            //after ajax call is complete, store value of the key in a variable called videos
            let videos = res.results;
            //first, return videos with the type "Trailer; if there are no trailers, play other videos; if no videos, display error that there are no videos
            let videoKey;
            //to narrow down to shows that have videos 
            if (videos.length !== 0) {
                //first, narrow down to shows that have trailers
                let trailers = videos.filter(function(video) {
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
                    imageUrl: "assets/broken_tv.png",
                    imageWidth: 240,
                    imageHeight: 200,
                    imageAlt: 'Broken TV'
                });
            }
            //append the stored key from above to the Youtube URL and pass into lity function to open video in lightbox
            lity(`//www.youtube.com/watch?v=${videoKey}`)
        });
    });
    //to load more results
    $('#loadMore').on('click', (e) => {
        e.preventDefault();
        showApp.pageCount++;
        showApp.getShowsByGenre(showApp.genreId);
    });

    //if want to do another search, go back to top of page and refresh  
    $('#restart').on('click', (e) => {
        e.preventDefault();
        $("html, body").animate({ scrollTop: 0 }, "slow");
        location.reload();
    })
}
//init function that initializes our code
showApp.init = () => {
    showApp.events();
};
//document ready that will run the init function
$(() => {
    showApp.init();
});