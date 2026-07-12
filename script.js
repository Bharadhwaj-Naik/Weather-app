(function () {
  // ---------- API configuration ----------
  const API_KEY = 'bd5e378503939ddaee76f12ad7a97608'; // OpenWeatherMap free API key
  const BASE_URL = 'https://api.openweathermap.org/data/2.5';

  // DOM elements
  const cityInput = document.getElementById('cityInput');
  const searchBtn = document.getElementById('searchBtn');
  const historyTagsDiv = document.getElementById('historyTags');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const currentCard = document.getElementById('currentCard');
  const cityDisplay = document.getElementById('cityDisplay');
  const countryBadge = document.getElementById('countryBadge');
  const currentDate = document.getElementById('currentDate');
  const humiditySpan = document.getElementById('humidity');
  const windSpan = document.getElementById('wind');
  const currentWeatherIcon = document.getElementById('currentWeatherIcon');
  const currentTemp = document.getElementById('currentTemp');
  const descriptionSpan = document.getElementById('description');
  const forecastGrid = document.getElementById('forecastGrid');
  const errorBox = document.getElementById('errorBox');

  // ---------- Search history management (localStorage) ----------
  const STORAGE_KEY = 'weather_dashboard_history';

  function getSearchHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) { }
    return [];
  }

  function saveSearchHistory(historyArray) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historyArray));
  }

  function addCityToHistory(cityName) {
    if (!cityName) return;
    const trimmed = cityName.trim();
    let history = getSearchHistory();
    // Remove duplicate if exists, then add to front
    history = history.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
    history.unshift(trimmed);
    // Keep max 8 items
    if (history.length > 8) history.pop();
    saveSearchHistory(history);
    renderHistoryTags();
  }

  function removeCityFromHistory(cityName) {
    let history = getSearchHistory();
    history = history.filter(item => item.toLowerCase() !== cityName.toLowerCase());
    saveSearchHistory(history);
    renderHistoryTags();
  }

  function clearAllHistory() {
    saveSearchHistory([]);
    renderHistoryTags();
  }

  function renderHistoryTags() {
    const history = getSearchHistory();
    historyTagsDiv.innerHTML = '';
    if (history.length === 0) {
      historyTagsDiv.innerHTML = '<span style="color: #a0b9da; font-size:0.85rem; opacity:0.8;">No recent searches</span>';
      return;
    }
    history.forEach(city => {
      const badge = document.createElement('span');
      badge.className = 'history-badge';
      badge.innerHTML = `${city} <i class="fas fa-times" style="margin-left:2px;"></i>`;
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        // If click on the cross icon area remove, else search that city
        if (e.target.classList.contains('fa-times')) {
          removeCityFromHistory(city);
        } else {
          // search that city
          cityInput.value = city;
          fetchWeatherByCity(city);
        }
      });
      historyTagsDiv.appendChild(badge);
    });
  }



  // ---------- Weather icon mapping (Font Awesome) ----------
  function getWeatherIcon(iconCode, isLarge = false) {
    const code = iconCode ? iconCode.substring(0, 2) : '01';
    const iconMap = {
      '01': 'fa-sun',            // clear sky
      '02': 'fa-cloud-sun',      // few clouds
      '03': 'fa-cloud',          // scattered clouds
      '04': 'fa-cloud',          // broken clouds
      '09': 'fa-cloud-showers-heavy', // shower rain
      '10': 'fa-cloud-rain',     // rain
      '11': 'fa-bolt',           // thunderstorm
      '13': 'fa-snowflake',      // snow
      '50': 'fa-smog'            // mist
    };
    return iconMap[code] || 'fa-cloud-sun';
  }

  function formatDate(timestamp, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', options);
  }

  function displayError(message) {
    errorBox.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
    // hide current card if error
    currentCard.style.display = 'none';
    forecastGrid.innerHTML = '';
  }

  function clearError() {
    errorBox.innerHTML = '';
  }

  // ---------- Fetch current weather + 5-day forecast ----------
  async function fetchWeatherByCity(city) {
    if (!city || city.trim() === '') {
      displayError('Please enter a city name.');
      return;
    }
    clearError();
    // Show minimal loading state
    currentCard.style.display = 'none';
    forecastGrid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-pulse"></i> Loading forecast...</div>';

    try {
      // 1. Current weather
      const currentResp = await fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`);
      if (!currentResp.ok) {
        const errData = await currentResp.json().catch(() => null);
        throw new Error(errData?.message || `City not found (${currentResp.status})`);
      }
      const currentData = await currentResp.json();

      // 2. 5-day / 3-hour forecast (free API returns 5 days with 3h steps)
      const forecastResp = await fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`);
      if (!forecastResp.ok) {
        throw new Error('Unable to fetch forecast data.');
      }
      const forecastData = await forecastResp.json();

      // Update UI with current weather
      updateCurrentWeather(currentData);
      // Update forecast (pick one representative per day)
      updateForecast(forecastData);

      // Add to history
      addCityToHistory(currentData.name);
      // Optionally clear input
      cityInput.value = '';
    } catch (error) {
      console.error(error);
      displayError(error.message || 'Failed to get weather data.');
      forecastGrid.innerHTML = '';
    }
  }

  function updateCurrentWeather(data) {
    if (!data || !data.main) return;
    const city = data.name;
    const country = data.sys?.country || '';
    const temp = Math.round(data.main.temp);
    const humidity = data.main.humidity;
    const windSpeed = data.wind?.speed ?? 0;
    const description = data.weather?.[0]?.description || '';
    const iconCode = data.weather?.[0]?.icon || '01d';
    const dt = data.dt;

    cityDisplay.textContent = city;
    countryBadge.textContent = country ? `(${country})` : '';
    currentDate.textContent = formatDate(dt, { weekday: 'long', month: 'short', day: 'numeric' });
    humiditySpan.textContent = humidity;
    windSpan.textContent = windSpeed;
    currentTemp.textContent = temp;
    descriptionSpan.textContent = description.charAt(0).toUpperCase() + description.slice(1);

    // Set large weather icon
    const iconClass = getWeatherIcon(iconCode);
    currentWeatherIcon.className = `weather-icon-lg fas ${iconClass}`;

    currentCard.style.display = 'flex';
  }

  function updateForecast(forecastData) {
    forecastGrid.innerHTML = '';
    if (!forecastData || !forecastData.list) {
      forecastGrid.innerHTML = '<div style="color:#ccc;">No forecast available</div>';
      return;
    }

    // Group forecast by date (YYYY-MM-DD) and pick one closest to midday (12:00)
    const dailyMap = new Map();

    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const hour = date.getHours();

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, item);
      } else {
        const existingItem = dailyMap.get(dateKey);
        const existingHour = new Date(existingItem.dt * 1000).getHours();
        // Prefer item closer to 12:00
        if (Math.abs(hour - 12) < Math.abs(existingHour - 12)) {
          dailyMap.set(dateKey, item);
        }
      }
    });

    // Convert to array and sort by date
    const dailyEntries = Array.from(dailyMap.values()).sort((a, b) => a.dt - b.dt);

    // Take up to 5 days (including today if present, but we usually show next days)
    const todayKey = new Date().toISOString().split('T')[0];
    let forecastDays = dailyEntries.filter(entry => {
      const entryDate = new Date(entry.dt * 1000).toISOString().split('T')[0];
      return entryDate !== todayKey; // skip today to show future 5 days
    }).slice(0, 5);

    // If we don't have 5 future days, fill with remaining from today (edge case)
    if (forecastDays.length < 5) {
      const remaining = dailyEntries.filter(entry => {
        const entryDate = new Date(entry.dt * 1000).toISOString().split('T')[0];
        return entryDate === todayKey;
      }).slice(0, 5 - forecastDays.length);
      forecastDays = [...forecastDays, ...remaining];
    }

    if (forecastDays.length === 0) {
      forecastGrid.innerHTML = '<div style="color:#ccc;">Not enough forecast data.</div>';
      return;
    }

    forecastDays.forEach(day => {
      const dt = day.dt;
      const temp = Math.round(day.main.temp);
      const iconCode = day.weather?.[0]?.icon || '01d';
      const description = day.weather?.[0]?.description || '';
      const dateObj = new Date(dt * 1000);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const card = document.createElement('div');
      card.className = 'forecast-card';
      card.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div style="font-size:0.7rem; color:#b0c6e0;">${monthDay}</div>
            <div class="forecast-icon"><i class="fas ${getWeatherIcon(iconCode)}"></i></div>
            <div class="forecast-temp">${temp}°C</div>
            <div style="font-size:0.7rem; text-transform:capitalize; color:#ccdbe9;">${description}</div>
          `;
      forecastGrid.appendChild(card);
    });
  }


  // ---------- Event Listeners ----------
  searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
      fetchWeatherByCity(city);
    } else {
      displayError('Enter a city name.');
    }
  });

  cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const city = cityInput.value.trim();
      if (city) {
        fetchWeatherByCity(city);
      } else {
        displayError('Enter a city name.');
      }
    }
  });

  clearHistoryBtn.addEventListener('click', () => {
    clearAllHistory();
  });

  // Initial render of history tags
  renderHistoryTags();

  // Optional: Auto-load last searched city if history exists (nice touch)
  const history = getSearchHistory();
  if (history.length > 0) {
    // Pre-fill input but don't auto-search to respect user
    cityInput.value = history[0];
    // Uncomment next line if you want auto-search on page load:
    // fetchWeatherByCity(history[0]);
  } else {
    // default placeholder example
    cityInput.placeholder = 'e.g. London, Tokyo...';
  }







}
)();