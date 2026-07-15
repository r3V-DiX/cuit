"use client";

import { useState, useEffect } from "react";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";
import { ChevronDown, MapPin } from "lucide-react";

export interface LocationValue {
  city: string;
  state?: string;
  country: string;
}

interface LocationSelectProps {
  value: LocationValue;
  onChange: (val: LocationValue) => void;
  required?: boolean;
}

export function LocationSelect({ value, onChange, required }: LocationSelectProps) {
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);

  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // Sync initial value -> iso codes
  useEffect(() => {
    if (value.country && countries.length > 0) {
      const country = countries.find(c => c.name === value.country);
      if (country) {
        setSelectedCountryCode(country.isoCode);
        const st = State.getStatesOfCountry(country.isoCode);
        setStates(st);
        if (value.state) {
          const state = st.find(s => s.name === value.state);
          if (state) {
            setSelectedStateCode(state.isoCode);
            setCities(City.getCitiesOfState(country.isoCode, state.isoCode));
          } else {
            setSelectedStateCode("");
            setCities([]);
          }
        } else {
          setSelectedStateCode("");
          setCities([]);
        }
      }
    }
  }, [value.country, value.state, countries]); // Only react when parent passes down initial state or countries load

  function handleCountryChange(countryName: string) {
    const country = countries.find(c => c.name === countryName);
    if (!country) {
      onChange({ city: "", state: "", country: "" });
      setSelectedCountryCode("");
      setStates([]);
      setSelectedStateCode("");
      setCities([]);
      return;
    }
    setSelectedCountryCode(country.isoCode);
    const st = State.getStatesOfCountry(country.isoCode);
    setStates(st);
    setSelectedStateCode("");
    setCities([]);
    onChange({ city: "", state: "", country: country.name });
  }

  function handleStateChange(stateName: string) {
    const state = states.find(s => s.name === stateName);
    if (!state) {
      onChange({ ...value, city: "", state: "" });
      setSelectedStateCode("");
      setCities([]);
      return;
    }
    setSelectedStateCode(state.isoCode);
    setCities(City.getCitiesOfState(selectedCountryCode, state.isoCode));
    onChange({ ...value, city: "", state: state.name });
  }

  function handleCityChange(cityName: string) {
    onChange({ ...value, city: cityName });
  }

  const selectCls = "w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 pr-8 cursor-pointer";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-xs font-semibold text-slate-700">
          Country{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        <div className="relative">
          <select
            value={value.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className={selectCls}
            required={required}
          >
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c.isoCode} value={c.name}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 relative">
        <label className="text-xs font-semibold text-slate-700">
          State{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        <div className="relative">
          <select
            value={value.state || ""}
            onChange={(e) => handleStateChange(e.target.value)}
            className={selectCls}
            required={required && states.length > 0}
            disabled={!selectedCountryCode || states.length === 0}
          >
            <option value="">{states.length > 0 ? "Select State" : "N/A"}</option>
            {states.map((s) => (
              <option key={s.isoCode} value={s.name}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 relative">
        <label className="text-xs font-semibold text-slate-700">
          City{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        <div className="relative">
          <select
            value={value.city}
            onChange={(e) => handleCityChange(e.target.value)}
            className={selectCls}
            required={required && cities.length > 0}
            disabled={!selectedStateCode || cities.length === 0}
          >
            <option value="">{cities.length > 0 ? "Select City" : "N/A"}</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
