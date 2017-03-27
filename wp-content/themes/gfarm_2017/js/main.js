// @codekit-prepend "vendor/jquery-2.2.2.js"

$(document).ready(function () {


    $("body > header").on("click", "#burger", function (event) {
        event.preventDefault();
        $("body > header ul").toggleClass("show");
        $("body > header #burger").toggleClass("open");
    });


});


