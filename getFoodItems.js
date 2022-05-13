//jshint esversion:8
// FoodItem.find({name:"john"}, function(err, foods) {


const mongoose = require('mongoose');


const inedibleList = [];
let foodCheck = "";
const foodCheckList = [];
const personalFoodList = [];



// shuffle function
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}



async function checkFood(homeFoodItem, userDiet, weatherDetails) {

  let ediblePromise = new Promise(function(resolve) {
    let edible = true;
    let i = 0;

    while (edible === true && userDiet[i]) {
      if (homeFoodItem.contains.includes(userDiet[i])) {
        // console.log("bad food");
        edible = false;
      } else {
        i++;
      }
    }

    resolve(edible);
  });

  await ediblePromise ? weatherCheck(homeFoodItem, weatherDetails) : inedibleList.push(homeFoodItem);
}



function weatherCheck(homeFoodItem, weatherDetails) {
  // console.log("weatherCheck");
  if (homeFoodItem.mealName.includes(weatherDetails[0].mealTime) && homeFoodItem.mealWeather.includes(weatherDetails[0].description) && homeFoodItem.mealTemp.includes(weatherDetails[0].tempDescription)) {
    // console.log("pushing food item");
    personalFoodList.push(homeFoodItem);
  }
}



exports.homeFoods = function(weatherDetails, user, FoodItem, rendHome) {


  const userDiet = user.dietRestrictions;


  FoodItem.find({}, function(err, foods) {
    // console.log(foods);
    if (err) {
      console.log("into err");
      console.log(err);

    } else {

      // console.log("checkpoint no error");

      foods.forEach((homeFoodItem) => {

        if (userDiet.length > 0) {
          // console.log("checking food");
          checkFood(homeFoodItem, userDiet, weatherDetails);
        } else {
          weatherCheck(homeFoodItem, weatherDetails);
        }
      });

      setTimeout(function() {
        // console.log("personal food list moment");
        // console.log(personalFoodList);
        shuffleArray(personalFoodList);
        // console.log(personalFoodList);

        rendHome(weatherDetails, personalFoodList);
      }, 100);

    }


  });


};


exports.anonHomeFoods = function(weatherDetails, FoodItem, rendAnonHome) {

  const anonFoodList = [];

  FoodItem.find({}, function(err, foods) {
    if (err) {
      console.log("into err");
      console.log(err);
    } else {
      foods.forEach((anonFoodItem) => {
        if (anonFoodItem.mealName.includes(weatherDetails[0].mealTime) && anonFoodItem.mealWeather.includes(weatherDetails[0].description) && anonFoodItem.mealTemp.includes(weatherDetails[0].tempDescription)) {
          anonFoodList.push(anonFoodItem);
        } else {
          // do nothing
        }
      });

      // console.log(anonFoodList);
      shuffleArray(anonFoodList);

      rendAnonHome(weatherDetails, anonFoodList);
    }
  });

};





exports.profileFoods = function(user, FoodItem, rendProf) {

  const favoriteFoodList = [];
  const submittedFoodList = [];

  FoodItem.find({}, function(err, profFoods) {
    if (err) {
      console.log(err);
    } else {

      profFoods.forEach(favFoodItem => {
        if (user.favorites.includes(favFoodItem._id)) {
          favoriteFoodList.push(favFoodItem);
        } else {
          // do nothing
        }
      });

      profFoods.forEach(subFoodItem => {
        if (user.suggestions.includes(subFoodItem._id)) {
          submittedFoodList.push(subFoodItem);
        } else {
          // do nothing
        }
      });

    }
    rendProf(favoriteFoodList, submittedFoodList);

  });



};
