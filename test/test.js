var chai = require('chai');
var chaiHttp = require('chai-http');
var HTTPStatus = require('http-status');
var expect = chai.expect;
var app = require('../app');

chai.use(chaiHttp);

/**************/
/*   HELPER   */
/**************/
var agent = chai.request.agent(app);

function login()
{
    return agent.post('/home/login')
                .send({
                    email: 'bobby@bobber.bobcat',
                    pw: 'bobbiebobbacat'
                });
}

function createTeam(res)
{
    return agent.post('/bobbobster/boards/team')
                .send({
                    name: 'boblist 1',
                    ownerId: 1
                });
}

function createBoard(res2)
{
    return agent.post('/bobbobster/boards/board')
                .send({
                    name: 'bobboard 1',
                    ownerId: 1,
                    teamId: res2.body.id // using response2's team id
                });
}

function createList(res3)
{
    return agent.post('/list')
                .send({
                    name: 'listy',
                    ownerId: 1,
                    boardId: res3.body.id,
                    order: 1
                })
}

function createUpToList(done)
{
    return login().then(function(res) {
        return createTeam(res).then(function(res2) {
            return createBoard(res2).then(function(res3) {
                return createList(res3);
            })
            .catch( err => { done(err); } );
        })
        .catch( err => { done(err); } );
    })
    .catch( err => { done(err); } );
}

/**************/
/*   LOGIN    */
/**************/
describe('Login Page', function()
{
    //************//
    //   signup
    //************//
    describe('Sign Up', function() 
    {
        it('should fail when first name field is empty', function(done) 
        {
            chai.request(app)
            .post('/home/signup')
            .send({})
            .then(function(res) {
                expect(res).to.have.status(401);
                expect(res.text).to.eql('first name field is missing');
                done();
            })
            .catch(function(err) {
                done(err);
            });
        });

        it('should fail when last name field is empty', function(done) 
        {
            chai.request(app)
            .post('/home/signup')
            .send({first: 'bob'})
            .then(function(res) {
                expect(res).to.have.status(401);
                expect(res.text).to.eql('last name field is missing');
                done();
            })
            .catch(function(err) {
                done(err);
            });
        });

        it('should fail when email field is empty', function(done) 
        {
            chai.request(app)
            .post('/home/signup')
            .send({
                first: 'bob',
                last: 'bobster'
            })
            .then(function(res) {
                expect(res).to.have.status(401);
                expect(res.text).to.eql('email field is missing');
                done();
            })
            .catch(function(err) {
                done(err);
            });
        });

        it('should fail when password field is empty', function(done) 
        {
            chai.request(app)
            .post('/home/signup')
            .send({
                first: 'bob',
                last: 'bobster',
                email: 'bobby@bobber.bobcat'
            })
            .then(function(res) {
                expect(res).to.have.status(401);
                expect(res.text).to.eql('password field is missing');
                done();
            })
            .catch(function(err) {
                done(err);
            });
        });

        it('should succeed when all fields are provided', function(done) 
        {
            chai.request(app)
            .post('/home/signup')
            .send({
                first: 'Bob',
                last: 'Bobster',
                email: 'bobby@bobber.bobcat',
                pw: 'bobbiebobbacat'
            })
            .then(function(res) {
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err) {
                done(err);
            });
        });

        it('should fail when email is already used', function(done) 
        {
            chai.request(app)
            .post('/home/signup')
            .send({
                first: 'Bob',
                last: 'Bobster',
                email: 'bobby@bobber.bobcat',
                pw: 'bobbiebobbacat'
            })
            .then(function(res) {
                expect(res).to.have.status(400);
                done();
            })
            .catch(function(err) {
                done(err);
            });
        });
    });

    //************//
    //   login
    //************//
    describe('Log In', function()
    {
        it('should fail if email field is empty', function(done)
        {
            chai.request(app)
            .post('/home/login')
            .send({})
            .then(function(res) {
                expect(res).to.have.status(401);
                done();
            })
            .catch(function(err) {
                done(err);
            });
        });

        it('should fail if email does not exist', function(done)
        {
            chai.request(app)
            .post('/home/login')
            .send({
                email: 'dud@dud.dudler'
            })
            .then(function(res) {
                expect(res).to.have.status(401);
                done();
            })
            .catch(function(err) {
                done(err);
            });
        });

        it('should fail if password field is empty', function(done)
        {
            chai.request(app)
            .post('/home/login')
            .send({
                email: 'bobby@bobber.bobcat'
            })
            .then(function(res) {
                expect(res).to.have.status(401);
                done();
            })
            .catch(function(err) {
                done(err);
            });
        });

        it('should fail if password is incorrect', function(done)
        {
            chai.request(app)
            .post('/home/login')
            .send({
                email: 'bobby@bobber.bobcat',
                pw: 'dudler'
            })
            .then(function(res) {
                expect(res).to.have.status(401);
                done();
            })
            .catch(function(err) {
                done(err);
            });
        });

        it('should succeed if email and password are correct', function(done)
        {
            chai.request(app)
            .post('/home/login')
            .send({
                email: 'bobby@bobber.bobcat',
                pw: 'bobbiebobbacat'
            })
            .then(function(res) {
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err) {
                done(err);
            });
        });
    });
});

/**************/
/*   BOARDS   */
/**************/
describe('boards page', function()
{
    //*******************//
    //   team creation
    //*******************//
    describe('team creation', function()
    {
        it('should fail when team name field is missing', function(done)
        {
            login()
            .then(function(res) {
                expect(res).to.have.status(200);
                
                return agent
                            .post('/bobbobster/boards/team')
                            .send({})
                            .then(function(res2) {
                                expect(res2).to.have.status(401);
                                done();
                            })
                            .catch(function(err) {
                                done(err);
                            })
            })
            .catch(function(err){
                done(err);
            });
        });

        it('should fail when userId field is missing', function(done)
        {
            login()
            .then(function(res) {
                expect(res).to.have.status(200);
                
                return agent
                            .post('/bobbobster/boards/team')
                            .send({
                                name: 'boblist 1'
                            })
                            .then(function(res2) {
                                expect(res2).to.have.status(500);
                                done();
                            })
                            .catch(function(err) {
                                done(err);
                            })
            })
            .catch(function(err){
                done(err);
            });
        });

        it('should fail when userId expected is different', function(done)
        {
            login()
            .then(function(res) {
                expect(res).to.have.status(200);
                
                return agent
                            .post('/bobbobster/boards/team')
                            .send({
                                name: 'boblist 1',
                                ownerId: 2
                            })
                            .then(function(res2) {
                                expect(res2).to.have.status(400);
                                done();
                            })
                            .catch(function(err) {
                                done(err);
                            })
            })
            .catch(function(err){
                done(err);
            });
        });

        it('should fail when userId does not exist', function(done)
        {
            login()
            .then(function(res) {
                expect(res).to.have.status(200);
                
                return agent
                            .post('/bobbobster/boards/team')
                            .send({
                                name: 'boblist 1',
                                ownerId: 2
                            })
                            .then(function(res2) {
                                expect(res2).to.have.status(400);
                                done();
                            })
                            .catch(function(err) {
                                done(err);
                            })
            })
            .catch(function(err){
                done(err);
            });
        });

        it('should succeed when all the fields are correct', function(done)
        {
            login()
            .then(function(res) {
                expect(res).to.have.status(200);
                
                return agent
                            .post('/bobbobster/boards/team')
                            .send({
                                name: 'boblist 1',
                                ownerId: 1
                            })
                            .then(function(res2) {
                                expect(res2).to.have.status(200);
                                done();
                            })
                            .catch(function(err) {
                                done(err);
                            })
            })
            .catch(function(err){
                done(err);
            });
        });
    });

    //*********************//
    //   board creation
    //*********************//
    describe('board creation', function()
    {
        it('should fail when board name field is missing', function(done)
        {
            login()
            .then(function(res) {
                expect(res).to.have.status(200);
                
                return agent
                            .post('/bobbobster/boards/board')
                            .send({})
                            .then(function(res2) {
                                expect(res2).to.have.status(401);
                                done();
                            })
                            .catch(function(err) {
                                done(err);
                            })
            })
            .catch(function(err){
                done(err);
            });
        });

        it('should fail when userId field is missing', function(done)
        {
            login()
            .then(function(res) {
                expect(res).to.have.status(200);
                
                return agent
                            .post('/bobbobster/boards/board')
                            .send({
                                name: 'bobboard 1'
                            })
                            .then(function(res2) {
                                expect(res2).to.have.status(500);
                                done();
                            })
                            .catch(function(err) {
                                done(err);
                            })
            })
            .catch(function(err){
                done(err);
            });
        });

        it('should fail when userId does not exist', function(done)
        {
            login()
            .then(function(res) {
                expect(res).to.have.status(200);
                
                return agent
                            .post('/bobbobster/boards/board')
                            .send({
                                name: 'bobboard 1',
                                ownerId: 2
                            })
                            .then(function(res2) {
                                expect(res2).to.have.status(400);
                                done();
                            })
                            .catch(function(err) {
                                done(err);
                            })
            })
            .catch(function(err){
                done(err);
            });
        });

        it('should fail when teamId is a string', function(done)
        {
            login()
            .then(function(res) {
                expect(res).to.have.status(200);
                
                return agent
                            .post('/bobbobster/boards/board')
                            .send({
                                name: 'bobboard 1',
                                ownerId: 2,
                                teamId: 'fefwefewf'
                            })
                            .then(function(res2) {
                                expect(res2).to.have.status(400);
                                done();
                            })
                            .catch(function(err) {
                                done(err);
                            })
            })
            .catch(function(err){
                done(err);
            });
        });

        it('should fail when teamId does not exist', function(done)
        {
            login()
            .then(function(res) {
                expect(res).to.have.status(200);
                
                return agent
                            .post('/bobbobster/boards/board')
                            .send({
                                name: 'bobboard 1',
                                ownerId: 2,
                                teamId: 1000
                            })
                            .then(function(res2) {
                                expect(res2).to.have.status(400);
                                done();
                            })
                            .catch(function(err) {
                                done(err);
                            })
            })
            .catch(function(err){
                done(err);
            });
        });

        it('should succeed when all fields are correct and team Id is not provided', function(done)
        {
            login()
            .then(function(res) {
                expect(res).to.have.status(200);
                
                return agent
                            .post('/bobbobster/boards/board')
                            .send({
                                name: 'bobboard 1',
                                ownerId: 1
                            })
                            .then(function(res2) {
                                expect(res2).to.have.status(200);
                                done();
                            })
                            .catch(function(err) {
                                done(err);
                            })
            })
            .catch(function(err){
                done(err);
            });
        });

        it('should succeed when all fields are correct and team Id is provided', function(done)
        {
            // login first
            login().then(function(res) {        
                // create team second
                createTeam(res).then(function(res2) {
                    // create a board in that team third
                    createBoard(res2).then(function(res3) {
                        expect(res3).to.have.status(200);
                        
                        // finish
                        done();
                    })
                    .catch(function(err) {
                        done(err);
                    });
                })
                .catch(function(err) {
                    done(err);
                })
            })
            .catch(function(err){
                done(err);
            });
        });
    });
});

/**************/
/*   LISTS    */
/**************/
describe('lists', function()
{
    describe('list creation', function()
    {   
        it('should fail when list name field is missing', function(done)
        {
            // login first
            login().then(function(res) {        
                // create team second
                createTeam(res).then(function(res2) {
                    // create a board in that team third
                    createBoard(res2).then(function(res3) {
                        // create a list in that board
                        return agent.post('/list')
                        .send({})
                        .then(function(res4) {
                            expect(res4).to.have.status(401);
                            done();
                        })
                        .catch( err => { done(err); });
                    })
                    .catch( err => { done(err); });
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

        it('should fail when owner id field is missing', function(done)
        {
            // login first
            login().then(function(res) {        
                // create team second
                createTeam(res).then(function(res2) {
                    // create a board in that team third
                    createBoard(res2).then(function(res3) {
                        // create a list in that board
                        return agent.post('/list')
                        .send({
                            name: 'listy'
                        })
                        .then(function(res4) {
                            expect(res4).to.have.status(401);
                            done();
                        })
                        .catch( err => { done(err); });
                    })
                    .catch( err => { done(err); });
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

        it('should fail when boardId field is missing', function(done)
        {
            // login first
            login().then(function(res) {        
                // create team second
                createTeam(res).then(function(res2) {
                    // create a board in that team third
                    createBoard(res2).then(function(res3) {
                        // create a list in that board
                        return agent.post('/list')
                        .send({
                            name: 'listy',
                            ownerId: 1
                        })
                        .then(function(res4) {
                            expect(res4).to.have.status(401);
                            done();
                        })
                        .catch( err => { done(err); });
                    })
                    .catch( err => { done(err); });
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

        it('should fail when order field is missing', function(done)
        {
            // login first
            login().then(function(res) {        
                // create team second
                createTeam(res).then(function(res2) {
                    // create a board in that team third
                    createBoard(res2).then(function(res3) {
                        // create a list in that board
                        return agent.post('/list')
                        .send({
                            name: 'listy',
                            ownerId: 1,
                            boardId: res3.body.id
                        })
                        .then(function(res4) {
                            expect(res4).to.have.status(401);
                            done();
                        })
                        .catch( err => { done(err); });
                    })
                    .catch( err => { done(err); });
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

        it('should succeed when all fields are correct', function(done)
        {
            // login first
            login().then(function(res) {        
                // create team second
                createTeam(res).then(function(res2) {
                    // create a board in that team third
                    createBoard(res2).then(function(res3) {
                        // create a list in that board
                        return agent.post('/list')
                        .send({
                            name: 'listy',
                            ownerId: 1,
                            boardId: res3.body.id,
                            order: 1
                        })
                        .then(function(res4) {
                            expect(res4).to.have.status(200);
                            done();
                        })
                        .catch( err => { done(err); });
                    })
                    .catch( err => { done(err); });
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

    });
});

/**************/
/*   CARDS    */
/**************/
describe('cards', function()
{
    describe('card creation', function()
    {
        it('should fail when card name field is missing', function(done)
        {
            // create everything up to the list
            createUpToList(done).then(function(res) {
                // create a card in that list
                return agent.post('/card')
                .send({})
                .then(function(res2) {
                    expect(res2).to.have.status(401);
                    done();
                })
                .catch( err => { next(err); });
            })
            .catch( err => { done(err); });
        });

        it('should fail when owner ID field is missing', function(done)
        {
            // create everything up to the list
            createUpToList(done).then(function(res) {
                // create a card in that list
                return agent.post('/card')
                .send({
                    name: 'cardo'
                })
                .then(function(res2) {
                    expect(res2).to.have.status(500);
                    done();
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

        it('should fail when owner ID field is a string', function(done)
        {
            // create everything up to the list
            createUpToList(done).then(function(res) {
                // create a card in that list
                return agent.post('/card')
                .send({
                    name: 'cardo',
                    ownerId: 'dud'
                })
                .then(function(res2) {
                    expect(res2).to.have.status(401);
                    done();
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

        it('should fail when list ID field is missing', function(done)
        {
            // create everything up to the list
            createUpToList(done).then(function(res) {
                // create a card in that list
                return agent.post('/card')
                .send({
                    name: 'cardo',
                    ownerId: 1
                })
                .then(function(res2) {
                    expect(res2).to.have.status(401);
                    done();
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

        it('should fail when list ID field is a string', function(done)
        {
            // create everything up to the list
            createUpToList(done).then(function(res) {
                // create a card in that list
                return agent.post('/card')
                .send({
                    name: 'cardo',
                    ownerId: 1,
                    listId: 'hello'
                })
                .then(function(res2) {
                    expect(res2).to.have.status(401);
                    done();
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

        it('should fail when order field is missing', function(done)
        {
            // create everything up to the list
            createUpToList(done).then(function(res) {
                // create a card in that list
                return agent.post('/card')
                .send({
                    name: 'cardo',
                    ownerId: 1,
                    listId: res.body.id
                })
                .then(function(res2) {
                    expect(res2).to.have.status(401);
                    done();
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

        it('should fail when order field is a string', function(done)
        {
            // create everything up to the list
            createUpToList(done).then(function(res) {
                // create a card in that list
                return agent.post('/card')
                .send({
                    name: 'cardo',
                    ownerId: 1,
                    listId: res.body.id,
                    order: 'dud'
                })
                .then(function(res2) {
                    expect(res2).to.have.status(401);
                    done();
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

        it('should succed when all fields are correct', function(done)
        {
            // create everything up to the list
            createUpToList(done).then(function(res) {
                // create a card in that list
                return agent.post('/card')
                .send({
                    name: 'cardo',
                    ownerId: 1,
                    listId: res.body.id,
                    order: 1
                })
                .then(function(res2) {
                    expect(res2).to.have.status(200);
                    done();
                })
                .catch( err => { done(err); });
            })
            .catch( err => { done(err); });
        });

    });
});