function hashy(str) {
    var url = str;
    var hexval = '';

    for(var i = 0; i < url.length; i++) {
        if(url[i] !== '%') {
            var code = url.charCodeAt(i);
            var hex = code.toString(16);
            hexval += hex;
        } else {
            hexval += url[i+1] + url[i+2];
            i += 2;
        }
    }
    return hexval;
}
function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
}

function start_server() {
    //Lets require/import the HTTP module
    var http = require('http');

//Lets define a port we want to listen to
    const PORT = jQuery('#port').val();

    //console.log(PORT);

//We need a function which handles requests and send response
    function handleRequest(proxy_request, proxy_response) {
        var tracker_request = require('request');

        var event = proxy_request.url.match(/event=([a-z]+)/);


        var info_hash = proxy_request.url.match(/info_hash=([0-9a-zA-Z%]+)/);
        //console.log(proxy_request.url);
        info_hash = hashy(info_hash[1]);
        if (!_UPLOADED[info_hash]) {
            _UPLOADED[info_hash] = 0;
        }


        if (event&&event[1]=='started') { // reset uploaded on start event
            _UPLOADED[info_hash] = 0;
        }

        if ((event&&event[1]!='started')||!event) {
            var upload_multiplier = jQuery('#upload_speed').val();
            //var download_multiplier = jQuery('#download_speed').val();

            var uploaded = proxy_request.url.match(/uploaded=([0-9]+)/);
            //console.log('REQUEST', proxy_request.url);

            if (uploaded) {

                var new_uploaded = Math.round(uploaded[1] * upload_multiplier);
                if (new_uploaded == 0) {
                    new_uploaded = _UPLOADED[info_hash] + randomIntFromInterval(parseFloat(jQuery('#rand_start').val()) * 1024 * 1024, parseFloat(jQuery('#rand_end').val()) * 1024 * 1024);
                }
                _UPLOADED[info_hash] = new_uploaded;


                proxy_request.url = proxy_request.url.replace(uploaded[0], "uploaded=" + new_uploaded);

                //console.log('PROXY', proxy_request.url);

                _CHEATED = _CHEATED + (new_uploaded - parseInt(uploaded[1]));

                jQuery('#cheated').text(humanFileSize(_CHEATED, true));
            }
        }
        /*var downloaded = proxy_request.url.match(/downloaded=([0-9]+)/);
        if (downloaded) {
            proxy_request.url.replace(downloaded[0],"downloaded="+Math.round(downloaded[1]*download_multiplier));
        }
        var left = proxy_request.url.match(/left=([0-9]+)/);
        if (left) {
            left = left[1];
        }*/
        //console.log(proxy_request.url);
        /*console.log(proxy_request.headers);*/
        delete proxy_request.headers['host'];

        var options = {
            url: proxy_request.url,
            headers: proxy_request.headers
        };

        tracker_request(options).pipe(proxy_response);
    }

//Create a server
    server = http.createServer(handleRequest);

//Lets start our server
    server.listen(PORT, function () {
        //Callback triggered when server is successfully listening. Hurray!
        jQuery('#status').text("Listening on localhost:" + PORT);
        jQuery('#start').attr('disabled', true);
        jQuery('#stop').attr('disabled', false);
        console.log("Server listening on: http://localhost:%s", PORT);
    });
}


function stop_server() {
    jQuery('#status').text("Stopped");
    jQuery('#start').attr('disabled', false);
    jQuery('#stop').attr('disabled', true);
    server.close();
}

var _CHEATED=0;
var _UPLOADED = {};
var _APP_PARAMS = JSON.parse(window.location.hash.replace('#',''));

jQuery(document).ready(function () {

    jQuery('#version').text(_APP_PARAMS.version);
    //console.log(_APP_NAME);


    const shell = require('electron').shell;

    jQuery(document).on('click', 'a[href^="http"]', function(event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });

    start_server();

    jQuery('#start').on('click', function () {
        start_server();
    });
    jQuery('#stop').on('click', function () {
        stop_server();
    });

    var AutoLaunch = require('auto-launch');

    var appLauncher = new AutoLaunch({
        name: 'GreedyTorrentUniversal'
    });

    appLauncher.isEnabled(function(enabled){
        if(enabled) {
            jQuery('#auto_launch').attr('checked',true);
        } else {
            jQuery('#auto_launch').attr('checked',false);
        }

    });

    jQuery('#auto_launch').on('click',function(){
       if (jQuery(this).is(':checked')) {

           appLauncher.enable(function(err){
               if (err) {
                   alert('Unable to register auto launch ' + err);
               }
           });
       } else {
           appLauncher.disable(function(err){
               if (err) {
                   alert('Unable to unregister auto launch ' + err);
               }
           });
       }
    });
});