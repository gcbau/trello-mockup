var cardId;
var currentLabels;

//********************//
//   HTML GENERATORS
//********************//

function generateCommentHTML(comment)
{
    let userInitials = comment.firstName[0].toUpperCase()+comment.lastName[0].toUpperCase();
    return `
    <div class="activity-item">
        <div class="activity-item-profile">${userInitials}</div>
        <div class="activity-item-heading">${comment.firstName} ${comment.lastName}</div>
        <div class="activity-item-body">${comment.body.replace('\n','<br>')}</div>
    </div>
    `;
}

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
    let cindex = $(e.target).index()-1;
    let lindex = $(e.target).closest('.list').index();

    let lid = lists[lindex].id;

    // set cardId
    cardId = cards[lid][cindex].id;
    currentLabels = {};

    // get card information
    $.ajax({
        url: `/card/${cardId}`,
        method: 'get',
        success: data => {
            // add card info to html
            console.log("displayCardModal() success: ", data);

            // fill in label section
            if (data.labels[0]) {
                for (let i=0; i<data.labels.length; ++i) {
                    let label = data.labels[i];
                    currentLabels[label.name] = label.id;
                    displayLabel(label.name, $('#label-input'));
                }
            }
            console.log(currentLabels);

            // fill in new comment section
            console.log(initials);
            $('.profile-new-comment').html(initials);

            // fill in activity section
            if (data.comments) {
                for (let i=0; i<data.comments.length; ++i) {
                    let comment = data.comments[i];
                    let $comment = $(generateCommentHTML(comment));
                    $('#activity-container').append($comment);
                }
            }

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
    $('#activity-container').empty();

    // unset cardId
    cardId = null;
    currentLabels = null;

    window.location.hash = '';
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
        url: `/card/${cardId}/label/${labelId}`,
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
        url: '/label',
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
//    DESCRIPTION
//******************//

function displayDescriptionInput(e)
{
    console.log('displaying description input..');
    let $description =$(e.target);
    if ($description.hasClass('editable')) return;
    let val = $description.text();
    $description.replaceWith($(`<textarea id="description" class="editable">${val}</textarea>`));
    $('#description').focus();
}

function hideDescriptionInput(e)
{
    console.log('hiding description input..');
    let $description =$(e.target);
    let val = $description.val();
    $description.replaceWith($(`<div id="description">${val}</div>`));
}

//******************//
//   NEW COMMENT
//******************//

function createComment(e) 
{
    e.preventDefault();
    let comment = $(this).find('#comment-input').val();

    console.log(comment, "by", initials);

    $.ajax({
        url: `/card/${cardId}/comment`,
        method: 'post',
        data: {
            body: comment
        },
        success: data => {
            displayComment(data);
        },
        error: err => {
            console.error(err);
        }
    })
}

function displayComment(data) 
{
    comment = data[0][0];
    user = data[0][1]
    comment.firstName = user.firstName;
    comment.lastName  = user.lastName;
    
    let $comment = $(generateCommentHTML(comment));
    $('#activity-container').prepend($comment);
}

function checkInputLength(e) 
{
    let val = $(this).val();

    if (0 >= val.length) {
        $('#save-comment').prop('disabled', true);
    } else {
        $('#save-comment').prop('disabled', false);
    }
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

    $('#description-content').on('click', '#description',displayDescriptionInput);
    $('#description-content').on('blur', '#description.editable',hideDescriptionInput);

    $('#comment-form').on('submit', createComment);
    $('#comment-input').on('keyup', checkInputLength);

    $(window).on('hashchange', handleHashChangeEvent);
})