
import express from 'express';
import axios from 'axios';
import { filterDataStart, populatePredictionData } from './data.js';
const app = express();
const PORT = process.env.PORT || 3000;

let cache = {
    data: null,
    timestamp: null
};

/**
    * Fetches the 3-day forecast data from the NOAA SWPC API
    * and returns it as JSON.
    * @param {Request} req - The Express request object
    * @param {Response} res - The Express response object
    * @returns {Promise<void>}
    * @example
    * // GET /forecast
    * // Response:
    * [
    *  {
    *   date: 'Oct 10',
    *  values: [
    *  { hour: 0, kp: '1' },
    *  { hour: 1, kp: '1' },
    *  { hour: 2, kp: '1' },
    *  { hour: 3, kp: '1' },
    *  { hour: 4, kp: '1' },
    * ...
    * ]
    * },
    * ...
    * ]
 */
app.get('/forecast', async (req, res) => {
    // check if the cache is valid
    const now = Date.now();
    let cacheFromYesterday = !cache.timestamp || new Date(cache.timestamp).getDate() !== new Date(now).getDate()
    let nowPast1UTC = new Date(now).getUTCHours() >= 1;
    let cacheValid = !(cacheFromYesterday && nowPast1UTC) && cache.data;
    if (cacheValid) {
        return res.json(cache.data);
    }

    try {
        const response = await axios.get('https://services.swpc.noaa.gov/text/3-day-forecast.txt');

        // Process the response to convert it to JSON
        const forecastText = response.data;

        // Split the text into lines and filter out empty lines
        const forecastLines = forecastText.split('\n').filter(line => line.trim() !== '');

        const forecastData = forecastLines.map(line => {
            return { line: line.trim() };
        });

        let predictions = filterDataStart(forecastData);
        const dates = predictions[0].line
        let predictionData = populatePredictionData(predictions, dates);

        // Update the cache
        cache.data = predictionData;
        cache.timestamp = now;

        res.json(predictionData);
    } catch (error) {
        console.error('Error fetching forecast:', error);
        res.status(500).json({ error: 'Failed to fetch forecast data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/forecast`);
});
