/********************************************************
    All functionalities that involves around the nav bar
 *******************************************************/

//*********************//
//  HTML GENERATORS
//*********************//

function generateBoardItemResult(board) {
    return `
        <div class="board-link-container">
            <a href="/b/${board.id}/${board.name}">${board.name}</a>
        </div>
    `;
}

//******************//
// SIDE BAR DISPLAY
//******************//

function displayBoards() {
    displaySideBar($('.boards-sidebar'));
}
function displayProfile() {
    displaySideBar($('.profile-sidebar'));
}
function displayNotifications() {
    displaySideBar($('.notifications-sidebar'));
}

function displaySideBar($sidebar) {
    if ($sidebar.hasClass('active')) {
        $sidebar.removeClass('active');
    } else {
        $sidebar.addClass('active');
    }
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
    console.log('searching by input');
    $.ajax({
        url: `http://localhost:3000/search?q=${query}`,
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
    console.log('displaying results');
    let boards = data.boards;
    let cards  = data.cards;
    let $searchResults = $('#search-results');
    $searchResults.empty();

    if (0 < cards.length) {
        $searchResults.append($('<div id="card-results"><h4>Cards</h4></div>'));
        let $cards = $('#card-results');
        for (let i=0; i<cards.length; ++i) {
            let card = cards[i];
            console.log(card);
            $cards.append($(`<a href="/b/${card.boardId}/${card.boardName}#${card.id}">${card.name}</a>`));
        }
    }
    if (0 < boards.length) {
        $searchResults.append($('<div id="board-results"><h4>Boards</h4></div>'));
        let $boards = $('#board-results');
        for (let i=0; i<boards.length; ++i) {
            let board = boards[i];
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
})