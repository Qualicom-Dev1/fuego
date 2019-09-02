$(document).ready(function () {

    $('.btn_modifier_client').click((event) => {

        var element = document.getElementById("icon_modif");
        element.classList.remove("fa-pen");
        element.classList.add("fa-check");

    });


});
