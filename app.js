//jshint esversion:8
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

// import mods
const date = require(__dirname + '/date.js');
const getWeather = require(__dirname + '/getWeather.js');
const getFoodItems = require(__dirname + "/getFoodItems.js");

const https = require('https');

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

// for local passport
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {}
}));

app.use(passport.initialize());
app.use(passport.session());

// connect to Mongoose
mongoose.connect("mongodb+srv://ScarlettAdmin:" + process.env.MONPASS +"@cluster0.rxqdw.mongodb.net/"+ process.env.MONDBNAME +"?retryWrites=true&w=majority");


// Schema for user
const eatUserSchema = new mongoose.Schema({
  fName: String,
  lName: String,
  username: String,
  email: String,
  picture: String,
  password: String,
  setLocation: String,
  displayName: String,
  googleId: String,
  secret: String,
  favorites: [],
  dietRestrictions: [],
  suggestions: [],
  blockList: [],
});


// Schema for food suggestions
const foodItemSchema = new mongoose.Schema({
  foodTitle: String,
  foodAccomp: String,
  numOfLikes: Number,
  mealName: [],
  mealWeather: [],
  mealTemp: [],
  contains: [],
  suggestedBy: String,
  submitAnon: Boolean,
  website: String,
  websiteName: String,
});


// plugin to use passport local mongoose for users
eatUserSchema.plugin(passportLocalMongoose);


// set consts to mongoose models
const EatUser = new mongoose.model("eatUser", eatUserSchema);
const FoodItem = new mongoose.model("foodItem", foodItemSchema);


// create a local strategy
passport.use(EatUser.createStrategy());


// serialize and deserialize for cookies
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  EatUser.findById(id, function(err, user) {
    done(err, user);
  });
});

// set up google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://secret-mesa-19646.herokuapp.com/auth/google/w2Eat",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    EatUser.findOne({
      googleId: profile.id
    }, function(err, user) {
      if (err) {
        console.log(err);
      } else {
        if (!user) {
          EatUser.create({
            googleId: profile.id,
            fName: profile.name.givenName,
            lName: profile.name.familyName,
            username: profile.emails[0].value,
            picture: profile.photos[0].value,
            setLocation: "",
            displayName: "",
            favorites: [],
            dietRestrictions: [],
            suggestions: [],
          });
          return cb(err, user);
        } else {
          return cb(err, user);
        }
      }
    });
  }
));

const year = date.year();
console.log(year);


// auth routes

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["openid", "profile", "email"]
  })
);

app.get("/auth/google/w2Eat",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    res.redirect("/");
  });


//
// Routes Start
//


// root route. checks if user is logged in. redirects to userHome or loggedOutLocation
app.route("/")
  .get(function(req, res) {
    if (req.user) {
      res.redirect("/userHome");
    } else {
      res.redirect("/loggedOutLocation");
    }
  });


// userHome route. uses logged in user's unique displayname to check user's diet restrictions against array created by weather in (either) setLocation
// (or renders user location to request a location) and time of day.

// need- add ability to push object to user favorites and delete.
// need- add ability to block suggestion. adds to user blocked array.
// need- post: to allow user to change location without changing setLocation.
app.route("/userHome")
  .get(function(req, res) {
    const displayName = req.user.displayName;

    function receiveFoodItems(weatherDetails) {
      const user = req.user;
      getFoodItems.homeFoods(weatherDetails, user, FoodItem, rendHome);
    }

    function rendHome(weatherDetails, personalFoodList) {
      res.render("user-home", {
        bgMovie: weatherDetails[0].bgMovie,
        timeOfDay: timeOfDay,
        location: weatherDetails[0].location,
        temp: weatherDetails[0].weatherTemp,
        description: weatherDetails[0].weatherDescription,
        weatherColor: weatherDetails[0].weatherColor,
        textColor: weatherDetails[0].textColor,
        foodList: personalFoodList,
        i: 0,
        displayName: displayName,
      });
    }
    if (req.user.setLocation) {
      const qLocation = req.user.setLocation;
      getWeather.getWeather(qLocation, receiveFoodItems);
    } else {
      res.render("user-location");
    }
  })
  .post(function(req, res) {
    // document.getElementById("heartButton").src="Images/icons/full-heart.png";
    // console.log("got clicked");
  });


// loggedOutLocation Route. renders loggedOutLocation to request anon user location. Creates array based on weather at chosen location and time of day.
app.route("/loggedOutLocation")
  .get(function(req, res) {
    res.render("lo-location");
  })
  .post(function(req, res) {
    // console.log(req.body.qLocation);

    function receiveAnonFoodItems(weatherDetails) {
      getFoodItems.anonHomeFoods(weatherDetails, FoodItem, rendAnonHome);
    }

    function rendAnonHome(weatherDetails, anonFoodList) {
      res.render("lo-home", {
        bgMovie: weatherDetails[0].bgMovie,
        timeOfDay: timeOfDay,
        location: weatherDetails[0].location,
        temp: weatherDetails[0].weatherTemp,
        description: weatherDetails[0].weatherDescription,
        weatherColor: weatherDetails[0].weatherColor,
        textColor: weatherDetails[0].textColor,
        foodList: anonFoodList,
        i: 0,
        // ii: ii,
        // iii: iii,
      });
    }
    const qLocation = req.body.qLocation;
    getWeather.getWeather(qLocation, receiveAnonFoodItems);
  });



//userLocation. Logged in user is sent here if no location is set.
// Creates array based on weather at chosen location and time of day.

app.route("/userLocation")
  .get(function(req, res) {
    res.render("user-location");
  })
  .post(function(req, res) {

    let displayName;

    if (!req.user.displayName){
      displayName = req.user.fName;
    } else {
      displayName = req.user.displayName;
    }


    function receiveFoodItems(weatherDetails) {
      const user = req.user;
      getFoodItems.homeFoods(weatherDetails, user, FoodItem, rendHome);
    }


    function rendHome(weatherDetails, personalFoodList) {
      res.render("user-home", {
        bgMovie: weatherDetails[0].bgMovie,
        timeOfDay: timeOfDay,
        location: weatherDetails[0].location,
        temp: weatherDetails[0].weatherTemp,
        description: weatherDetails[0].weatherDescription,
        weatherColor: weatherDetails[0].weatherColor,
        textColor: weatherDetails[0].textColor,
        foodList: personalFoodList,
        i: 0,
        displayName: displayName,
      });
    }
    const qLocation = req.body.qLocation;
    getWeather.getWeather(qLocation, receiveFoodItems);
  });




// register Route.  Allows user to create an account with website or with google.
// need- when making account with google: must sign in again.

// need- send error messages
app.route("/register")
  .get(function(req, res) {
    res.render("register");
  })
  .post(function(req, res, next) {

    newDietRestrictions = [];
    console.log(req.body);
    console.log(req.body.dietRestrictions);
    console.log(req.body.dietRestrictions.length);

    if (req.body.dietRestrictions.length > 0) {
      req.body.dietRestrictions.forEach((dietItem, i) => {
        newDietRestrictions.push(dietItem);
      });
    } else {
      // do nothing
    }

    console.log('registering user');
    EatUser.register({
      username: req.body.email
    }, req.body.password, function(err, user) {
      if (err) {
        console.log("Error: " + err);
        res.render("register", {
          message: "There was an error creating your account, please try again."
        });
      } else {
        const newUserAdd = {
          fName: req.body.fName,
          lName: req.body.lName,
          setLocation: req.body.setLocation,
          displayName: req.body.displayName,
          dietRestrictions: newDietRestrictions,
          email: req.body.email,
        };
        EatUser.updateOne({
            _id: user._id
          }, newUserAdd,
          function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log("updated user");
              res.redirect("/login");
            }
          }
        );
      }
    });
  });


// Login Route. checks to see if logged in user, sends to profile. Logeed out, to log in form. Can log in locally. Google button directs user to auth routes.
app.route("/login")
  .get(function(req, res) {
    if (req.user) {
      res.redirect("/");
    } else {
      res.render("login");
    }
  })
  .post(passport.authenticate("local"),
    function(req, res) {
      res.redirect("/");
    });



// saved route: displays users favorites, submitted items, and block list
// need- ability to delete suggestions and/or remove from users favorites.
app.route("/saved")
  .get(function(req, res) {
    function rendProf(favoriteFoodList, submittedFoodList) {
      res.render("saved", {
        fName: req.user.fName,
        lName: req.user.lName,
        photo: req.user.picture,
        displayName: req.user.displayName,
        username: req.user.username,
        setLocation: req.user.setLocation,
        diet: req.user.dietRestrictions,
        suggestions: submittedFoodList,
        favorites: favoriteFoodList,
      });
    }
    if (req.user) {
      const user = req.user;
      const body = req.body;
      getFoodItems.profileFoods(user, FoodItem, rendProf);
    } else {
      res.redirect("/login");
    }
  })
  .post(function(req, res) {

  });


  // edit profile route. checks if user logged in, renders edit profile, with values = current value.
  // if logged out sends to login. nothing on site links to profile before logging in - in case of bookmarks.
  // post route: for edit profile
  // need- current diet restrictions = checked boxes.  How 2 add "checked" to restriction boxes



app.route("/edit-profile")
  .get(function(req, res) {

    if (req.user){
      res.render("edit-profile", {
        fName: req.user.fName,
        lName: req.user.lName,
        displayName: req.user.displayName,
        email: req.user.email,
        username: req.user.email,
        setLocation: req.user.setLocation,
        dietRestrictions: req.user.dietRestrictions,
      });
    } else {
      res.redirect("/login");
    }

  })
  .post(function(req, res) {

    newDietRestrictions = [];

    if (req.body.dietRestrictions.length > 0) {
      req.body.dietRestrictions.forEach((dietItem, i) => {
        newDietRestrictions.push(dietItem);
      });
    } else {
      // do nothing
    }

    console.log(req.body);
    EatUser.update({
      _id: req.user._id
    }, {
      fName: req.body.fName,
      lName: req.body.lName,
      displayName: req.body.displayName,
      setLocation: req.body.location,
      email: req.user.email,
      username: req.user.email,
      dietRestrictions: newDietRestrictions,
    }, function(err) {
      if (err) {
        console.log(err);
      } else {
        req.user.save();
        res.redirect("/");
      }
    });
  });


// submit route.  allows logged in users to submit food. Saves to suggested and favorites arrays.
// write function to translate when to eat to temp and weather.
app.route("/submit")
  .get(function(req, res) {
    if (req.user) {

      let displayName;

      if (!req.user.displayName){
        displayName = req.user.fName;
      } else {
        displayName = req.user.displayName;
      }

      res.render("submit", {
        displayName: displayName,
      });
    } else {
      res.render("register");
    }
  })
  .post(function(req, res) {

    let displayName;

    if (!req.user.displayName){
      displayName = req.user.fName;
    } else {
      displayName = req.user.displayName;
    }

    let mealWeather = ["clear", "cloud", "rain", "thunderstorm", "snow", "windy"];

    const food = new FoodItem({
      foodTitle: req.body.foodTitle,
      foodAccomp: req.body.foodAccomp,
      numOfLikes: 1,
      mealName: req.body.mealName,
      mealWeather: mealWeather,
      mealTemp: req.body.mealTemp,
      contains: req.body.dietRestrict,
      suggestedBy: req.user.displayName,
      website: req.body.website,
      websiteName: req.body.websiteName,
      displayName: displayName,
    });
    food.save();
    const id = food._id;
    const favUser = req.user.favorites;
    const sugUser = req.user.suggestions;
    favUser.push(id);
    sugUser.push(id);
    req.user.save();
    res.render("success", {
      displayName: displayName,
    });
  });


// Create Saved route


// contact route.
// need- contact form. create mailto
app.route("/contact")
  .get(function(req, res) {
    res.render("contact");
  })
  .post(function(req, res) {

  });

// about route.
// need- write about section.
app.get("/about", function(req, res) {
  res.render("about");
});

// legal routes
// need- buy legal write up.
app.get("/legal", function(req, res) {
  res.render("legal");
});

// 404 route. nothing redirects to 404 at the moment.
app.get("/404", function(req, res) {
  res.render("404");
});

// logout route. directs user to root route after log out.
// need- error handling
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect('/');
});




// start server on heroku or local 3000.
app.listen(process.env.PORT || 3000, function(req, res) {
  console.log("W2eat is live!");
});
