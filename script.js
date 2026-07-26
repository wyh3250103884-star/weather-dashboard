console.log('API_KEY loaded:', typeof API_KEY !== 'undefined' ? 'yes' : 'NO!', 'length:', API_KEY ? API_KEY.length : 0);

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const errorEl = document.getElementById('error');
const loadingEl = document.getElementById('loading');
const currentWeatherEl = document.getElementById('current-weather');
const forecastEl = document.getElementById('forecast');

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  clearError();
  showLoading(true);
  hideWeather();

  fetchCurrentWeather(city)
    .then((current) => {
      renderCurrentWeather(current);
      const { lat, lon } = current.coord;
      return fetchForecast(lat, lon);
    })
    .then((forecast) => {
      showLoading(false);
      renderForecast(forecast);
    })
    .catch((err) => {
      showLoading(false);
      showError(err.message);
    });
});

async function fetchCurrentWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=imperial`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) throw new Error('City not found. Please check the spelling.');
    if (res.status === 401) throw new Error('Invalid API key. Please check your key in config.js.');
    throw new Error('Failed to fetch weather data.');
  }
  return res.json();
}

async function fetchForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) throw new Error('City not found for forecast.');
    throw new Error(`Forecast API error (HTTP ${res.status}).`);
  }
  return res.json();
}

function renderCurrentWeather(data) {
  document.getElementById('city-name').textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById('current-temp').textContent = Math.round(data.main.temp);
  document.getElementById('weather-desc').textContent = data.weather[0].description;
  document.getElementById('weather-icon').src =
    `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  document.getElementById('weather-icon').alt = data.weather[0].description;
  document.getElementById('humidity').textContent = `${data.main.humidity}%`;
  document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°F`;
  document.getElementById('wind').textContent = `${Math.round(data.wind.speed)} mph`;

  currentWeatherEl.classList.remove('hidden');
}

function renderForecast(data) {
  const daily = groupByDay(data.list);

  const cards = document.getElementById('forecast-cards');
  cards.innerHTML = '';

  daily.slice(0, 5).forEach((day) => {
    const highs = day.entries.map((e) => e.main.temp_max);
    const lows = day.entries.map((e) => e.main.temp_min);
    const high = Math.round(Math.max(...highs));
    const low = Math.round(Math.min(...lows));
    const middayEntry = day.entries[Math.floor(day.entries.length / 2)];

    const card = document.createElement('div');
    card.className = 'forecast-day';
    card.innerHTML = `
      <div class="day-name">${day.name}</div>
      <img src="https://openweathermap.org/img/wn/${middayEntry.weather[0].icon}.png"
           alt="${middayEntry.weather[0].description}">
      <div class="temps">
        <span class="high">${high}°</span>
        <span class="low">${low}°</span>
      </div>
    `;
    cards.appendChild(card);
  });

  forecastEl.classList.remove('hidden');
}

function groupByDay(entries) {
  const days = {};
  entries.forEach((entry) => {
    const date = new Date(entry.dt * 1000);
    const key = date.toDateString();
    if (!days[key]) {
      days[key] = {
        name: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        entries: [],
      };
    }
    days[key].entries.push(entry);
  });
  const result = Object.values(days);
  // Remove today
  if (result.length > 1) result.shift();
  return result;
}

function showLoading(show) {
  loadingEl.classList.toggle('hidden', !show);
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
}

function clearError() {
  errorEl.classList.add('hidden');
}

function hideWeather() {
  currentWeatherEl.classList.add('hidden');
  forecastEl.classList.add('hidden');
}
