import * as weather from './weather-utils.js';

export function createWeatherRuntime(getState){
  const currentState=()=>getState();
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
