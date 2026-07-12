(function() {
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
        } catch (e) {}
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

      
    }
  ) ();