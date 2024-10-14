
/**
 * Filters the forecast data to extract the prediction data
 * @param {Array<{line: string}>} data - The forecast data
 * @returns {Array<{line: string}>} The prediction data
 */

export function filterDataStart(data) {
    let prediction_start_index = -1;
    const prediction_prefix_substring = 'NOAA Kp index breakdown';
    const prediction_arr_len = 9;
    for (let i = 0; i < data.length; i++) {
        if (data[i].line.includes(prediction_prefix_substring)) {
            prediction_start_index = i;
            break;
        }
    }
    if (prediction_start_index === -1) {
        throw new Error('Could not find the start of the prediction data');
    }
    prediction_start_index += 1; // Skip the header line
    const predictions = data.slice(prediction_start_index, prediction_start_index + prediction_arr_len);
    return predictions;
}

/**
 * Populates the prediction data with the forecast values
 * @param {Array<{line: string}>} predictions - The prediction data
 * @param {string} dates - The dates for the forecast
 * @returns {Array<{date: string, values: Array<{hour: number, kp: string}>}>} The populated prediction data
 */
export function populatePredictionData(predictions, dates) {
    // Use a regular expression to match the date format
    const datePattern = /([A-Z][a-z]{2} \d{1,2})/g; // Matches Dates such as "Oct 10", "Oct 11", "Oct 12"
    const prediction_dates = dates.match(datePattern);

    if (!prediction_dates) {
        // If the date pattern is not found, throw an error
        throw new Error('Could not find the dates in the forecast data');
    }
    let predictionData = [];
    // add the dates to the predictionData array
    for (let i = 0; i < prediction_dates.length; i++) {
        predictionData.push({ date: prediction_dates[i], values: [] });
    }

    for (let i = 1; i < predictions.length; i++) {
        const lineParts = predictions[i].line.split(/\s{2,}/).filter(part => part.trim() !== '');
        if (lineParts.length !== 4) {
            // Skip lines that do not have the expected number of parts
            continue
        }
        let timePeriod = lineParts[0];
        lineParts.shift();
        timePeriod = timePeriod.replace('UT', '');
        timePeriod = timePeriod.split('-');
        let start = Number(timePeriod[0]);
        let end = Number(timePeriod[1]);
        if (end < start) {
            end += 24;
        }

        for (let time = start; time <= end; time++) {
            for (let j = 0; j < predictionData.length; j++) {
                predictionData[j].values.push({ hour: time, kp: lineParts[j] });
            }
        }
    }
    return predictionData;
}