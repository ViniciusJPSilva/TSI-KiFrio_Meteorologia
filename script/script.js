

var OPEN_WEATHER_MAP_KEY = '0765d2ad7b1d8c3dfe0686d3b69f240b';

const CELSIUS = "Celsius",
  KELVIN = "Kelvin";

var unit = CELSIUS;
var last_response;

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
    last_response = resp_obj;
  });
}

function changeTempUnit() {
  unit = (unit == CELSIUS) ? KELVIN : CELSIUS;
  document.querySelector("#temp-unit").textContent = unit;
  update_data(last_response);
}

function update_data(response) {
  let temp = response.main.temp,
    min = response.main.temp_min,
    max = response.main.temp_max,
    animationSpeed = mapValue(kelvinToCelsius(temp)),
    color = mapColor(kelvinToCelsius(temp));

  if (unit == CELSIUS) {
    temp = kelvinToCelsius(temp);
    min = kelvinToCelsius(min);
    max = kelvinToCelsius(max);

  }

  // Temperaturas
  document.querySelector("#temperature").textContent = `${Math.ceil(temp)}°`;
  document.querySelector("#minimum").textContent = `${Math.ceil(min)}°`;
  document.querySelector("#maximum").textContent = `${Math.ceil(max)}°`;

  // Descrição e imagem
  document.querySelector("#weather-description").textContent = capitalizeFirstLetter(response.weather[0].description);

  let img = new Image();
  img.src = constructWeatherImageUrl(response.weather[0].icon);
  img.onload = function () {
    document.querySelector("#weather-img").src = img.src;
  }

  // Vento
  document.querySelector("#wind-speed").textContent = `${Math.ceil(response.wind.speed * 3.6)} Km/h`;

  // Nascer e pôr do Sol
  document.querySelector("#sunrise").textContent = timestampToHour(response.sys.sunrise, response.timezone);
  document.querySelector("#sunset").textContent = timestampToHour(response.sys.sunset, response.timezone);

  document.querySelector(':root').style.setProperty('--animation-time', `${animationSpeed}s`);
  // document.querySelector(':root').style.setProperty('--animation-color', `${color}`);
}

function kelvinToCelsius(temp) {
  return temp - 273.15;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function timestampToHour(timestamp, timeZone) {
  var date = new Date(timestamp * 1000); //Alterando o timestamp para o padrão do JS.
  var hour = date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + timeZone; //Atualizando a hora de acordo com o fuso horário da cidade.

  if (hour < 0) hour += 24 * 3600; //Ajustando o horário caso ocorra a diferença de um dia.

  var minutes = (hour % 3600) / 60; //Obtendo os minutos.
  var hour = Math.trunc(hour / 3600); //Obtendo as horas.

  return `${standardizerTwoDigitos(hour)}:${standardizerTwoDigitos(minutes)}`; //Retorno
}

function standardizerTwoDigitos(value) {
  return (value <= 9) ? '0' + value : value;
}

function constructWeatherImageUrl(imageCode) {
  return `https://openweathermap.org/img/wn/${imageCode}@2x.png`
}

function mapValue(value) {
  if (value >= -10 && value <= 35) {
    return 1 + (10 - 1) * (1 - value / 35);;
  } else if(value < -10) {
    return 100;
  } else {
    return 0.5;
  }
}

function mapColor(value) {
  if (value < 0) {
    value = 0;
  } else if (value > 35) {
    value = 35;
  }

  const blue = [0, 0, 255];      
  const red = [255, 0, 0];       

  const factor = value / 35;     

  const mappedColor = [
    Math.round(blue[0] + (red[0] - blue[0]) * factor),
    Math.round(blue[1] + (red[1] - blue[1]) * factor),
    Math.round(blue[2] + (red[2] - blue[2]) * factor)
  ];

  return `rgb(${mappedColor[0]}, ${mappedColor[1]}, ${mappedColor[2]})`;
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
