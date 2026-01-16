class LocationNormalizer:
    STATE_MAP = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
        'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
        'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
        'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
        'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
        'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
        'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
        'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
        'DC': 'District of Columbia'
    }

    GLOBAL_ALIASES = {
        'Panjab': 'Punjab',
        'Rajashtan': 'Rajasthan',
        'Nyc': 'New York',
        'New York City': 'New York',
        'Ny City': 'New York',
        'Calfornia': 'California',
        'Colarado': 'Colorado',
    }

    @classmethod
    def normalize(cls, city: str, state: str, country: str) -> tuple:
        # 1. Basic cleaning and title casing
        city = (city or "").strip().strip(',. ').title()
        state = (state or "").strip().strip(',. ').title()
        country = (country or "").strip().strip(',. ').title()

        # 2. Map aliases and common misspellings
        if city in cls.GLOBAL_ALIASES: city = cls.GLOBAL_ALIASES[city]
        if state in cls.GLOBAL_ALIASES: state = cls.GLOBAL_ALIASES[state]

        # 3. Map abbreviations to full names
        if state.upper() in cls.STATE_MAP: state = cls.STATE_MAP[state.upper()]
        
        # 4. Handle city names containing state info
        all_regions = list(cls.STATE_MAP.values()) + list(cls.STATE_MAP.keys())
        for region in all_regions:
            prefixes = [f"{region} ", f"{region}, "]
            suffixes = [f" {region}", f", {region}"]
            for p in prefixes:
                if city.lower().startswith(p.lower()): city = city[len(p):].strip().strip(',. ')
            for s in suffixes:
                if city.lower().endswith(s.lower()): city = city[:city.lower().rfind(s.lower())].strip().strip(',. ')

        # 5. Handle merged state/city fields
        if ',' in state:
            state_parts = [p.strip() for p in state.split(',')]
            if len(state_parts) >= 2:
                if not city or city.lower() in [p.lower() for p in state_parts]:
                    city = state_parts[0].title()
                    state = state_parts[1].title()
                    if state.upper() in cls.STATE_MAP: state = cls.STATE_MAP[state.upper()]

        # 6. Redundancy check
        if city.lower() == state.lower() or (city and state and city.lower() in state.lower()):
            state = ""
        elif state and city and state.lower() in city.lower():
            city = state
        
        # 7. Final Aliases Check
        if city in cls.GLOBAL_ALIASES: city = cls.GLOBAL_ALIASES[city]
        if state in cls.GLOBAL_ALIASES: state = cls.GLOBAL_ALIASES[state]

        # 8. Title Case
        return city.title().strip().strip(',. ') or "", state.title().strip().strip(',. ') or "", country.title().strip().strip(',. ') or ""
