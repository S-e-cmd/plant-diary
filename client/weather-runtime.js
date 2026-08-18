import * as weather from './weather-utils.js';

export function createWeatherRuntime(getState){
  const currentState=()=>getState();
  globalThis.applyBackgroundForecasts=data=>{
    const state=currentState();
    if(Array.isArray(data?.forecasts))state.forecasts=data.forecasts;
    if(Array.isArray(data?.forecastHourly))state.forecastHourly=data.forecastHourly;
    if(Object.prototype.hasOwnProperty.call(data||{},'weather'))state.weather=data.weather;
  };
  return{
    forecastWeatherName:weather.forecastWeatherName,
    weatherRule(kind='spray'){return weather.weatherRule(currentState().weatherRules,kind)},
    forecastRain(f,kind='spray'){return weather.forecastRain(f,currentState().weatherRules,kind)},
    forecastStrongWind(f,kind='spray'){return weather.forecastStrongWind(f,currentState().weatherRules,kind)},
    weatherWorkRisk(f,kind='spray'){return weather.weatherWorkRisk(f,currentState().weatherRules,kind)},
    riskReason(f,kind='spray'){return weather.riskReason(f,currentState().weatherRules,kind)},
    isWeatherSensitivePlan:weather.isWeatherSensitivePlan,
    planWeatherKind:weather.planWeatherKind,
    safeWindows(date,kind){return weather.safeWindows(date,kind,currentState().forecastHourly,currentState().weatherRules)}
  }
}
