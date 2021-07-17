var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var methodOverride = require('method-override');
var User = require('./models/User');
var Project = require('./models/Project');
var Issue = require('./models/Issue');
var Comment = require('./models/Comment');
const mongoose = require('mongoose');
const Update = require('./models/Update');

mongoose.connect('mongodb+srv://mudit:mj@cluster0.7aior.mongodb.net/projectHub?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', ()=>{
    console.log("Connected to db");
})

app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public/stylesheets'));
app.use(methodOverride('_method'));

//Passport
app.use(require("express-session")({
    secret: "It is for users",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});


app.get('/', (req, res) => {

    res.render('home');

})

app.get('/projects',isLoggedIn, (req, res)=> {

    Project.find({}, (err, foundProject)=> {
        if(err){
            // console.log(err);
            res.redirect('back');
        }
        else{
            // console.log(foundProject);
            res.render('Projects', {projects: foundProject});
        }
    })

})

app.get('/register', (req, res) => {
    res.render("register");
})

app.post('/register', (req, res) => {
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, (err, user) => {
        if(err){
            // console.log(err);
            return res.render("register");
        }
        passport.authenticate('local')(req, res, ()=> {
            res.redirect('/');
        })
    })
})

app.get('/login', (req, res) => {
    res.render("login");
})

app.post('/login', passport.authenticate('local',
    {
        successRedirect: '/',
        failureRedirect: '/login'
    }), (req, res) => {

    });

app.get('/logout', (req, res)=> {
    req.logout();
    res.redirect('/');
})

app.get('/addproject',isLoggedIn, (req, res)=> {
    res.render("addProject");
})

app.post('/addproject',isLoggedIn, (req, res)=> {

    var newProject = new Project({
        name: req.body.name,
        description: req.body.description
    });

    newProject.author.id = req.user._id;
    newProject.author.username = req.user.username;

    newProject.save((err, project)=> {
        if(err){
            // console.log(err);
        } else{
            // console.log(project);
        }
    })

    res.redirect('/projects');

});

app.get('/project/:id', isLoggedIn , (req, res) => {

    Project.findById(req.params.id, (err, foundProject)=> {
        res.render('projectDetail', {project: foundProject});
    })

})

app.get('/project/:id/issue/add', isLoggedIn, (req, res) => {

    res.render('AddIssue', {projectId: req.params.id});

})

app.get('/project/:id/issue/:issue_id/comment/add', isLoggedIn, (req, res) => {

    res.render('AddComment', {projectId: req.params.id, issueId: req.params.issue_id});

})

app.get('/project/:id/issue', isLoggedIn, (req, res) => {

    Issue.find({}, (err, foundIssue) => {

        Project.findById(req.params.id, (err, foundProject)=> {
            res.render('Issues', {project: foundProject, issues: foundIssue});
        })
        
    })

})

// Updates
app.get('/project/:id/updates', isLoggedIn, (req, res) => {

    Update.find({}, (err, foundUpdate) => {

        Project.findById(req.params.id, (err, foundProject)=> {
            res.render('Updates', {project: foundProject, updates: foundUpdate});
        })
        
    })

})

app.get('/project/:id/update/add', isLoggedIn, (req, res) => {

    res.render('AddUpdate', {projectId: req.params.id});

})

app.post('/project/:id/update', (req, res) => {

    var newUpdate = new Update({
        text: req.body.description
    })
    newUpdate.author.id = req.user._id;
    newUpdate.author.username = req.user.username;
    newUpdate.project.id = req.params.id;

    Project.findById(req.params.id, (err, foundProject)=> {
        newUpdate.project.name = foundProject.name;
    })

    newUpdate.save((err, update)=> {
        if(err){
            // console.log(err);
        } else{
            // console.log(update);
        }
    })

    res.redirect('/project/' + req.params.id + '/updates')
    // res.redirect('back')


})

app.post('/project/:id/issue', (req, res) => {

    var newIssue = new Issue({
        name: req.body.name,
        description: req.body.description
    })
    newIssue.author.id = req.user._id;
    newIssue.author.username = req.user.username;
    newIssue.resolved = false;
    newIssue.project.id = req.params.id;

    Project.findById(req.params.id, (err, foundProject)=> {
        newIssue.project.name = foundProject.name;
    })

    newIssue.save((err, issue)=> {
        if(err){
            // console.log(err);
        } else{
            // console.log(issue);
        }
    })

    res.redirect('/project/' + req.params.id + '/issue')


})

app.post('/project/:id/issue/:issue_id/comment', (req, res) => {

    var newComment = new Comment({
        text: req.body.comment,
    })
    newComment.author.id = req.user._id;
    newComment.author.username = req.user.username;
    newComment.issue.id = req.params.issue_id;

    Issue.findById(req.params.issue_id, (err, foundIssue)=> {
        newComment.issue.name = foundIssue.name;
    })

    newComment.save((err, comment)=> {
        if(err){
            // console.log(err);
        } else{
            // console.log(comment);
        }
    })

    res.redirect('/project/' + req.params.id + '/issue/' + req.params.issue_id)


})

app.get('/project/:id/issue/:issue_id', isLoggedIn, (req, res) => {

    Issue.findById( req.params.issue_id , (err, foundIssue) => {
        Comment.find({}, (err, foundComment) => {
            Project.findById(req.params.id, (err, foundProject)=> {
                User.find({}, (err, foundUsers) => {

                    res.render('issueDetail', {project: foundProject, issue: foundIssue, comments: foundComment, users: foundUsers});
                })
            })
            
        })
    })

})

app.delete('/project/:id/issue/:issue_id', (req, res) => {

    Issue.findByIdAndDelete( req.params.issue_id , (err, data) => {
        if(err){
            // console.log(err);
        } else{
            // console.log(data);
        }
    })

    res.redirect('/project/' + req.params.id + '/issue/' + req.params.issue_id);

})

app.get('/project/:id/issue/:issue_id/edit', (req, res) => {

    Issue.findById( req.params.issue_id , (err, foundIssue) => {
        res.render('editIssue', {projectId: req.params.id, issue: foundIssue});
    })

})

app.put('/project/:id/issue/:issue_id', (req, res) => {

    Issue.findByIdAndUpdate( req.params.issue_id , {name: req.body.name, description: req.body.description} , {new: true} , (err, data) => {
        if(err){
            // console.log(err);
        } else{
            // console.log(data);
        }
    })

    res.redirect('/project/' + req.params.id + '/issue/' + req.params.issue_id);

})

app.put('/project/:id/issue/:issue_id/status', (req, res) => {

    Issue.findById( req.params.issue_id, (err, issue) => {
        if(issue.resolved){
            Issue.findByIdAndUpdate( req.params.issue_id , {resolved: false} , {new: true} , (err, data) => {
                if(err){
                    // console.log(err);
                } else{
                    // console.log(data);
                }
            })
        } else{
            Issue.findByIdAndUpdate( req.params.issue_id , {resolved: true} , {new: true} , (err, data) => {
                if(err){
                    // console.log(err);
                } else{
                    // console.log(data);
                }
            })
        }
    })

    res.redirect('back');

})

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');

}

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Server started at ${port}`);
})