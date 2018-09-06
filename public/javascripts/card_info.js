var cardId;
var currentLabels;

//******************//
//   HASH CHANGE
//******************//

function handleHashChangeEvent(e) 
{
    let hash = window.location.hash;
    
    if (hash) {
        $(`${hash}.card`).click();
    } else {
        $('.modal-background').click();
    }
    
}

//******************//
//   MODAL DISPLAY
//******************//

function displayCardModal(e)
{
    if (e.target !== e.currentTarget) return;
    // get index of card and list
    let cindex = $(e.target).index();
    let lindex = $(e.target).closest('.list').index();

    let lid = lists[lindex].id;

    // set cardId
    cardId = cards[lid][cindex].id;
    currentLabels = {};
    console.log(cardId);

    // get card information
    $.ajax({
        url: `http://localhost:3000/card/${cardId}`,
        method: 'get',
        success: data => {
            // add card info to html
            console.log("displayCardModal() success: ", data.labels);

            // COME BACK TO THIS!!!!!!!!!!
            if (data.labels[0]) {
                for (let i=0; i<data.labels.length; ++i) {
                    let label = data.labels[i];
                    currentLabels[label.name] = label.id;
                    displayLabel(label.name, $('#label-input'));
                }
            }
            console.log(currentLabels);

            // display card
            $('.card-info-modal').addClass('active');
            $('body').addClass('modal-active');
        },
        error: err => {
            console.error("displayCardModal() error: ", err);
        }
    });
}

function hideCardModal(e)
{
    $('.card-info-modal').removeClass('active');
    $('body').removeClass('modal-active');
    $('.labels-container').html('<div contenteditable="true" id="label-input"></div>');

    // unset cardId
    cardId = null;
    currentLabels = null;
}

//******************//
//      LABEL
//******************//

function labelFocus(e)
{
    if (e.target !== e.currentTarget) {
        return;
    }
    $('#label-input').focus();
}

function labelRemove(e)
{
    let $label = $(e.target).closest('.label');
    let labelname = $label.find('.label-name').text();
    let labelId = currentLabels[labelname];

    $.ajax({
        url: `http://localhost:3000/card/${cardId}/label/${labelId}`,
        method: 'delete',
        success: (data) => {
            console.log("successfully deleted label: ", data);
            delete currentLabels[labelname];
            $label.remove();
            $('#label-input').focus();
        },
        error: (err) => {
            console.error(err);
        }
    });
}

function labelAutocomplete(e)
{
    let $target = $(e.target);
    let val = $target.html().trim();
    // check for enter
    if (e.key === 'Enter') {
        e.preventDefault();
        if (val === '') return;
        // record and display new label
        createLabel(val, $target);
    } 
    else if (e.key === 'Backspace') {
        if (val === '') {
            if ($target.prev().length) {
                $target.prev().find('.del-label-btn').click();
            }
        }
    }
    else {
        // console.log(val.length);
        // if (MAX_LABEL_INPUT <= val.length) {
        //     e.preventDefault();
        // }
    }
}

function createLabel(val, $target) 
{
    if (val in currentLabels) {
        return;
    }
    $.ajax({
        url: 'http://localhost:3000/label',
        method: 'post',
        data: {
            name: val,
            cardId: cardId
        },
        success: (data) => {
            console.log(data);
            displayLabel(val, $target);
        },
        error: (err) => {
            console.log(err);
        }
    });
}

function displayLabel(val, $target) 
{
    let $labelBlock =  $(`<div class="label"><span class="label-name">${val}</span> <i class="fas fa-times del-label-btn"></i></div>`);
    $labelBlock.insertBefore($target);
    $target.empty();
}

//******************//
//      MAIN
//******************//

$(function() 
{
    // show & hide modal
    $('body').on('click', '.card', displayCardModal);
    $('body').on('click', '.modal-background', hideCardModal);
    $('body').on('click', '#close-modal-info-btn', hideCardModal);

    $('body').on('keydown', '#label-input',labelAutocomplete);
    $('.labels-container').on('click', labelFocus);
    $('.labels-container').on('click', '.del-label-btn', labelRemove);

    $(window).on('hashchange', handleHashChangeEvent);
})