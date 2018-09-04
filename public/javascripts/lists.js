/*************************************************************
    All functionalities that involves around boards.html
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

    cardSortable.on('sortable:stop', (event) => {
        console.log('cardSortable:stop => ', event);
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
        updatePositions();
    }, 1);
}

function updatePositions()
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

    console.log(data);
    $.ajax({
        url: 'http://localhost:3000/list/position',
        method: 'patch',
        data: {
            lists: JSON.stringify(data)
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
            let $lfoot = $(`#${listId}.list .list-foot`);

            cards[listId] = tempCards;
            // cards don't exist
            if (!tempCards[0]) continue;
            // cards exist
            for (let j=0; j<tempCards.length; ++j) {
                let card = tempCards[j];
                let $card = $(generateCardHTML(card["id"],card["name"]));
                $card.insertBefore($lfoot);
            }
        }
        setupCardsSortables();
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
                <ul class="card-container">
                    <li class="list-foot addRowItem">
                        <span id="showCardForm" class="active">
                            + Add a card
                        </span>
                        <span id="cardForm">
                            <button class="addNewCard-btn">Add Card</button>
                            <button class="closeNewCard-btn">X</button>
                        </span>
                    </li>
                </ul>
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
    console.log(lists);
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
    let $foot = $(e.target).closest('li');
    $row.insertBefore($foot);

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
    let $card = $btn.closest('.list-foot').prev().children('textarea');

    let cardname = $card.val().trim();
    if (cardname === '') return;

    let listId = $card.closest('.list').attr('id');

    saveCard(cardname, listId);
    displayCard($card, $btn, cardname);
}

function saveCard(cardname, listId) {
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
        cards[listId].push(data);
        console.log(cards);
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

    let $foot = $btn.closest('li');
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

























// var $content;
// var $addColumnBtn;
// var $cardTitleToReplace;

// var liSortable;
// var ulSortable;

// var queries;
// var boardId;
// var cache;

// var labels = [];

// const MAX_LABEL_INPUT = 16;

// /** HELPER: get query string */
// function getQueryString() {
//     let queriesArray = window.location.search.replace('?','').split('&');
//     let queries = {};
//     for (let i=0; i<queriesArray.length; ++i) {
//         let kv = queriesArray[i].split('=');
//         queries[kv[0]] = kv[1];
//     }
//     return queries;
// }

// //******************//
// //  SETUP 
// //******************//

// function setupSortables() {
//     liSortable = new Sortable.default(document.querySelectorAll('.card-container'), {
//         draggable: '.row'
//       });
//     ulSortable = new Sortable.default(document.querySelector('div'), {
//         draggable: 'div.col'
//     });

//     liSortable.on('sortable:start', (event) => {
//         console.log('hello')
//     });
//     liSortable.on('sortable:stop', (event) => {
//         console.log(event);
//     });
//     ulSortable.on('sortable:start', (event) => {
//         let $target = $(event.data.dragEvent.data.sensorEvent.target);
//         if (!$target.hasClass('colHeading')) {
//             event.cancel();
//         }
//     });
// }

// function setupSelectors() {
//     $content = $('#content');
//     $addColumnBtn = $('#addColumnBtn');
// }

// function setupCache() {
//     queries = getQueryString();
//     cache = JSON.parse(localStorage.getItem('prello'));
//     let teamId = queries.t;
//     let boardId = queries.b;
//     let lsts = cache["teams"][teamId]['boards'][boardId]['lists'];
//     console.log(lsts);

//     loadLists(lsts);
// }

// function loadLists(lsts) {
//     let lstsIds = Object.keys(lsts);
//     for (let i=0; i<lstsIds.length; ++i) {
//         let lstId = lstsIds[i];
//         let title = lsts[lstId]['name'];
//         newListItem(lstId, title).insertBefore($('#addColumnBtn'));
//         loadCards(lstId, lsts[lstId]['cards']);
//     }
// }

// function loadCards(lstId, cards) {
//     let cardIds = Object.keys(cards);
//     for (let j=0; j<cardIds.length; ++j) {
//         let cardId = cardIds[j];
//         let cardName = cards[cardId]['name'];
//         let card = $(`<li id="${cardId}" class="row">${cardName}</li>`);
//         $(`#${lstId} ul`).append(card);
//     }
// }

// //******************//
// //  LISTS 
// //******************//

// function newListItemForm() 
// {
//     let form = $('<form id="newColumnForm"></form');
//     form.append('<input type="text" id="listTitleInput"/>');
//     form.append('<button id="newColSubmit" value="Submit Here">Add List</button>');
//     form.append('<button id="closeColumnFormBtn">X</button>')
//     return form;
// }

// function newListItem(listId, title) 
// {
//     let column = $('<div id="'+ listId +'" class="col"></div>');
//     column.append('<h2 class="colHeading">'+title+'</h2>');
//     column.append('<ul class="card-container"></ul>');
//     column.append('<div class="col-foot addRowItem">+ Add a card</div>');

//     return column;
// }
// function cacheNewList(listId, title) 
// {
//     let teamId = queries.t;
//     let boardId = queries.b;
//     let lsts = cache["teams"][teamId]['boards'][boardId]['lists'];
//     lsts[listId] = {
//         cards: {},
//         name: title
//     }
    
//     let stringified = JSON.stringify(cache);
//     localStorage.setItem('prello', stringified);
// }

// //******************//
// //  CARDS 
// //******************//

// function newListRow() {
//     let row = $('<li class="row textarea-active"></li>');
//     row.append('<textarea class="newCardInput"></textarea>');
//     return row;
// }

// function cacheNewCard(title, lstId) {
//     let teamId = queries.t;
//     let boardId = queries.b;
//     let list = cache["teams"][teamId]['boards'][boardId]['lists'][lstId];
//     let nextId = cache['nextId']++;
//     list['cards'][nextId*13] = {
//         name: title
//     }
//     let stringified = JSON.stringify(cache);
//     localStorage.setItem('prello',stringified);
// }

// function cardOptionsModal() {
//     let modal = $('<div class="card-options-modal"></div>');
//     modal
//         .append('<div class="modal-background"></div>')
//         .append('<textarea class="card-input"></textArea>')
//         .append('<button class="modal-save">Save</button>');
//     return modal;
// }

// //******************//
// //  MAIN 
// //******************//

// $(function() {
//     // setup
//     setupSortables();
//     setupSelectors();
//     setupCache();

//     /**
//      *  Column Creation
//      */
//     $content.on('click', '#addColumnBtn',function(e) {
//         // display new col form
//         $('#addColumnBtn').replaceWith(newListItemForm());
//         $('#listTitleInput').focus();
//     });
//     $content.on('click', '#closeColumnFormBtn', function(e) {
//         // cancel new col creation
//         e.preventDefault();
//         $('#newColumnForm').replaceWith('<button id="addColumnBtn">Add List Item</button>');
//     });
//     $content.on('submit', '#newColumnForm', function(e) {
//         // create new col
//         e.preventDefault();
//         let title = $('#listTitleInput').val().trim();
//         if (title === '') {
//             return;
//         }
//         $('#listTitleInput').val('');
//         let listId = cache['nextId']++;
//         newListItem(listId*13, title).insertBefore($('#newColumnForm'));
//         cacheNewList(listId*13, title);
//         $('#newColumnForm')[0].scrollIntoView();
//     })

//     /**
//      *  Card Creation
//      */
//     $content.on('click', '.addRowItem', function(e) {
//         // display textarea and form
//         let target = $(e.target);
//         let ulList = $(target).prev();
//         ulList.append(newListRow());
//         target
//             .removeClass('addRowItem')
//             .empty()
//             .append('<button class="addNewCard-btn">Add Card</button>')
//             .append('<button class="closeNewCard-btn">X</button>');
//         $('.newCardInput').focus();
//     });

//     $content.on('click', '.addNewCard-btn', function(e) {
//         // click to submit new card
//         e.preventDefault();
//         let target = $(e.target).parent().prev().children().last().children();
//         let title = target.val().trim();
//         if (title === '') {
//             return;
//         } else {
//             let lstId = target.closest('.col').attr('id');
//             cacheNewCard(title, lstId);
//         }
//         let parent = target.parent();
//         target.remove();
//         parent.append(title);
//         parent.removeClass('textarea-active');
//         parent.removeAttr('style');
    
//         $(e.target).parent()
//             .addClass('addRowItem')
//             .empty()
//             .append('+ Add a card')
    
//         setupSortables();
//     });

//     $content.on('click', '.closeNewCard-btn', function(e) {
//         // cancel new card
//         e.preventDefault();
//         let target = $(e.target).parent();
//         target.prev().children().last().remove();
//         target
//             .addClass('addRowItem')
//             .empty()
//             .append('+ Add a card')
//     }); 

//     $content.on('input', '.newCardInput', function () {
//         // textarea auto resize
//         $(this).outerHeight(38).outerHeight(this.scrollHeight+20); // 38 or '1em' -min-height
//         $(this).parent().outerHeight(this.scrollHeight);
//     }); 

//     $content.on('keydown', '.newCardInput', function(e) {
//         // text area key presses
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             $('.addNewCard-btn').click();
//         }
//         else if (e.key === 'Escape') {
//             let target = $(e.target).parent();
//             let footer = target.parent().next();
//             target.remove();
//             footer
//                 .addClass('addRowItem')
//                 .empty()
//                 .append('+ Add a card');
//         }
//     });

//     /**
//      *  Card info modal
//      */
//     $content.on('click', 'ul .row', function(e) {
//         if (e.target !== e.currentTarget) return;
//         $('.card-info-modal').addClass('active');
//     });

//     $('body').on('click', '.modal-background', function(e) {
//         $('.card-info-modal').removeClass('active');
//     });
    
//     /**
//      *  Card Editable
//      */
//     $content.on('mouseenter', 'ul .row', function(e) {
//         // display options button
//         if (e.target !== e.currentTarget) return;
//         let $li = $(e.target);
//         $li.append('<span class="li-options-btn"><i class="fas fa-pen"></i></span>');
//     });
//     $content.on('mouseleave', 'ul .row', function(e) {
//         // hide options button
//         if (e.target !== e.currentTarget) return;
//         let $optionsBtn = $(e.target).find('.li-options-btn');
//         $optionsBtn.remove();
//     });

//     /**
//      *  Card Options Modal
//      */
//     $content.on('click', '.li-options-btn', function(e) {
//         $cardTitleToReplace = $(e.target).closest('li');
//         let pos = $cardTitleToReplace.offset();
//         $content.append(cardOptionsModal());
//         $('.card-options-modal')
//             .css('width', $('body').width() + 'px');
//         $('.card-input')
//             .css('top', pos.top+'px')
//             .css('left', pos.left+'px')
//             .focus();
//         $('.modal-save')
//             .css('top', (pos.top+220)+'px')
//             .css('left', pos.left+'px');
//         $('body').addClass('modal-active');
//     })

//     $content.on('click', '.modal-background', function(e) {
//         console.log('hiding modal');
//         $(e.target).parent().remove();
//         $('body').removeClass('modal-active');
//     })

//     $content.on('keydown', '.card-input', function(e) {
//         if (e.key === 'Enter') {
//             let newTitle = $(e.target).val();
//             $cardTitleToReplace.html(newTitle);
//             $cardTitleToReplace = null;
//             $(e.target).parent().remove();
//             $('body').removeClass('modal-active');
//         }
//     })
//     $content.on('click', '.modal-save', function(e) {
//         let newTitle = $(e.target).prev().val();
//         $cardTitleToReplace.html(newTitle);
//         $cardTitleToReplace = null;
//         $(e.target).parent().remove();
//         $('body').removeClass('modal-active');
//     })


//     /** label auto complete */
//     $('.labels-container').on('click', function(e) {
//         if (e.target !== e.currentTarget) {
//             return;
//         }
//         $('#label-input').focus();
//     })

//     $('#label-input').on('keydown', function(e) {
//         let $target = $(e.target);
//         let val = $target.html().trim();
//         // check for enter
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             console.log(val);
//             if (val === '') {
//                 return;
//             }

//             // record and display new label
//             labels.push(val);
//             let $labelBlock =  $(`<div class="label">${val} <span class="del-label-btn">X</span></div>`);
//             $labelBlock.insertBefore($target);
//             $target.empty();
//             return;
//         } 
//         else if (e.key === 'Backspace') {
//             if (val === '') {
//                 if ($target.prev().length) {
//                     $target.prev().remove();
//                 }
//             }
//         }
//         else {
//             console.log(val.length);
//             if (MAX_LABEL_INPUT <= val.length) {
//                 e.preventDefault();
//             }
//         }
//     });

//     $('.labels-container').on('click', '.del-label-btn', function (e) {
//         let $label = $(e.target).closest('.label');
//         $label.remove();
//     });
// })