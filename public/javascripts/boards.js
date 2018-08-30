/*******************************************************************
    All functionalities that involves around index.html
 *******************************************************************/

var userId;
var username;
var teams;
var $body;
var $content;

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
    return  '<div id="'+teamId+'" class="team">'+
                '<div class="team-heading"><i class="fas fa-users"></i><span>'+title+'</span></div>'+
                '<div class="team-content">'+
                    '<button class="board-icon create-new-board-btn">Create New Board</button>'+
                '</div>'+
            '</div>';
}

//******************//
//  SETUP METHODS
//******************//

function setup() 
{   
    userId = localStorage.getItem('userId');
    username = localStorage.getItem('username');
    let url = `http://localhost:3000/all/${userId}`;
    console.log(url, userId);

    $.ajax({
        url: url,
        method: 'GET'
    })
    .done( data => {
        console.log(data);
        // teams[0].boards = data.personal;
        // teams = teams.concat(data.teams);
        // console.log(teams);
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
        url: `http://localhost:3000/${username}/boards/board`,
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
    let stringHTML = generateBoardIcon(tid, bid, bname);
    $(stringHTML).insertBefore($target);
    hideBoardModal();
}

//******************//
//  TEAM METHODS 
//******************//

function showTeamForm(e) 
{   /** show new team form */
    let offset  = $(e.target).offset();
    let $form = $('.team-creation-container');
    console.log($form);
    $form.addClass('active');
    $form.css('top', offset.top+'px');
    $form.css('left', offset.left+'px');
}

function hideTeamForm() 
{   /** hide new team form */
    let $form = $('.team-creation-container');
    $form.removeClass('active');
}

function createNewTeam(e)
{   /* create new team */
    e.preventDefault();
    let $btn = $(e.target);
    let title = $btn.siblings('#team-title-input').val().trim();
    let description = $btn.siblings('#team-description-input').val().trim();

    if ('' === title) return;

    $.ajax({
        url: 'http://localhost:3000/${username}/boards/team',
        method: 'POST',
        data: {
            name: title,
            ownerId: userId,
            description: description
        }
    })
    .done( data => {
        console.log(data);
        displayTeam(data.id, data.name, $btn);
    })
    .fail( err => {
        console.err(err);
    });
}

function displayTeam(teamId, title, $target)
{
    let stringHTML = generateTeamRow(teamId, title);
    $(stringHTML).insertBefore($target);
    hideTeamForm();
}

//******************//
//  MAIN FUNCTION 
//******************//

$(function() {
    // setup
    setup(); 
    // loadTeams();

    $body = $('body');
    $content = $('#board-content');

    // event handlers
    $body.on('click', '.create-new-board-btn', showBoardModal);
    $body.on('click', '.modal-background', hideBoardModal);
    $body.on('click', '#create-board-btn', createNewBoard);

    $body.on('click', '#create-new-team-btn', showTeamForm);
    $body.on('click', '#form-close-btn', hideTeamForm);
    $body.on('click', '#create-team-btn', createNewTeam);
});