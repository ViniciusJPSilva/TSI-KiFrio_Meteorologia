

var OPEN_WEATHER_MAP_KEY = '0765d2ad7b1d8c3dfe0686d3b69f240b';

function sendRequest(url, callback) {
  let req = new XMLHttpRequest();

  req.onload = function () {
    let resp = req.responseText;
    let resp_obj = JSON.parse(resp);
    callback(resp_obj);
  }

  req.onerror = function () {
    console.log("Erro na requisição.");
  }

  req.open("GET", url);
  req.send(null);
}

function constructOpenWeatherUrl(locale) {
  return `https://api.openweathermap.org/data/2.5/weather?q=${locale}&lang=pt_br&appid=${OPEN_WEATHER_MAP_KEY}`;
}

function requestOpenWeather() {
  let locale = document.querySelector("#locale").value;
  let url = constructOpenWeatherUrl(locale);

  sendRequest(url, function (resp_obj) {
    if (resp_obj.length == 0)
      console.log("Erro na requisição.");
    else
      update_data(resp_obj);
  });
}

function update_data(response) {
  document.querySelector("#temperature").textContent = `${Math.ceil((response.main.temp - 273.15))}°`;
}

function getLocationCity(callback) {
  $.ajax({
    url: "https://geolocation-db.com/jsonp",
    jsonpCallback: "callback",
    dataType: "jsonp",
    success: function (location) {
      callback(location.city);
    },
    error: function () {
      callback("Nova Iorque");
    }
  });
}

getLocationCity(function (city) {
  document.querySelector("#locale").setAttribute('value', city);
  requestOpenWeather();
});
