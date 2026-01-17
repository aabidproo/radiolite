export interface CuratedStation {
  name: string;
  countryCode?: string;
}

export const CURATED_STATIONS: Record<string, CuratedStation[]> = {
  'Asia': [
    // India
    { name: "Mirchi", countryCode: "IN" },
    { name: "Radio City Hindi", countryCode: "IN" },
    { name: "Vividh Bharati", countryCode: "IN" },
    { name: "Red FM", countryCode: "IN" },
    { name: "AIR Fm Gold Delhi", countryCode: "IN" },
    // Pakistan
    { name: "FM 100 Pakistan", countryCode: "PK" },
    { name: "City FM 89", countryCode: "PK" },
    // Bangladesh
    { name: "Peoples Radio 91.6 FM", countryCode: "BD" },
    { name: "Dhaka FM 90.4", countryCode: "BD" },
    { name: "Radio Bhumi", countryCode: "BD" },
    // Myanmar
    { name: "Yangon City FM", countryCode: "MM" },
    // Thailand
    { name: "EFM 94", countryCode: "TH" },
    { name: "Cool Fahrenheit", countryCode: "TH" },
    // Singapore
    { name: "YES 933", countryCode: "SG" },
    { name: "987 FM", countryCode: "SG" },
    // Malaysia
    { name: "HITZ FM", countryCode: "MY" },
    { name: "ERA FM", countryCode: "MY" },
    // Indonesia
    { name: "Prambors FM", countryCode: "ID" },
    { name: "Gen FM", countryCode: "ID" },
    // UAE
    { name: "Big FM 106.2", countryCode: "AE" },
    // China
    { name: "CNR-1 中国之声", countryCode: "CN" },
    { name: "CNR-3 音乐之声", countryCode: "CN" },
    // Taiwan
    { name: "Hit FM 107.7 Taiwan", countryCode: "TW" },
    // South Korea
    { name: "SBS Power FM", countryCode: "KR" },
    { name: "MBC FM4U", countryCode: "KR" },
    { name: "Arirang FM", countryCode: "KR" },
    // Japan
    { name: "J-WAVE 81.3 FM", countryCode: "JP" },
    { name: "Tokyo FM", countryCode: "JP" },
    { name: "NHK FM", countryCode: "JP" }
  ],
  'Europe': [
    // UK
    { name: "BBC Radio 1", countryCode: "GB" },
    { name: "BBC Radio 2", countryCode: "GB" },
    { name: "BBC Radio 4", countryCode: "GB" },
    { name: "Capital FM", countryCode: "GB" },
    { name: "Kiss FM", countryCode: "GB" },
    { name: "Heart", countryCode: "GB" },
    // France
    { name: "NRJ", countryCode: "FR" },
    { name: "Skyrock", countryCode: "FR" },
    { name: "RTL", countryCode: "FR" },
    { name: "Europe 1", countryCode: "FR" },
    { name: "France Inter", countryCode: "FR" },
    // Germany
    { name: "Deutschlandfunk", countryCode: "DE" },
    { name: "Bayern 3", countryCode: "DE" },
    { name: "Antenne Bayern", countryCode: "DE" },
    { name: "NDR 2", countryCode: "DE" },
    { name: "Radio Eins", countryCode: "DE" },
    // Italy
    { name: "RAI Radio 1", countryCode: "IT" },
    { name: "RAI Radio 2", countryCode: "IT" },
    { name: "Radio Deejay", countryCode: "IT" },
    { name: "Radio 105", countryCode: "IT" },
    { name: "Virgin Radio", countryCode: "IT" },
    // Spain
    { name: "Los 40", countryCode: "ES" },
    { name: "Cadena SER", countryCode: "ES" },
    { name: "Onda Cero", countryCode: "ES" },
    { name: "Kiss FM Spain", countryCode: "ES" },
    { name: "Europa FM", countryCode: "ES" },
    // Netherlands
    { name: "Radio 538", countryCode: "NL" },
    { name: "Qmusic", countryCode: "NL" },
    { name: "NPO Radio 2", countryCode: "NL" },
    { name: "NPO 3FM", countryCode: "NL" },
    // Belgium
    { name: "Studio Brussel", countryCode: "BE" },
    { name: "VRT Radio 2", countryCode: "BE" },
    { name: "MNM", countryCode: "BE" },
    // Poland
    { name: "RMF FM", countryCode: "PL" },
    { name: "Radio Zet", countryCode: "PL" },
    { name: "Radio Eska", countryCode: "PL" },
    // Sweden
    { name: "Sveriges Radio P3", countryCode: "SE" },
    { name: "Sveriges Radio P4", countryCode: "SE" },
    // Norway
    { name: "NRK P3", countryCode: "NO" },
    { name: "NRK P1", countryCode: "NO" },
    // Denmark
    { name: "DR P3", countryCode: "DK" },
    { name: "DR P4", countryCode: "DK" },
    // Finland
    { name: "Yle Radio Suomi", countryCode: "FI" },
    { name: "YleX", countryCode: "FI" },
    // Portugal
    { name: "Rádio Comercial", countryCode: "PT" },
    { name: "TSF Rádio Notícias", countryCode: "PT" },
    { name: "RFM", countryCode: "PT" },
    // Switzerland
    { name: "SRF 1", countryCode: "CH" },
    { name: "SRF 3", countryCode: "CH" },
    { name: "Radio Energy", countryCode: "CH" },
    // Russia
    { name: "Europa Plus", countryCode: "RU" },
    { name: "Radio Mayak", countryCode: "RU" },
    { name: "Radio Monte Carlo", countryCode: "RU" },
    // Austria
    { name: "Ö3", countryCode: "AT" },
    { name: "FM4", countryCode: "AT" },
    // Czech Republic
    { name: "Radiožurnál", countryCode: "CZ" },
    { name: "Evropa 2", countryCode: "CZ" },
    // Greece
    { name: "Sfera 102.2", countryCode: "GR" },
    { name: "Athens DeeJay 95.2", countryCode: "GR" }
  ],
  'North America': [
    // US
    { name: "NPR News", countryCode: "US" },
    { name: "KEXP", countryCode: "US" },
    { name: "KIIS FM", countryCode: "US" },
    { name: "Z100 New York", countryCode: "US" },
    { name: "Power 106", countryCode: "US" },
    { name: "Hot 97 New York", countryCode: "US" },
    // Canada
    { name: "CBC Radio One Toronto", countryCode: "CA" },
    { name: "CBC Music Vancouver", countryCode: "CA" },
    { name: "CHUM FM 104.5", countryCode: "CA" },
    { name: "Virgin Radio Toronto", countryCode: "CA" },
    { name: "Kiss 92.5 Toronto", countryCode: "CA" },
    // Mexico
    { name: "Los 40 México", countryCode: "MX" },
    { name: "Exa FM 104.9 Mexico", countryCode: "MX" },
    { name: "W Radio Mexico", countryCode: "MX" },
    { name: "Radio Fórmula 103.3", countryCode: "MX" },
    { name: "Ke Buena", countryCode: "MX" },
    // Costa Rica
    { name: "Radio Monumental", countryCode: "CR" },
    { name: "94.7 FM", countryCode: "CR" },
    // Dominican Republic
    { name: "Z101", countryCode: "DO" },
    { name: "La Mega Dominicana", countryCode: "DO" },
    // Cuba
    { name: "Radio Rebelde", countryCode: "CU" },
    { name: "Radio Habana Cuba", countryCode: "CU" }
  ],
  'South America': [
    // Brazil
    { name: "Jovem Pan", countryCode: "BR" },
    { name: "Rádio Globo", countryCode: "BR" },
    { name: "Mix FM", countryCode: "BR" },
    { name: "Band FM", countryCode: "BR" },
    { name: "Antena 1", countryCode: "BR" },
    // Argentina
    { name: "Radio Mitre", countryCode: "AR" },
    { name: "La 100", countryCode: "AR" },
    { name: "Rock & Pop", countryCode: "AR" },
    { name: "Radio Nacional Argentina", countryCode: "AR" },
    { name: "FM Metro 95.1", countryCode: "AR" },
    // Chile
    { name: "Radio Bio Bio", countryCode: "CL" },
    { name: "Radio Cooperativa Chile", countryCode: "CL" },
    { name: "Rock & Pop 94.1 Chile", countryCode: "CL" },
    { name: "Los 40 Chile", countryCode: "CL" },
    // Colombia
    { name: "Caracol Radio Bogotá", countryCode: "CO" },
    { name: "W Radio Colombia", countryCode: "CO" },
    { name: "La FM Colombia", countryCode: "CO" },
    { name: "Los 40 Colombia", countryCode: "CO" },
    // Peru
    { name: "RPP Noticias", countryCode: "PE" },
    { name: "Radio Moda Peru", countryCode: "PE" },
    { name: "Studio 92 Peru", countryCode: "PE" },
    // Venezuela
    { name: "Unión Radio Venezuela", countryCode: "VE" },
    { name: "Éxitos FM 99.7", countryCode: "VE" },
    { name: "La Mega Venezuela", countryCode: "VE" },
    // Uruguay
    { name: "El Espectador Uruguay", countryCode: "UY" },
    { name: "Radio Carve 850", countryCode: "UY" },
    { name: "Océano FM 93.9", countryCode: "UY" },
    // Ecuador
    { name: "Radio Sucre Ecuador", countryCode: "EC" },
    { name: "Radio La Red 102.1", countryCode: "EC" },
    { name: "Radio Visión Ecuador", countryCode: "EC" },
    // Bolivia
    { name: "Radio Panamericana Bolivia", countryCode: "BO" },
    { name: "Fides Radio Bolivia", countryCode: "BO" },
    // Paraguay
    { name: "Monumental AM 1080", countryCode: "PY" },
    { name: "Rock & Pop 95.5 Paraguay", countryCode: "PY" }
  ],
  'Africa': [
    // South Africa
    { name: "Metro FM", countryCode: "ZA" },
    { name: "5FM South Africa", countryCode: "ZA" },
    { name: "Kaya FM 95.9", countryCode: "ZA" },
    { name: "Jacaranda FM 94.2", countryCode: "ZA" },
    // Nigeria
    { name: "Cool FM 96.9 Lagos", countryCode: "NG" },
    { name: "Wazobia FM 95.1 Lagos", countryCode: "NG" },
    { name: "The Beat 99.9 FM", countryCode: "NG" },
    { name: "Nigeria Info 99.3", countryCode: "NG" },
    // Kenya
    { name: "Capital FM Kenya", countryCode: "KE" },
    { name: "Radio Jambo Kenya", countryCode: "KE" },
    { name: "Kiss FM Kenya", countryCode: "KE" },
    // Egypt
    { name: "Nogoum FM Egypt", countryCode: "EG" },
    { name: "Nile FM Egypt", countryCode: "EG" },
    { name: "Radio Masr Egypt", countryCode: "EG" },
    // Ghana
    { name: "Joy FM 99.7 Accra", countryCode: "GH" },
    { name: "Citi FM 97.3 Accra", countryCode: "GH" },
    { name: "Peace FM 104.3", countryCode: "GH" },
    // Morocco
    { name: "Hit Radio Maroc", countryCode: "MA" },
    { name: "Radio 2M Maroc", countryCode: "MA" },
    // Tanzania
    { name: "Clouds FM Tanzania", countryCode: "TZ" },
    { name: "Wasafi FM 88.9", countryCode: "TZ" },
    // Uganda
    { name: "Capital FM Uganda", countryCode: "UG" },
    { name: "Radio One FM 90", countryCode: "UG" },
    // Ethiopia
    { name: "Sheger FM 102.1", countryCode: "ET" },
    { name: "Fana FM 98.1", countryCode: "ET" },
    // Senegal
    { name: "RFM 94.0 Dakar", countryCode: "SN" },
    { name: "Sud FM 98.5", countryCode: "SN" }
  ],
  'Oceania': [
    // Australia
    { name: "Triple J", countryCode: "AU" },
    { name: "Nova 96.9", countryCode: "AU" },
    { name: "KIIS 1065", countryCode: "AU" },
    { name: "ABC Radio National Australia", countryCode: "AU" },
    { name: "SBS Radio 1 Australia", countryCode: "AU" },
    // New Zealand
    { name: "ZM", countryCode: "NZ" },
    { name: "The Edge", countryCode: "NZ" },
    { name: "RNZ National", countryCode: "NZ" },
    { name: "More FM Auckland", countryCode: "NZ" },
    // Fiji
    { name: "FBC Radio Fiji", countryCode: "FJ" },
    { name: "Legend FM Fiji", countryCode: "FJ" },
    // Papua New Guinea
    { name: "NBC Radio PNG", countryCode: "PG" },
    { name: "FM100 PNG", countryCode: "PG" },
    // Samoa
    { name: "Radio 2AP Samoa", countryCode: "WS" },
    // Tonga
    { name: "Radio Tonga", countryCode: "TO" }
  ],
  'Arab World': [
    // Saudi Arabia
    { name: "MBC FM", countryCode: "SA" },
    { name: "Rotana FM", countryCode: "SA" },
    { name: "Panorama FM", countryCode: "SA" },
    { name: "UFM Radio", countryCode: "SA" },
    // UAE
    { name: "Dubai Eye 103.8", countryCode: "AE" },
    { name: "Virgin Radio Dubai", countryCode: "AE" },
    { name: "Al Arabiya 99 FM", countryCode: "AE" },
    { name: "Al Khaleejiya", countryCode: "AE" },
    // Egypt
    { name: "Nogoum FM Egypt", countryCode: "EG" },
    { name: "Nile FM Egypt", countryCode: "EG" },
    { name: "Radio Masr", countryCode: "EG" },
    { name: "Shaabi FM 95", countryCode: "EG" },
    // Jordan
    { name: "Mazaj FM", countryCode: "JO" },
    { name: "Play 99.6", countryCode: "JO" },
    { name: "Beat FM Jordan", countryCode: "JO" },
    // Lebanon
    { name: "Radio One Lebanon", countryCode: "LB" },
    { name: "Sawt El Ghad", countryCode: "LB" },
    { name: "NRJ Lebanon", countryCode: "LB" },
    // Qatar
    { name: "Qatar Radio", countryCode: "QA" },
    { name: "QBS Radio", countryCode: "QA" },
    // Kuwait
    { name: "Marina FM", countryCode: "KW" },
    { name: "Super FM 99.7", countryCode: "KW" },
    // Bahrain
    { name: "Radio Bahrain 96.5", countryCode: "BH" },
    // Oman
    { name: "Hi FM 95.9", countryCode: "OM" },
    { name: "Merge 104.8", countryCode: "OM" },
    // Morocco
    { name: "Hit Radio Maroc", countryCode: "MA" },
    { name: "Medi 1", countryCode: "MA" },
    { name: "Radio 2M Maroc", countryCode: "MA" },
    // Tunisia
    { name: "Mosaique FM", countryCode: "TN" },
    { name: "Shems FM", countryCode: "TN" },
    // Algeria
    { name: "Chaîne 3", countryCode: "DZ" },
    { name: "Radio Algérie Internationale", countryCode: "DZ" },
    // Palestine
    { name: "Radio Ajyal", countryCode: "PS" },
    { name: "Radio Raya", countryCode: "PS" },
    // Iraq
    { name: "Al Rasheed FM", countryCode: "IQ" },
    { name: "Radio Dijla", countryCode: "IQ" },
    // Yemen
    { name: "Yemen FM", countryCode: "YE" },
    // Libya
    { name: "Tripoli FM", countryCode: "LY" },
    // Pan-Arab (Local Streams Only)
    { name: "Rotana Radio", countryCode: "SA" },
    { name: "NRJ Arab World", countryCode: "AE" }
  ]
};
