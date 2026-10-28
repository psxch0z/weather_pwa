async function loadWeather(latitude, longitude, cityName)  {
    const url =
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Ошибка HTTP: ' + response.status);
        }

        const data = await response.json();
        const temperature =
            data.properties.timeseries[0].data.instant.details.air_temperature;

        document.getElementById('temperature').textContent =
            `Температура в городе ${cityName}: ${temperature} °C`;

        document.getElementById('status').textContent = '';
    } catch (error) {
        document.getElementById('temperature').textContent = '';
        document.getElementById('status').textContent = 'Ошибка загрузки';
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
        await loadWeather(location.latitude, location.longitude, location.name);
    } catch (error) {
        status.textContent = error.message;
        console.error(error);
    }
});

loadWeather(55.7558, 37.6173, 'Москва');