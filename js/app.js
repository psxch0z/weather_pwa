function saveWeatherToCache(city, data, latitude, longitude, searchText) {
    try {
        const cached = {
            city: city,
            data: data,
            savedAt: Date.now(),
            latitude: latitude,
            longitude: longitude,
            searchText: searchText
        };

        localStorage.setItem('weatherCache', JSON.stringify(cached));
    } catch (error) {
        console.error('Не удалось сохранить погоду:', error);
    }
}

function getWeatherFromCache() {
    try {
        const cached = localStorage.getItem('weatherCache');
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.error('Не удалось прочитать кэш:', error);
        return null;
    }
}

function showCachedWeather() {
    const cached = getWeatherFromCache();

    if (!cached) {
        return false;
    }

    const cachedTemperature =
        cached.data?.properties?.timeseries?.[0]?.data?.instant?.details?.air_temperature;

    if (cachedTemperature == null) {
        return false;
    }

    document.getElementById('temperature').textContent =
        `Температура в городе ${cached.city}: ${cachedTemperature} °C`;

    document.getElementById('status').textContent =
        `Не удалось загрузить свежий прогноз. Показаны данные от ${
            new Date(cached.savedAt).toLocaleString()
        }.`;

    document.getElementById('city').value =
        cached.searchText || cached.city || '';

    return true;
}

async function loadWeather(latitude, longitude, cityName, searchText = cityName)  {
    const url =
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Ошибка HTTP: ' + response.status);
        }

        const data = await response.json();
        saveWeatherToCache(cityName, data, latitude, longitude, searchText);

        const temperature =
            data.properties.timeseries[0].data.instant.details.air_temperature;

        document.getElementById('temperature').textContent =
            `Температура в городе ${cityName}: ${temperature} °C`;

        document.getElementById('status').textContent = '';
    } catch (error) {
        if (!showCachedWeather()) {
            document.getElementById('temperature').textContent = '';
            document.getElementById('status').textContent =
                'Ошибка загрузки, сохранённых данных пока нет.';
        }

        console.error(error);
    }
}

async function findCity(city) {
    const encodedCity = encodeURIComponent(city);
    const geoUrl =
        `https://nominatim.openstreetmap.org/search?q=${encodedCity}&format=json&limit=1&accept-language=ru`;

    const response = await fetch(geoUrl);

    if (!response.ok) {
        throw new Error('Ошибка поиска города');
    }

    const geoData = await response.json();

    if (geoData.length === 0) {
        throw new Error('Город не найден');
    }

    const { lat, lon, display_name } = geoData[0];

    return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        name: display_name.split(',')[0]
    };
}

document.getElementById('city-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const city = document.getElementById('city').value.trim();
    const status = document.getElementById('status');

    status.textContent = 'Ищем город...';

    try {
        const location = await findCity(city);
        status.textContent = `Загружаю погоду для ${location.name}...`;
        await loadWeather(location.latitude, location.longitude, location.name, city);
    } catch (error) {
        if (error instanceof TypeError) {
            if (!showCachedWeather()) {
                status.textContent =
                    'Нет сети и сохранённых данных пока нет.';
            }
        } else {
            status.textContent = error.message;
        }

        console.error(error);
    }
});

const cachedWeather = getWeatherFromCache();

if (cachedWeather) {
    document.getElementById('city').value =
        cachedWeather.searchText || cachedWeather.city;
}

if (
    cachedWeather &&
    Number.isFinite(cachedWeather.latitude) &&
    Number.isFinite(cachedWeather.longitude)
) {
    loadWeather(
        cachedWeather.latitude,
        cachedWeather.longitude,
        cachedWeather.city,
        cachedWeather.searchText || cachedWeather.city
    );
} else {
    loadWeather(55.7558, 37.6173, 'Москва');
}