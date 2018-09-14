/*******************************************************************
    All functionalities that involves around index.html
 *******************************************************************/

//******************//
//  HELPER METHODS  
//******************//

function generateBoardIcon(teamId, boardId, title) 
{
    return  '<div id="'+ boardId +'"class="board-icon">' + 
                '<a href="/b/'+boardId+'/'+title.replace(/ /g,'-')+'">' + title + '</a>' +
            '</div>';
}

function generateTeamRow(teamId, title) 
{
    return  `
        <div id=${teamId} class="team">
            <div class="team-heading">
                <i class="fas fa-users"></i>
                <span class="team-name">${title}</span>
                <div class="add-member">+ Add Member</div>
            </div>
            <div class="team-content">
                <button class="board-icon create-new-board-btn">Create New Board</button>
            </div>
        </div>
    `;
}

//******************//
//  SETUP METHODS
//******************//

function setup() 
{   
    userId = localStorage.getItem('userId');
    username = localStorage.getItem('username');
    let url = `/all/${userId}`;
    console.log(url, userId);

    $.ajax({
        url: url,
        method: 'GET'
    })
    .done( data => {
        console.log(data);
    })
    .fail( err => {
        console.error(err);
    });
}

//******************//
//  BOARD METHODS 
//******************//

function showBoardModal(e) 
{   /* Show board creation modal */
    let $modal = $('.board-creation-modal');
    $modal.addClass('active');
    $modal.data('target', $(e.target));
}

function hideBoardModal() 
{   /* Hide board creation modal */
    let $modal = $('.board-creation-modal');
    $modal.removeClass('active');
    $modal.removeData('target');
}

function createNewBoard(e) 
{   /* Create new board */
    let $btn = $(e.target);
    let $textInput = $btn.siblings().find('#board-title');
    let title = $textInput.val().trim();
    
    if (title === '') return;
    
    let $target = $('.board-creation-modal').data('target');
    // let teamIndex = $target.parent().parent().index()-1;
    // let teamId = teams[teamIndex]['tid'];
    let teamId = $target.parent().parent().attr('id');
    let data = {
        name:    title,
        ownerId: userId
    };

    if (teamId !== 'personal') {
        data['teamId'] = teamId;
    }

    $.ajax({
        url: `/${username}/boards/board`,
        method: 'POST',
        data: data
    })
    .done(function(data) {
        console.log(data);
        displayBoard(teamId, data.id, data.name, $target);
    })
    .fail(function(err) {
        console.error(err);
    });
}

function displayBoard(tid, bid, bname, $target) 
{   /* display board in html */
    let $board = $(generateBoardIcon(tid, bid, bname));
    $board.insertBefore($target);

    window.location.href = $board.find('a').attr('href');
}

//******************//
//  TEAM METHODS 
//******************//

function showTeamForm(e) 
{   /** show new team form */
    let offset  = $(e.target).offset();
    let $form = $('.team-creation-container');
    console.log($form);
    
    $form.css('left', offset.left+'px');
    $form.css('top', (offset.top-264)+'px');
    // if (screen.height < offset.top+300) {
    //     $form.css('top', (offset.top-264)+'px');
    // } else {
    //     $form.css('top', offset.top+'px');
    // }

    $form.addClass('active');
    $('#team-title-input').focus();
}

function hideTeamForm() 
{   /** hide new team form */
    let $form = $('.team-creation-container');
    $form.removeClass('active');
    $('#new-team-form').trigger('reset');
}

function createNewTeam(e)
{   /* create new team */
    e.preventDefault();
    let $btn = $(e.target);
    let title = $btn.siblings('#team-title-input').val().trim();
    let description = $btn.siblings('#team-description-input').val().trim();

    if ('' === title) return;

    $.ajax({
        url: `/${username}/boards/team`,
        method: 'POST',
        data: {
            name: title,
            ownerId: userId,
            description: description
        }
    })
    .done( data => {
        displayNewTeam(data.id, data.name, $('#create-new-team-btn'));
    })
    .fail( err => {
        console.err(err);
    });
}

function displayNewTeam(teamId, title, $target)
{
    let stringHTML = generateTeamRow(teamId, title);
    $('#personal').after(stringHTML);
    hideTeamForm();
}

//******************//
//    ADD MEMBER  
//******************//

function displayMemberSearch(e)
{
    if (e.target !== e.currentTarget) return;

    let form = `   
        <form id="member-form">
            <input id="member-name-input" type="text"/>
            <input id="member-form-submit" type="submit" value="search"/>
        </form>`;

    let $btn = $(e.target);
    $btn.append($(form));
    $('#member-name-input').trigger('focus');
}

function searchMembers(e)
{
    e.preventDefault();
    let userInput = $('#member-name-input').val().trim();

    $.ajax({
        url: `/user?name=${userInput}`,
        method: 'get',
        success: data => {
            displayMemberOptions(data);
        },
        error: err => {
            console.error(err);
        }
    });
}

function displayMemberOptions(users) 
{
    let $results = $('<ul id="member-options"></ul>');

    for (let i=0; i<users.length; ++i) {
        $results.append(`<li class="member-option" data-id=${users[i].id}>${users[i].name}</li>`)
    }

    $('#member-options').remove();
    $('#member-form').append($results);
} 

function hideMemberForm()
{
    $('#member-form').remove();
}

function sendInvitation(e) 
{
    let $target = $(e.target);
    let receiverId = $target.data('id');
    let senderId = userId;
    let teamId = $target.closest('.team').attr('id');

    $.ajax({
        url: '/invite',
        method: 'post',
        data: {
            receiverId: receiverId,
            senderId: senderId,
            teamId: teamId
        },
        success: (res) => {
            console.log(res);
        },
        error: (err) => {
            console.error(err);
        }
    });
}

//******************//
//  BLUR HANDLING
//******************//

function handleCustomBlur(e)
{
    clicked = e.target;
    let $active = $(document.activeElement);

    // check when adding a new member
    let $target = $('#member-name-input');
    if($target[0] && $target.is($active)) {
        if ($(clicked).closest('#member-form')[0])
        {
            setTimeout(() => {
                $target.focus();
            }, 0)
            return;
        }

        hideMemberForm();
    }

    $target = $('#team-title-input');
    if($target[0] && $target.is($active)) {
        if ($(clicked).attr('id') === 'team-description-input') return;

        if ($(clicked).closest('.team-creation-container')[0])
        {
            setTimeout(() => {
                $target.focus();
            }, 0)
            return;
        }

        hideTeamForm();
    }

    $target = $('#team-description-input');
    if($target[0] && $target.is($active)) {
        if ($(clicked).attr('id') === 'team-title-input') return;

        if ($(clicked).closest('.team-creation-container')[0])
        {
            setTimeout(() => {
                $target.focus();
            }, 0)
            return;
        }

        hideTeamForm();
    }
}

//******************//
//  MAIN FUNCTION 
//******************//

var username;
var $body;
var $content;
var clicked;

$(function() {
    // setup
    setup(); 
    // loadTeams();

    $body = $('body');
    $content = $('#board-content');

    // event handlers
    $(document).on('mousedown', handleCustomBlur);

    $body.on('click', '.create-new-board-btn', showBoardModal);
    $body.on('click', '.modal-background', hideBoardModal);
    $body.on('click', '#create-board-btn', createNewBoard);
    $body.on('click', '#modal-close-btn', hideBoardModal);

    $body.on('click', '#create-new-team-btn', showTeamForm);
    $body.on('click', '#form-close-btn', hideTeamForm);
    $body.on('click', '#create-team-btn', createNewTeam);

    $body.on('click', '.add-member', displayMemberSearch);
    $body.on('submit', '#member-form', searchMembers);
    $body.on('click', '.member-option', sendInvitation);
});