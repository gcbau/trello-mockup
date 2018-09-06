/*************************************************************
        All functionalities that involve lists
 *************************************************************/

var userId;
var username;
var boardId;
var boardname;
var teamId;

var cardSortable;
var listSortable;

var lists = [];
var cards = {};

//******************//
//     Sortable
//******************//

function setupCardsSortables()
{
    if (cardSortable) {
        cardSortable.destroy();
    }
    cardSortable = new Sortable.default(document.querySelectorAll('.card-container'), {
        draggable: '.card'
    });

    cardSortable.on('sortable:stop', (event) => 
    {
        console.log(event);
        let $card = $(event.data.dragEvent.data.source);
        let oldContainer = event.data.oldContainer;
        let newContainer = event.data.newContainer;

        let oldListId = $(oldContainer).closest('.list').attr('id');
        let newListId = $(newContainer).closest('.list').attr('id');

        // change new list inner order
        setTimeout(function() {
            updateCardPositions($card.attr('id'), newListId, oldListId);
        }, 50);
    });
}

function setupSortables() 
{
      listSortable = new Sortable.default(document.querySelector('#content'), {
        draggable: '.list'
    });
}

function refreshLists(e) 
{
    let $content = $(e.data.newContainer);
    setTimeout(function() 
    {
        lists = $content.children('.list').toArray();
        updateListPositions();
    }, 1);
}

function updateListPositions()
{
    let data = []
    for (let i=0; i<lists.length; ++i) {
        let $list = $(lists[i]);
        let pos  = $list.index();
        data.push({
            lid: $list.attr('id'),
            order: pos
        });
    }

    $.ajax({
        url: `http://localhost:3000/board/${boardId}/list`,
        method: 'patch',
        data: {
            lists: JSON.stringify(data)
        }
    });
}

function updateCardPositions(cid, lid, oldListId)
{
    let data = []
    let $cards = $(`#${cid}.card`).parent().children();
    for (let i=0; i<$cards.length; ++i) {
        let $card = $($cards[i]);
        let pos = $card.index();
        data.push({
            cid: $card.attr('id'),
            order: pos
        })
    } 

    console.log(data);
    $.ajax({
        url: `http://localhost:3000/list/${lid}/card`,
        method: 'patch',
        data: {
            cards: JSON.stringify(data)
        },
        success: data => {
            console.log(data);
        }
    });
}

//******************//
//      SETUP
//******************//

function setupUser()
{
    userId = localStorage.getItem('userId');
    username = localStorage.getItem('username');
    
    let pathname = location.pathname.replace('/b/', '');
    let [ bid, bname ] = pathname.split('/');

    boardId = bid;
    boardname = bname;

    $.ajax({
        url: `http://localhost:3000/team?bid=${boardId}`,
        method: 'get',
    })
    .then( (tid) => {
        teamId = tid;
    })
    .fail( (err) => {

    });

    // CODE TO DO: check if user really has this board..
}

function setupLists() 
{
    $.ajax({
        url: `http://localhost:3000/list/${userId}/${boardId}`,
        method: 'get',
    })
    .then( (data) => {
        $target = $('#list-form-container')
        for (let i=0; i< data.length; ++i) {
            let id = data[i].id;
            let name = data[i].name;

            cards[id] = [];
            $(generateListHTML(id,name)).insertBefore($target);
        }
        lists = data;
        setupCards();
    });
}

function setupCards()
{
    $.ajax({
        url: `http://localhost:3000/card/${userId}/${boardId}`,
        method: 'get'
    })
    .then( (lists) => {
        for (let i=0; i<lists.length; ++i) {
            let listId = lists[i]["listid"];
            let tempCards = lists[i]["cards"];
            let $lfoot = $(`#${listId}.list .card-container`);

            cards[listId] = tempCards;
            // cards don't exist
            if (!tempCards[0]) continue;
            // cards exist
            console.log(lists[i]);
            for (let j=0; j<tempCards.length; ++j) {
                let card = tempCards[j];
                let $card = $(generateCardHTML(card["id"],card["name"]));
                // $card.insertBefore($lfoot);
                $lfoot.append($card);
            }
        }
        setupCardsSortables();

        // card_info.js stuff
        let hash = window.location.hash;
        if (hash) {
            console.log(hash);
            let $card = $(`${hash}.card`);
            $card.click();
        }
    })
}

//******************//
//    LIST FORM
//******************//

function showListForm(e) 
{
    let $btn  = $(this);
    let $form = $('#newColumnForm');
    $btn.removeClass('active');
    $form.addClass('active');
    $form.children('#listTitleInput').trigger('focus');
}
function hideListForm(e) 
{
    e.preventDefault();

    let $form = $(e.target).closest('#newColumnForm');
    let $btn = $('#addColumnBtn');
    $form.removeClass('active');
    $btn.addClass('active');
}

function generateListHTML(listId, title) 
{
    return `
        <div id="${listId}" class="list">
            <div class="list-wrapper">
                <h2 class="colHeading">${title}</h2>
                <ul class="card-container"></ul>
                <div class="list-foot addRowItem">
                    <span id="showCardForm" class="active">
                        + Add a card
                    </span>
                    <span id="cardForm">
                        <button class="addNewCard-btn">Add Card</button>
                        <button class="closeNewCard-btn">X</button>
                    </span>
                </div>
            </div>
        </div>
    `;
}

//******************//
//    CREATE LIST
//******************//

function createList(e)
{
    e.preventDefault();

    let listname = $('#listTitleInput').val().trim();
    if (listname === '') return;

    $.ajax({
        url: 'http://localhost:3000/list',
        method: 'post',
        data: {
            ownerId: userId,
            boardId: boardId,
            name: listname,
            order: lists.length
        },
        success: data => displayList(data),
        error: err => displayListError(err)
    });
}

function displayList(data) 
{
    $('#listTitleInput').val("");
    $('#closeColumnFormBtn').trigger('click');

    let $list = $(generateListHTML(data.id, data.name));
    $list.insertBefore($('#list-form-container'));

    lists.push($list);
    cards[data.id] = [];
    console.log(cards);
    listSortable.addContainer(document.querySelectorAll('.list'));
    console.log($('#newColumnForm'));
    $('#list-form-container')[0].scrollIntoView();
}

function displayListError(err) 
{
    console.log(err);
}

//******************//
//    CARD FORM
//******************//

function newListRow() 
{
    return `
        <li class="card textarea-active">
            <textarea class="newCardInput"></textarea>  
        </li>
    `;
}

function generateCardHTML(cid, cname) 
{
    return `
        <li id=${cid} class="card">${cname}</li>
    `;
}

function showCardForm(e) 
{
    // add new list row && change list foot
    let $row = $(newListRow());
    let $foot = $(e.target).closest('.list-foot');
    console.log($foot);
    // $row.insertBefore($foot);
    $foot.prev().append($row);

    $foot.find('#showCardForm').removeClass('active');
    $foot.find('#cardForm').addClass('active');
    $('.newCardInput').trigger('input');
}

function resizeCardForm() 
{
    $(this).outerHeight(38).outerHeight(this.scrollHeight+20); // 38 or '1em' -min-height
    $(this).parent().outerHeight(this.scrollHeight);
}

//******************//
//    CREATE CARD
//******************//

function createCard(e) 
{
    let $btn = $(e.target);
    let $card = $btn.closest('.list-foot').prev().find('textarea');
    console.log($card);

    let cardname = $card.val().trim();
    if (cardname === '') return;

    let listId = $card.closest('.list').attr('id');

    saveCard($card, cardname, listId);
    displayCard($card, $btn, cardname);
}

function saveCard($card, cardname, listId) {
    let $parent = $card.parent();
    $.ajax({
        url: 'http://localhost:3000/card',
        method: 'post',
        data: {
            name: cardname,
            listId: listId,
            ownerId: userId,
            description: '',
            order: cards[listId].length
        }
    })
    .then( (data) => {
        $parent.attr('id', data.id);
    })
    .fail( (err) => {
        console.error(err);
    });
}

function displayCard($card, $btn, cardname) 
{
    let $parent = $card.parent();
    $parent.html(cardname);
    $parent.removeClass('textarea-active');
    $parent.removeAttr('style');

    let $foot = $btn.closest('.list-foot');
    $foot.find('#showCardForm').addClass('active');
    $foot.find('#cardForm').removeClass('active');
}

//******************//
//      MAIN
//******************//
$(function() {
    setupSortables();
    setupUser();
    setupLists();
    $('#home-nav a').attr('href', `/${username}/boards`);

    listSortable.on('sortable:start', (event) => {
        let $target = $(event.data.dragEvent.data.sensorEvent.target);
        if (!$target.hasClass('colHeading')) {
            event.cancel();
        }
    });
    listSortable.on('sortable:stop', refreshLists);

    $('#addColumnBtn').on('click', showListForm);
    $('#closeColumnFormBtn').on('click', hideListForm);
    $('#newColumnForm').on('submit', createList);

    $('body').on('click', '#showCardForm', showCardForm);
    $('body').on('input', '.newCardInput', resizeCardForm); 
    $('body').on('click', '.addNewCard-btn', createCard);
});