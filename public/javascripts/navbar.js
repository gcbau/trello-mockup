/********************************************************
    All functionalities that involves around the nav bar
 *******************************************************/

//*********************//
//  HTML GENERATORS
//*********************//

function generateBoardItemResult(board) {
    console.log(board)
    let boardName = board.boardName;
    if (20 < boardName.length) {
        boardName = boardName.substring(0,20) + '...';
    }
    return `
        <div class="board-link-container">
            <a href="/b/${board.boardId}/${board.boardName}">${boardName}</a>
        </div>
    `;
}

function generateInvitationNotification(res) {
    console.log(res);
    return `
        <div class="notification">
            <p class="date">${res.date.replace('T',' ').replace(/\..*/,'')}</p>
            <p class="sender-msg">From: <span data-senderId=${res.senderId}><strong>${res.senderName}</strong></span></p>
            <p class="team-msg">Invited to: <strong>${res.teamName}</strong></p>
            <div class="btn-wrapper">
                <button class="accept-btn" data-teamid=${res.teamId} data-senderid=${res.senderId}>Accept</button>
                <button class="decline-btn">Decline</button>
            </div>
        </div>
    `;
}

//******************//
// SIDE BAR DISPLAY
//******************//

function displayProfile() {
    displaySideBar($('.profile-sidebar'));
}

function displaySideBar($sidebar) {
    if ($sidebar.hasClass('active')) {
        $sidebar.removeClass('active');
    } else {
        $sidebar.addClass('active');
    }
}

//******************//
//  Boards Sidebar
//******************//

function displayBoards() {
    let $sidebar = $('.boards-sidebar');
    if ($sidebar.hasClass('active')) {
        $sidebar.removeClass('active');
    } else {
        $sidebar.addClass('active');
    }
}

function displayTeam(e) 
{
    let $btn = $(e.target);
    let $teamItem = $btn.closest('.team-item');
    let $teamBoards = $teamItem.find('.team-boards');

    if ($teamBoards.hasClass('active')) {
        $btn.html('+');
        $teamBoards.removeClass('active');
    } else {
        $btn.html('-');
        $teamBoards.addClass('active');
    }
    console.log($btn);
}

//******************//
//  Notifications
//******************//

function displayNotifications() 
{
    let $sidebar = $('.notifications-sidebar');

    if ($sidebar.hasClass('active')) {
        $sidebar.find('.notification').remove();
        $sidebar.removeClass('active');
    } else {
        $sidebar.addClass('active');
        // fetch all notifications
        $.ajax({
            url: `/${userId}/notifications`,
            method: 'get',
            success: (res) => {
                console.log(res);

                let $container = $sidebar.find('#notifications-content');

                for (let i=0; i<res.length; ++i) {
                    let $alert = $(generateInvitationNotification(res[i]));
                    $container.append($alert);
                }
            },
            error: (err) => {
                console.error(err);
            }
        });
    }
}

function acceptInvitation(e)
{
    let $btn = $(e.target);
    let teamId = $btn.data('teamid');
    let senderId = $btn.data('senderid');

    $.ajax({
        url: '/invitation/accept',
        method: 'post',
        data: {
            teamId: teamId,
            senderId: senderId,
            receiverId: userId
        },
        success: (res) => {
            console.log(res);
            updateAfterAccept($btn, res);
        }, 
        error: (err) => {
            console.error(err);
        }
    });
}

function updateAfterAccept($btn, res)
{
    let $alert = $btn.closest('.notification');

    $newTeamBtn = $('#create-new-team-btn');
    $personal = $('#personal');

    if (!$newTeamBtn[0]) {
        console.log("we're not in the board's page");
        $alert.remove();
        return;
    } 

    let $newTeam = $(generateTeamRow(res[0].teamId, res[0].teamName));
    // $newTeam.insertBefore($newTeamBtn);
    $personal.after($newTeam);
    $alert.remove();
}



//*********************//
//  SEARCH BAR DISPLAY
//*********************//

function displaySearchBar(e) {
    let $target = $(e.target);
    let id = $target.attr('id');
    if (!id || id === 'search-input') {
        return;
    }
    $target = $target.closest('#search-nav');
    $target
        .addClass('search-extended')
        .empty()
        .append('<input type="text" id="search-input"/>')
        .append('<i class="fas fa-times close-search-btn"></i>')
        .append('<div id="search-results"></div>');

    $('#search-input').focus();
}

function hideSearchBar(e) {
    let $target = $(e.target).closest('#search-nav');
    $target
        .removeClass('search-extended')
        .empty()
        .append('<div id="show-search-input"></div>')
        .append('<div class="search-icon"><i class="fas fa-search"></i></div>');
}

//*********************//
//  SEARCH FUNCTIONS
//*********************//

var timeout;

function checkToSearch(e)
{
    // wait for user to stop typing
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(function() {
        console.log('checking search input');
        let query = $(e.target).val().trim() + '%';
        if ('%' === query) {
            $('#search-results').empty();
            $('#search-results').removeClass('search-active');
            return;
        }

        $('#search-results').addClass('search-active');
        searchQuery(query);
    }, 500);
}

function searchQuery(query) 
{
    query = query.replace(' ', '-');
    $.ajax({
        url: `/search?q=${query}`,
        method: 'GET',
        success: (data) => {
            displayResults(data);
        },
        error: (err) => {
            console.error(err);
        }
    });
}

function displayResults(data)
{
    console.log('displaying search results');
    console.log(data);

    let $searchResults = $('#search-results');
    $searchResults.empty();

    if (0 >= data.length) {
        $searchResults.append('<p style="padding-left:10px;">No results found.</p>');
        return;
    }


    let $cards;
    let $boards;
    let isCard = true;

    if (data[0].cardId) {
        $searchResults.append($('<div id="card-results"><h4>Cards</h4></div>'));
        $cards = $('#card-results');
    }
    for (let i=0; i<data.length; ++i) {
        if (isCard && !data[i].cardId) {
            $searchResults.append($('<div id="board-results"><h4>Boards</h4></div>'));
            $boards = $('#board-results');
            isCard = false;
        }

        if (isCard) {
            let card = data[i];
            let cardName = card.cardName;
            if (40 < cardName.length) {
                cardName = cardName.substring(0,40) + '...';
            }
            $cards.append($(`<a href="/b/${card.boardId}/${card.boardName}#${card.cardId}">${cardName}</a>`));
        } else {    
            let board = data[i];
            $boards.append($(generateBoardItemResult(board)));
        }
    }

}

//******************//
//      MAIN
//******************//

$(function() {
    var $showBoards  = $('#boards-nav');
    var $showProfile = $('#profile-nav');
    var $showNots    = $('#notifications-nav');

    $showBoards.click(displayBoards);
    $showProfile.click(displayProfile);
    $showNots.click(displayNotifications);

    var $search  = $('#search-nav');

    $search.click(displaySearchBar);
    $search.on('click', '.close-search-btn', hideSearchBar);
    $search.on('keyup', '#search-input', checkToSearch);

    $('body').on('click', '#search-results a', () => { $('.close-search-btn').click(); });
    
    // boards
    $('#sideboards-content').on('click', '.expand-btn', displayTeam);

    // notifications
    $('#notifications-content').on('click', '.accept-btn', acceptInvitation);
})