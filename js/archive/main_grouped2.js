console.log('js Loaded');

/*
ORDER OF OPERATIONS:
    
*/

//Initialize Firebase
var firebaseConfig = {
    apiKey: "AIzaSyBdBvm5AKa6fI004M_9jf2n5nyVAHvVdZQ",
    authDomain: "nyc-boogie-woogie.firebaseapp.com",
    databaseURL: "https://nyc-boogie-woogie-default-rtdb.firebaseio.com",
    projectId: "nyc-boogie-woogie",
    storageBucket: "nyc-boogie-woogie.appspot.com",
    messagingSenderId: "973992429447",
    appId: "1:973992429447:web:e4cb07cebb830676d43522"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.database();
var locRef = db.ref("images");

var chartArea = document.getElementById("chartArea");

// load the buildings dataset
var buildingsData = []
d3.csv("data/buildingBlock.csv", function (data1) {
    data1.x = parseInt(data1.x);
    data1.y = parseInt(data1.y);
    data1.forEach(function (element) {
        buildingsData.push(element);
    })
});


//request data from API    
function fetchdata() {

    $.ajax({
        url: encodeURI("https://data.cityofnewyork.us/resource/i4gi-tjb9.json?$order=data_as_of DESC&borough=Manhattan"),
        // url: "https://data.cityofnewyork.us/resource/i4gi-tjb9.json?",
        type: "GET",
        data: {
            "$limit": 1024,
            "$$app_token": "ReXNLc0gRAMKhmOChFYGqCdlk"
        },
        beforeSend: function () {
            // Show image container
            // $("#loaderGif").css("display:block !important");
        },
        //automated requests every half hour
        complete: function (data) {
            data = data.responseJSON
            alert("Retrieved " + data.responseJSON.length + " records from the dataset!");
            
            console.log(data);
            //setTimeout(fetchdata, 1800000);
            var chartArea = document.getElementById("chartArea");
            // return data, chartArea;
            
            drawSVG(data, chartArea, 0.70),

            function writedata(data) {
            var t = new Date();
            var timeid = t.getTime();
            var timeStamp = t.toISOString().replace(/:/g, "-").replace(".", "-");
            var filename = "img-" + timeid;
            //how to take the svg/xml structure and simply write it to firebase?
            //var dataSVG = (new XMLSerializer()).serializeToString(document.getElementById("chartArea").getElementsByTagName("svg").item(0));

            console.log(timeid, timeStamp, filename, data);

            db.ref('images/' + filename).set({
                id: filename,
                dataSVG: "dataSVG",
                dataJSON: data,
                time: timeStamp
                });
            }          
        },   
    });
}

function updateTime() {
    var d = new Date();
    hrT = d.getHours();
    minT = d.getMinutes();
    secT = d.getSeconds();
    milT = d.getTime();
    $('#clock').text(d);
}

setInterval(updateTime, 1000) 

function drawSVG(data, container, scaleFactor){
            // console.log(data);
            //display retrieved data sample in the browser
            $("#date").text("Last updated day: " + data[0]["data_as_of"].substring(0, 10));
            $("#time").text("Last updated time: " + data[0]["data_as_of"].substring(11, 16));
            // $("#speed").text("Speed of first...Make Avg TBD: " + data[0]['speed']);

            //d3 ____________________________________________________________________


            //clear canvas for new data load...
            d3.select(container).selectAll('*').remove();
    
            var widthAttribute = scaleFactor*100;
            var heightAttribute = scaleFactor*100;
            console.log(widthAttribute.toString()+"vh", heightAttribute.toString()+"vh");
            //create Boogie Woogie canvas
            const svg = d3.select(container).append("svg")
                //canvas height and width
                .attr("id", container)
                // .attr('viewBox', '0 0 50 100');
                .attr("width", widthAttribute.toString()+"vh")
                .attr("height", heightAttribute.toString()+"vh")
                .attr("style", "outline: thin solid #adadad")
                .attr("style", "display: block");
            //.attr("viewBox", "0, 0, auto, auto");

            //
            vH_unscaled = $(window).innerHeight();
            vH = (scaleFactor) * vH_unscaled
            vW_unscaled = $(window).innerWidth();
            vW = (scaleFactor) * vW_unscaled
            redraw(vH, vW)

            //set rectangle sizes
            rectHeight = vH / 32;
            rectWidth = vH / 32;

            //detect if window height changes
            $(window).on('resize', function () {
                vH_unscaled = $(this).innerHeight();
                vW_unscaled = $(this).innerWidth();
                vH = scaleFactor * vH_unscaled
                vW = scaleFactor * vW_unscaled
                console.log("resize");
                redraw(vH, vW);
            })

            //resize canvas if window height changes
            function redraw(viewportHeight, viewportWidth) {
                svg.selectAll("*").remove();
                vH = viewportHeight;
                vW = viewportWidth;
                rectSize = Math.min(vH, vW) / 32;
                //rectHeight = vH / 32;
                //rectWidth = rectHeight;
                //change rectangle size based on new canvas size
                console.log("rectSize is now" + rectSize);
                console.log("vHeight is now" + vH);

                //tooltip
                const tip = d3.tip()
                    .attr('class', 'd3-tip')
                    .html(d => d)
                    .html(d => {
                        text = "<span>Speed: </span>" + d['speed'] + "<span> mph</span>"
                        return text;
                    })
                svg.call(tip);

                // https://stackoverflow.com/questions/17817849/d3-js-how-to-join-data-from-more-sources
                //streets
                
                streets = svg.append("g")
                        .attr("class", "streets");

                streets.selectAll("rect")
                    .data(data)
                    .enter().append("rect")
                    .attr("class", "streets")
                    .attr("x", (d, i) => vH / 32 * (i % 32)) //arrays columns of rectangles (x-axis)
                    .attr("y", (d, i) => vH / 32 * Math.floor(i / 32)) // array rows of rectangles (y-axis)
                    .attr("height", vH / 32) // assigns height of rectangles to predefined height
                    .attr("width", vH / 32) // assigns width of rectangles to predefined width
                    .attr("stroke", "#06112b") //creates a stroke around the rectangle
                    //color based on speed
                    .attr("fill", function (d) {
                        if (d['speed'] > 20) {
                            // blue
                            return "#518cd0";
                        } else if (d['speed'] > 10) {
                            // yellow
                            return "#eceb66";
                        }
                        // red
                        return "#ff6661";
                    })
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide)

              
                        // https://stackoverflow.com/questions/18151455/d3-js-create-objects-on-top-of-each-other/18461464
                        
                        
    
                        buildings = svg.append("g")
                            .attr("class", "buildings");
    
                        buildings.selectAll("rect")
                            .data(buildingsData)
                            .enter().append("rect")
                            //create a group for buildings
                            .attr("class", "buildings")
                            .attr("x", function (d) {
                                return d.x / 32 * vH;
                            })
                            .attr("y", function (d) {
                                return d.y / 32 * vH;
                            })
                            .attr("height", vH / 32) // assigns height to predefined height
                            .attr("width", vH / 32) // assigns width to predefined width
                            .attr("stroke", "#06112b")
                            .attr("fill", "#06112b")
                


            }
}

//https://makitweb.com/how-to-fire-ajax-request-on-regular-interval/#:~:text=Use%20setInterval()%20when%20you,use%20the%20setTimeout()%20function.
//automate
//use express on ready if using node.js

$(document).ready(function(){
    console.log("document ready!");
    //before starting the fetchdata function, need to immediately read from archive and put the previous-requested svg on the canvas
    //".once" method fires once at the beginning
    locRef.once("value", function (snapshot) {
        $("#loaderGif").show();

        document.getElementById("mondrian").style.display = "none";
        var chartArea = document.getElementById("chartArea");
        var dataOnce = snapshot.val();
        //the JSONData variable is the JSON format of the last request. Can use that to draw a canvas while you wait for the next request to come in.
        var dataJSONLast = Object.values(dataOnce)[Object.keys(dataOnce).length - 1].dataJSON;
        // checking time since last request and proceeding or not proceeding with a new request if it's been more than 30 miutes:
        var timeLast = parseInt(Object.keys(dataOnce)[Object.keys(dataOnce).length-1].substr(4));
        var timeNow = new Date().getTime();
        var timeDiff = Math.abs(timeNow - timeLast);
        if (timeDiff < 1800000) {
            //time difference is less than 30 min, do nothing but set timer for remainder of time before running fetchdata function
            console.log("No new request made since " + timeDiff + "milliseconds / " + timeDiff / 60000 + "mins since last request");
            setTimeout(fetchdata, timeDiff);
        } else {
            //time difference is greater than 30 min, run fetchdata function
            console.log("Request made since " + timeDiff + "milliseconds / " + timeDiff / 60000 + "mins since last request");
            fetchdata();
        }

        //draw the most recent chart..This should also grab the buildings data (but something needs to change for that to happen, apparently..).
        drawSVG(dataJSONLast, chartArea, 0.70);
        $("#loaderGif").hide();

        //to populate the archive images, iterate over each past data entry
        Object.keys(dataOnce).forEach(function(key) {   
            var archiveElement = document.createElement("div");
            archiveElement.id = dataOnce[key].id;
            archiveElement.className = "archive"; 
            //archiveTitle contains the title text of the svg:
            var titleElement = document.createElement("p");
            var archiveTitle = document.createTextNode(dataOnce[key].time+":");
            titleElement.appendChild(archiveTitle);
            //archiveCanvas contains the svg:
            var archiveCanvas = document.createElement("div");
            archiveCanvas.id = dataOnce[key].time;
            var dataJSON = dataOnce[key].dataJSON;
            drawSVG(dataJSON, archiveCanvas, .25);
            //push both svg and title into the archiveElement, then push that into the Archived Canvases container:
            archiveElement.appendChild(titleElement);
            archiveElement.appendChild(archiveCanvas);
            document.getElementById("archive").appendChild(archiveElement);   
        });
        return dataOnce;
    })
});