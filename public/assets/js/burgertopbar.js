$(document).ready(function() {

    $('#burger_topbar').click((event) => {
            
        if($('#burger_topbar').hasClass('activeburger')){
            $('#burger_topbar').removeClass('activeburger');

    } else {
                    $('#burger_topbar').addClass('activeburger');
    }
    });
    
    
}); 