/********************************************************
    All functionalities that involves around the nav bar
 *******************************************************/

/** main */
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
    $search.on('keydown', '#search-input', checkToSearch)
})

/**
 *      display/hide side bars
 */
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

/**
 *      display/hide search bar
 */
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
        .append('<i class="fas fa-times close-search-btn"></i>');

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

/**
 * 
 */
function checkToSearch(e) {
    let val = $(e.target).val().trim();
    if (val === '' || e.key !== 'Enter') {
        return;
    }

    loopThroughTeams(val);
}

function loopThroughTeams(val) {
    let matches = [];
    let teamIds = Object.keys(cache['teams']);
    for (let i=0; i<teamIds.length; ++i) {
        let tid = teamIds[i];
        matches = matches.concat(searchForBoards(val, cache['teams'][tid]['boards']));
    }

    console.log(matches);
    return matches;
}

function searchForBoards(val, boards) {
    let matches = [];
    let bids = Object.keys(boards);
    for (let i=0; i<bids.length; ++i) {
        let bid = bids[i];
        let bname = boards[bid]['name'];
        console.log('board name: ', bname);
        if (bname === val) {
            matches.push(boards[bid]);
        }
        matches = matches.concat(searchForCards(val, boards[bid]['lists']));
    }

    return matches
}

function searchForCards(val, lists) {
    let matches = [];
    let cids = Object.keys(lists);
    for (let i=0; i<cids.length; ++i) {
        let cid = cids[i];
        let cname = lists[cid]['name'];
        console.log('card name: ', cname);
        if (cname === val) {
            matches.push(lists[cid]);
        }
    }
    return matches
}