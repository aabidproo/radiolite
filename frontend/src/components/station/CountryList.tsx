interface Country {
  name: string;
  stationcount: number;
}

interface CountryListProps {
  countries: Country[];
  onSelectCountry: (country: string) => void;
}

export function CountryList({ countries, onSelectCountry }: CountryListProps) {
  return (
    <div className="country-grid">
      {countries.map((country) => (
        <div 
          key={country.name} 
          className="country-item"
          onClick={() => onSelectCountry(country.name)}
        >
          <span className="country-name">{country.name}</span>
          <span className="station-count">{country.stationcount.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
