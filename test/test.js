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
    return agent
                .post('/home/login')
                .send({
                    email: 'bobby@bobber.bobcat',
                    pw: 'bobbiebobbacat'
                })
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

    //***************************//
    //   boards: team creation
    //***************************//
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

    //***************************//
    //   boards: board creation
    //***************************//
    describe('board creation', function()
    {
        it('should fail', function(done)
        {
            done();
        });
    });
});