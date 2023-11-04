

var OPEN_WEATHER_MAP_KEY = '0765d2ad7b1d8c3dfe0686d3b69f240b';

const CELSIUS = "Celsius",
	KELVIN = "Kelvin",
	KI_FRIO = "KiFrio",
	KI_CALOR = "KiCalor",
	ERROR_MODAL = "#error-modal",
	MSG_MODAL = "#msg-modal",
	MODE_JSON = "json",
	MODE_XML = "xml";

var unit = CELSIUS;
var response_mode = MODE_XML;
var last_response;

/**
 * Objeto que encapsula dados climáticos.
 */
class Weather {
	constructor() {
		this.locale = null;
		this.temperature = null;
		this.minimum = null;
		this.maximum = null;
		this.description = null;
		this.icon = null;
		this.windSpeed = null;
		this.sunrise = null;
		this.sunset = null;
		this.timeZone = null;
	}

	/**
	 * Método estático para analisar os dados a partir de uma representação XML e criar uma instância Weather.
	 * @param {string} xmlData - Os dados XML a serem analisados.
	 * @returns {Weather} - Uma instância de Weather preenchida com os dados analisados.
	 */
	static parseFromXML(xmlData) {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlData, "text/xml");

		const weather = new Weather();
		weather.locale = xmlDoc.querySelector("city").getAttribute("name");
		weather.temperature = xmlDoc.querySelector("temperature").getAttribute("value");
		weather.minimum = xmlDoc.querySelector("temperature").getAttribute("min");
		weather.maximum = xmlDoc.querySelector("temperature").getAttribute("max");
		weather.description = xmlDoc.querySelector("weather").getAttribute("value");
		weather.icon = xmlDoc.querySelector("weather").getAttribute("icon");
		weather.windSpeed = xmlDoc.querySelector("wind speed").getAttribute("value");
		weather.timeZone = parseInt(xmlDoc.querySelector("timezone").textContent);

		weather.sunrise = new Date(new Date(xmlDoc.querySelector("sun").getAttribute("rise")).getTime() + weather.timeZone * 1000);
		weather.sunset = new Date(new Date(xmlDoc.querySelector("sun").getAttribute("set")).getTime() + weather.timeZone * 1000);

		return weather;
	}

	/**
	 * Método estático para analisar os dados a partir de uma representação JSON e criar uma instância Weather.
	 * @param {string} jsonData - Os dados JSON a serem analisados.
	 * @returns {Weather} - Uma instância de Weather preenchida com os dados analisados.
	 */
	static parseFromJSON(jsonData) {
		const data = JSON.parse(jsonData);

		const weather = new Weather();
		weather.locale = data.name;
		weather.temperature = data.main.temp;
		weather.minimum = data.main.temp_min;
		weather.maximum = data.main.temp_max;
		weather.description = data.weather[0].description;
		weather.icon = data.weather[0].icon;
		weather.windSpeed = data.wind.speed;
		weather.sunrise = new Date(data.sys.sunrise * 1000);
		weather.sunset = new Date(data.sys.sunset * 1000);
		weather.timeZone = data.timezone;

		return weather;
	}

	/**
	 * Obtém a temperatura em Kelvin.
	 * @returns {number} - A temperatura em Kelvin.
	 */
	getKelvinTemperature() {
		return this.temperature;
	}

	/**
	 * Obtém a temperatura convertida de Kelvin para Celsius.
	 * @returns {number} - A temperatura em graus Celsius.
	 */
	getCelsiusTemperature() {
		return Weather.kelvinToCelsius(this.temperature);
	}


	/**
	 * Função para converter a temperatura de Kelvin para Celsius.
	 * @param {number} temperature - A temperatura em Kelvin a ser convertida.
	 * @returns {number} - A temperatura convertida em graus Celsius.
	 */
	static kelvinToCelsius(temperature) {
		return temperature - 273.15;
	}

}

/**
 * Função para enviar uma solicitação HTTP para uma URL e chamar um callback quando a resposta for recebida.
 * @param {string} url - A URL para enviar a solicitação.
 * @param {function} callback - A função de callback a ser chamada após receber a resposta.
 */
function sendRequest(url, callback) {
	let req = new XMLHttpRequest();

	req.onload = function () {
		if (req.status === 200) {
			callback((response_mode == MODE_JSON) ? Weather.parseFromJSON(req.responseText) : Weather.parseFromXML(req.responseText));
		} else {
			document.querySelector("#locale").value = last_response.locale;
			openModal(ERROR_MODAL);
		}
	}

	req.onerror = function () {
		document.querySelector("#locale").value = last_response.locale;
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
	return `https://api.openweathermap.org/data/2.5/weather?q=${locale}&lang=pt_br&mode=${response_mode}&appid=${OPEN_WEATHER_MAP_KEY}`;
}

/**
 * Função para fazer uma solicitação de dados meteorológicos do OpenWeather com base na localização.
 */
function requestOpenWeather() {
	let locale = document.querySelector("#locale").value;
	let url = constructOpenWeatherUrl(locale);

	if (compareStringsIgnoreCase(locale, KI_CALOR)) {
		updateFrontData(createBackup(323));
	} else if (compareStringsIgnoreCase(locale, KI_FRIO)) {
		updateFrontData(createBackup(223));
	} else {
		sendRequest(url, function (resp_obj) {
			if (resp_obj.length == 0) {
				updateFrontData(last_response);
				document.querySelector("#locale").value = last_response.name;
			} else {
				updateFrontData(resp_obj);
				last_response = resp_obj;
			}
		});
	}
}

/**
 * Cria uma cópia de um objeto e atualiza os campos de temperatura com o valor especificado.
 * @param {number} temp - O novo valor de temperatura a ser atribuído aos campos temperature, minimum e maximum do objeto.
 * @returns {object} - Uma cópia do objeto original com os campos de temperatura atualizados.
 */
function createBackup(temp) {
	let bkp = last_response;
	bkp.temperature = temp;
	bkp.minimum = temp;
	bkp.maximum = temp;
	return bkp;
}

/**
 * Função para comparar duas strings, ignorando o caso.
 * @param {string} string1 - A primeira string a ser comparada.
 * @param {string} string2 - A segunda string a ser comparada.
 * @returns {boolean} - True se as strings forem iguais (ignorando o caso), caso contrário, false.
 */
function compareStringsIgnoreCase(string1, string2) {
	return string1.toLowerCase() === string2.toLowerCase();
}

/**
 * Função para alternar entre as unidades de temperatura (Celsius e Kelvin) e atualizar os dados.
 */
function changeTempUnit() {
	unit = (unit == CELSIUS) ? KELVIN : CELSIUS;
	document.querySelector("#temp-unit").textContent = unit;
	updateFrontData(last_response);
}

/**
 * Função para atualizar os dados meteorológicos exibidos na página com base na resposta da API.
 * @param {Object} response - O objeto de resposta da API contendo os dados meteorológicos.
 */
function updateFrontData(weather) {
	let temp = (unit == KELVIN) ? weather.getKelvinTemperature() : weather.getCelsiusTemperature(),
		min = (unit == KELVIN) ? weather.minimum : Weather.kelvinToCelsius(weather.minimum),
		max = (unit == KELVIN) ? weather.maximum : Weather.kelvinToCelsius(weather.maximum),
		animationSpeed = mapValue(weather.getCelsiusTemperature()),
		color = mapColor(weather.getCelsiusTemperature());

	// Temperaturas
	document.querySelector("#temperature").textContent = `${Math.ceil(temp)}°`;
	document.querySelector("#minimum").textContent = `${Math.ceil(min)}°`;
	document.querySelector("#maximum").textContent = `${Math.ceil(max)}°`;

	// Descrição e imagem
	document.querySelector("#weather-description").textContent = capitalizeFirstLetter(weather.description);

	let img = new Image();
	img.src = constructWeatherImageUrl(weather.icon);
	img.onload = function () { document.querySelector("#weather-img").src = img.src; };

	// Vento
	document.querySelector("#wind-speed").textContent = `${Math.ceil(weather.windSpeed * 3.6)} Km/h`;

	// Nascer e pôr do Sol
	document.querySelector("#sunrise").textContent = formatDate(weather.sunrise);
	document.querySelector("#sunset").textContent = formatDate(weather.sunset);

	document.querySelector(':root').style.setProperty('--animation-time', `${animationSpeed}s`);
	document.querySelector(':root').style.setProperty('--animation-color', `${color}`);
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
 * Função para converter um objeto tipo Date para um formato de hora legível (HH:mm).
 * @param {Date} date - O objeto tipo Date.
 * @returns {string} - A hora no formato "HH:mm".
 */
function formatDate(date) {
	return `${standardizerTwoDigitos(date.getHours())}:${standardizerTwoDigitos(date.getMinutes())}`; //Retorno
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
