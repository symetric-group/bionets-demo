/** 
 * Controler code for the SyMeTRIC Data API web application
 *
 * author : alban.gaignard@cnrs.fr
 */

// The root URL for the RESTful services
var rootURL = "http://" + window.location.host;
console.log("Connecting to the SyMeTRIC Data API " + rootURL);

////////////////////////////////////////////
// Web app views
////////////////////////////////////////////

var WelcomeView = Backbone.View.extend({
    el: "#mainContainer", //Container div inside which we would be dynamically loading the templates
    initialize: function () {
        _.bindAll(this, "render");
        console.log('Welcome View Initialized');
    },
    render: function () {
        var that = this;
        //Fetching the template contents
        $.get('templates/home.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
        }, 'html');
        return this;
    }
});

var myWelcomeView = new WelcomeView();


$(document).ready(function () {
    $('#demo-sb-menu').click(function () {
        if (! $("#demo-sb-menu").hasClass("disabled")) {
            myDemoSysbioView.render();
        }
    });
    myWelcomeView.render(); 

});

function alertTimeout(wait) {
    setTimeout(function () {
        $('#footer').children('.alert:last-child').remove();
    }, wait);
}

function infoSuccess(message) {
    console.log("INFO" + message);
    Materialize.toast(message, 2000);
}

function infoWarning(message) {
    console.log("WARN" + message);
    Materialize.toast("<i class=\"material-icons\">warning</i> " + message, 2000);
}

function infoError(message) {
    console.log("ERROR " + message);
    Materialize.toast("<i class=\"material-icons\">error_outline</i> " + message, 2000);
}

