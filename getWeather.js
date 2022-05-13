//jshint esversion:8
require("dotenv").config();
// const express = require('express');
// const bodyParser = require('body-parser');
const https = require('https');


exports.getWeather = function(qLocation, detailCall) {

  const url = "https://api.openweathermap.org/data/2.5/weather?q=" + qLocation + "&appid=" + process.env.WEATHER_API_KEY;
// changed var to const
  const weatherDetails = [];

  https.get(url, function(response, err) {

    if (err) {
      console.log(err);
    } else {
      // console.log("function ran");
      response.on("data", function(data) {
        const weatherData = JSON.parse(data);
        // console.log(weatherData);

        const weatherCode = weatherData.weather[0].icon;
        const sunriseTime = weatherData.sys.sunrise;
        const sunsetTime = weatherData.sys.sunset;
        const nowTime = Date.now();


        switch (weatherCode) {
          case "01d":
            bgMovie = "clear-day";
            description = "clear";
            weatherColor = "#e8883a";
            textColor = "#FFFFFF";
            break;
          case "01n":
            bgMovie = "clear-night";
            description = "clear";
            weatherColor = "#101d2e";
            textColor = "#FFFFFF";
            break;
          case "02d":
            bgMovie = "few-scattered-clouds-day";
            description = "cloud";
            weatherColor = "#df735c";
            textColor = "#FFFFFF";
            break;
          case "03d":
            bgMovie = "few-scattered-clouds-day";
            description = "cloud";
            weatherColor = "#df735c";
            textColor = "#FFFFFF";
            break;
          case "02n":
            bgMovie = "few-scattered-clouds-night";
            description = "cloud";
            weatherColor = "#5c98df";
            textColor = "#FFFFFF";
            break;
          case "03n":
            bgMovie = "few-scattered-clouds-night";
            description = "cloud";
            weatherColor = "#5c98df";
            textColor = "#FFFFFF";
            break;
          case "04d":
            bgMovie = "broken-clouds-day";
            description = "cloud";
            weatherColor = "#cbc6b5";
            textColor = "#161617";
            break;
          case "04n":
            bgMovie = "broken-clouds-night";
            description = "cloud";
            weatherColor = "#161617";
            textColor = "#FFFFFF";
            break;
          case "09d":
            bgMovie = "shower-rain";
            description = "rain";
            weatherColor = "#6e5e74";
            textColor = "#FFFFFF";
            break;
          case "09n":
            bgMovie = "shower-rain";
            description = "rain";
            weatherColor = "#6e5e74";
            textColor = "#FFFFFF";
            break;
          case "10d":
            bgMovie = "rain-day";
            description = "rain";
            weatherColor = "#93dfc1";
            textColor = "#161617";
            break;
          case "10n":
            bgMovie = "rain-night";
            description = "rain";
            weatherColor = "#ab93df";
            textColor = "#161617";
            break;
          case "11d":
            bgMovie = "thunderstorm";
            description = "thunderstorm";
            weatherColor = "#5e6579";
            textColor = "#FFFFFF";
            break;
          case "11n":
            bgMovie = "thunderstorm";
            description = "thunderstorm";
            weatherColor = "#5e6579";
            textColor = "#FFFFFF";
            break;
          case "13d":
            bgMovie = "snow";
            description = "snow";
            weatherColor = "#9cc8c4";
            textColor = "#161617";
            break;
          case "13n":
            bgMovie = "snow";
            description = "snow";
            weatherColor = "#9cc8c4";
            textColor = "#161617";
            break;
          default:
            bgMovie = "windy";
            description = "haze";
            weatherColor = "#c3e7e8";
            textColor = "#161617";
        }


        const kelvins = weatherData.main.temp;
        const weatherTemp = Math.round((kelvins - 273.15) * 9 / 5 + 32);
        const weatherDescription = weatherData.weather[0].description;
        const location = weatherData.name;





        if (weatherTemp > 94) {
           tempDescription = "superHot";
        } else if (weatherTemp <= 94 && weatherTemp > 82) {
           tempDescription = "hot";
        } else if (weatherTemp <= 82 && weatherTemp > 75) {
           tempDescription = "warm";
        } else if (weatherTemp <= 75 && weatherTemp > 64) {
           tempDescription = "nice";
        } else if (weatherTemp <= 64 && weatherTemp > 48) {
           tempDescription = "cool";
        } else if (weatherTemp <= 48 && weatherTemp > 32) {
           tempDescription = "cold";
        } else if (weatherTemp <= 32) {
           tempDescription = "freezing";
        } else {
           tempDescription = "nice";
        }
        // console.log(tempDescription);


        const date = new Date();
        const hour = date.getHours();

        if (hour >= 4 && hour < 10) {
          timeOfDay = "breakfast";
        } else if (hour >= 10 && hour < 12) {
          timeOfDay = "snack";
        } else if (hour >= 12 && hour < 15) {
          timeOfDay = "lunch";
        } else if (hour >= 15 && hour < 18) {
          timeOfDay = "snack";
        } else if (hour >= 18 && hour < 23) {
          timeOfDay = "dinner";
        } else if (hour >= 23 || hour >= 3) {
          timeOfDay = "midnightSnack";
        } else {
          console.log("cannot get time of day.");
        }

        console.log(hour);
        console.log(timeOfDay);



        const weatherDs = {
          weatherCode: weatherCode,
          weatherTemp: weatherTemp,
          weatherDescription: weatherDescription,
          bgMovie: bgMovie,
          location: location,
          tempDescription: tempDescription,
          mealTime: timeOfDay,
          description: description,
          weatherColor: weatherColor,
          textColor: textColor,
        };
        weatherDetails.push(weatherDs);
        detailCall(weatherDetails);


      });
    }
  });

  return weatherDetails;
};
