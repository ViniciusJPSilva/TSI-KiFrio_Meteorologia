

var OPEN_WEATHER_MAP_KEY = '0765d2ad7b1d8c3dfe0686d3b69f240b';

const CELSIUS = "Celsius",
  KELVIN = "Kelvin",
  KI_FRIO = "KiFrio",
  KI_CALOR = "KiCalor",
  ERROR_MODAL = "#error-modal",
  MSG_MODAL = "#msg-modal";

var unit = CELSIUS;
var last_response;

/**
 * Função para enviar uma solicitação HTTP para uma URL e chamar um callback quando a resposta for recebida.
 * @param {string} url - A URL para enviar a solicitação.
 * @param {function} callback - A função de callback a ser chamada após receber a resposta.
 */
function sendRequest(url, callback) {
  let req = new XMLHttpRequest();

  req.onload = function () {
    if (req.status === 200) {
      let resp = req.responseText;
      let resp_obj = JSON.parse(resp);
      callback(resp_obj);
    } else {
      document.querySelector("#locale").value = last_response.name;
      openModal(ERROR_MODAL);
    }
  }

  req.onerror = function () {
    document.querySelector("#locale").value = last_response.name;
    openModal(ERROR_MODAL);
  }

  req.open("GET", url);
  req.send(null);
}

/**
 * Função para construir a URL da API do OpenWeather com base na localização.
 * @param {string} locale - A localização para a qual a URL deve ser construída.
 * @returns {string} - A URL da API do OpenWeather.
 */
function constructOpenWeatherUrl(locale) {
  return `https://api.openweathermap.org/data/2.5/weather?q=${locale}&lang=pt_br&appid=${OPEN_WEATHER_MAP_KEY}`;
}

/**
 * Função para fazer uma solicitação de dados meteorológicos do OpenWeather com base na localização.
 */
function requestOpenWeather() {
  let locale = document.querySelector("#locale").value;
  let url = constructOpenWeatherUrl(locale);

  if (compareStringsIgnoreCase(locale, KI_CALOR)) {
    let bkp = last_response;
    bkp.main.temp = 323;
    bkp.main.temp_min = 323;
    bkp.main.temp_max = 323;
    update_data(bkp);
  } else if (compareStringsIgnoreCase(locale, KI_FRIO)) {
    let bkp = last_response;
    bkp.main.temp = 223;
    bkp.main.temp_min = 223;
    bkp.main.temp_max = 223;
    update_data(bkp);
  } else {
    sendRequest(url, function (resp_obj) {
      if (resp_obj.length == 0) {
        update_data(last_response);
        document.querySelector("#locale").value = last_response.name;
      } else {
        update_data(resp_obj);
        last_response = resp_obj;
      }
    });
  }
}

/**
 * Função para comparar duas strings, ignorando o caso.
 * @param {string} str1 - A primeira string a ser comparada.
 * @param {string} str2 - A segunda string a ser comparada.
 * @returns {boolean} - True se as strings forem iguais (ignorando o caso), caso contrário, false.
 */
function compareStringsIgnoreCase(str1, str2) {
  return str1.toLowerCase() === str2.toLowerCase();
}

/**
 * Função para alternar entre as unidades de temperatura (Celsius e Kelvin) e atualizar os dados.
 */
function changeTempUnit() {
  unit = (unit == CELSIUS) ? KELVIN : CELSIUS;
  document.querySelector("#temp-unit").textContent = unit;
  update_data(last_response);
}

/**
 * Função para atualizar os dados meteorológicos exibidos na página com base na resposta da API.
 * @param {Object} response - O objeto de resposta da API contendo os dados meteorológicos.
 */
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
  document.querySelector(':root').style.setProperty('--animation-color', `${color}`);
}

/**
 * Função para converter a temperatura de Kelvin para Celsius.
 * @param {number} temp - A temperatura em Kelvin a ser convertida.
 * @returns {number} - A temperatura convertida em graus Celsius.
 */
function kelvinToCelsius(temp) {
  return temp - 273.15;
}

/**
 * Função para capitalizar a primeira letra de uma string.
 * @param {string} string - A string a ser capitalizada.
 * @returns {string} - A string com a primeira letra em maiúscula.
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Função para converter um carimbo de data e hora em um formato de hora legível, levando em consideração o fuso horário.
 * @param {number} timestamp - O carimbo de data e hora UNIX.
 * @param {number} timeZone - O deslocamento de fuso horário em segundos.
 * @returns {string} - A hora no formato "HH:mm".
 */
function timestampToHour(timestamp, timeZone) {
  var date = new Date(timestamp * 1000); //Alterando o timestamp para o padrão do JS.
  var hour = date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + timeZone; //Atualizando a hora de acordo com o fuso horário da cidade.

  if (hour < 0) hour += 24 * 3600; //Ajustando o horário caso ocorra a diferença de um dia.

  var minutes = (hour % 3600) / 60; //Obtendo os minutos.
  var hour = Math.trunc(hour / 3600); //Obtendo as horas.

  return `${standardizerTwoDigitos(hour)}:${standardizerTwoDigitos(minutes)}`; //Retorno
}

/**
 * Função para padronizar um número para ter dois dígitos, adicionando um zero à esquerda, se necessário.
 * @param {number} value - O número a ser padronizado.
 * @returns {string} - O número padronizado como uma string.
 */
function standardizerTwoDigitos(value) {
  return (value <= 9) ? '0' + value : value;
}

/**
 * Função para construir a URL da imagem do tempo com base no código de imagem fornecido pela API do OpenWeather.
 * @param {string} imageCode - O código de imagem fornecido pela API do OpenWeather.
 * @returns {string} - A URL da imagem do tempo.
 */
function constructWeatherImageUrl(imageCode) {
  return `https://openweathermap.org/img/wn/${imageCode}@2x.png`
}

/**
 * Função para mapear um valor de temperatura para um valor de velocidade de animação.
 * @param {number} value - O valor de temperatura a ser mapeado.
 * @returns {number} - O valor mapeado para a velocidade de animação.
 */
function mapValue(value) {
  if (value >= -10 && value <= 35) {
    return 0.3 + (50 - 0.3) * (1 - (value + 10) / 45);
  } else if (value < -10) {
    return 200;
  } else {
    return 0.2;
  }
}

/**
 * Função para mapear um valor de temperatura para uma cor associada.
 * @param {number} value - O valor de temperatura a ser mapeado.
 * @returns {string} - A cor associada ao valor de temperatura.
 */
function mapColor(value) {
  const cores = ["#00e5ff", "#1fdce2", "#3dd2c4", "#5cc9a6", "#6cc598", "#92b973", "#92b973", "#b7ac4d", "#d5a22f", "#f39811"];

  if (value < -10) {
    return "#a0f6ff";
  } else if (value >= 35) {
    return "#FF0000";
  }

  return cores[Math.floor((value + 10) / 45 * cores.length)];
}

/**
 * Função para inicializar os componentes Materialize no momento em que o documento é carregado.
 */
document.addEventListener('DOMContentLoaded', function () {
  M.AutoInit();
  openModal(MSG_MODAL);
});

/**
 * Função para abrir um modal de erro.
 */
function openModal(id) {
  var modal = document.querySelector(id);
  var instance = M.Modal.init(modal, {});
  instance.open(); 
}

/**
 * Função para obter a cidade da localização do usuário usando uma solicitação AJAX.
 * @param {function} callback - A função de callback a ser chamada com o nome da cidade.
 */
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

/**
 * Função de callback para atualizar a cidade na entrada de localização e solicitar dados meteorológicos.
 * @param {string} city - O nome da cidade detectado pela função getLocationCity.
 */
getLocationCity(function (city) {
  document.querySelector("#locale").setAttribute('value', city);
  requestOpenWeather();
});
