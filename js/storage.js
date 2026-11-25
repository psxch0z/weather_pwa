const weatherStore = localforage.createInstance({
    name: 'weather-pwa',
    storeName: 'weather_cache',
    driver: localforage.INDEXEDDB
});

async function saveWeatherToCache(city, data, latitude, longitude, searchText) {
    const key = `city:${city.toLowerCase()}`;

    await weatherStore.setItem(key, {
        city,
        data,
        latitude,
        longitude,
        searchText,
        savedAt: Date.now()
    });

    await weatherStore.setItem('lastWeatherKey', key);
}

async function getWeatherFromCache(city) {
    try {
        const key = city
            ? `city:${city.toLowerCase()}`
            : await weatherStore.getItem('lastWeatherKey');

        if (!key) {
            return null;
        }

        const cached = await weatherStore.getItem(key);
        if (!cached) {
            return null;
        }

        return {
            ...cached,
            isStale: Date.now() - cached.savedAt > 24 * 60 * 60 * 1000
        };
    } catch (error) {
        console.error('Не удалось прочитать кэш:', error);
        return null;
    }
}
