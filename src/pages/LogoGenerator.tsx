import React from 'react';

interface ClubProps {
  nickname: string;
  primaryColor: string;
  secondaryColor: string;
  shortCode: string;
  location: string;
  year: string;
  country: string;
}

const RadomiakStyleLogo = ({ nickname, primaryColor, secondaryColor, shortCode, location, year, country }: ClubProps) => {
  return (
    <svg viewBox="0 0 514 486" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <g id="surface1">
        {/* CZARNE OBRAMOWANIA (Te charakterystyczne łuki) */}
        <path fill="black" d="M 43.46 150.78 C 69.83 126.66 106.22 111.74 146.39 111.74 C 186.57 111.74 222.96 126.66 249.33 150.78 C 275.76 174.96 292.11 208.38 292.11 245.29 C 292.11 282.21 275.76 315.63 249.33 339.80 C 222.96 363.93 186.57 378.84 146.39 378.84 C 106.22 378.84 69.83 363.93 43.46 339.80 C 17.03 315.63 0.68 282.21 0.68 245.29 C 0.68 208.38 17.03 174.96 43.46 150.78 "/>
        <path fill="black" d="M 264.85 150.78 C 291.21 126.66 327.61 111.74 367.78 111.74 C 407.95 111.74 444.35 126.66 470.71 150.78 C 497.14 174.96 513.49 208.38 513.49 245.29 C 513.49 282.21 497.14 315.63 470.71 339.80 C 444.35 363.93 407.95 378.84 367.78 378.84 C 327.61 378.84 291.21 363.93 264.85 339.80 C 238.42 315.63 222.07 282.21 222.07 245.29 C 222.07 208.38 238.42 174.96 264.85 150.78 "/>

        {/* BOCZNE ŁUKI - Kolor Wtórny (Secondary Color) */}
        <path fill={secondaryColor} d="M 146.39 117.41 C 107.66 117.41 72.62 131.75 47.27 154.95 C 22 178.07 6.36 210.02 6.36 245.29 C 6.36 280.57 22 312.51 47.27 335.64 C 72.62 358.83 107.66 373.18 146.39 373.18 C 185.13 373.18 220.17 358.83 245.52 335.64 C 270.8 312.51 286.43 280.57 286.43 245.29 C 286.43 210.02 270.8 178.07 245.52 154.95 C 220.17 131.75 185.13 117.41 146.39 117.41 "/>
        <path fill={secondaryColor} d="M 367.78 117.41 C 329.05 117.41 294 131.75 268.66 154.95 C 243.38 178.07 227.74 210.02 227.74 245.29 C 227.74 280.57 243.38 312.51 268.66 335.64 C 294 358.83 329.05 373.18 367.78 373.18 C 406.51 373.18 441.55 358.83 466.9 335.64 C 492.18 312.51 507.82 280.57 507.82 245.29 C 507.82 210.02 492.18 178.07 466.9 154.95 C 441.55 131.75 406.51 117.41 367.78 117.41 "/>

        {/* CENTRALNE KOŁO - Kolor Główny (Primary Color) */}
        <circle cx="257.13" cy="242.36" r="182" fill={primaryColor} stroke="black" strokeWidth="5" />

        {/* BIAŁY PAS ŚRODKOWY */}
        <rect x="80" y="198" width="355" height="90" fill="white" stroke="black" strokeWidth="4" />

        {/* TEKSTY - Stylizacja Arial Bold (jak w oryginale) */}
        <g fill="black" textAnchor="middle" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
          {/* Góra: Kraj */}
          <text x="257" y="45" fontSize="45">{country}</text>

          {/* Dół: Rok */}
          <text x="257" y="465" fontSize="45">{year}</text>

          {/* Środek góra */}
          <text x="257" y="180" fontSize="50">PIŁKARSKI</text>

          {/* Środek pas: PRZYDOMEK */}
          <text x="257" y="265" fontSize="60">{nickname}</text>

          {/* Środek dół: LOKALIZACJA */}
          <text x="257" y="350" fontSize="50">{location}</text>
        </g>
      </g>
    </svg>
  );
};

const clubs = [
  { nickname: "GUNNERS", primaryColor: "#EF0107", secondaryColor: "#FFFFFF", shortCode: "ARS", location: "LONDON", year: "1886", country: "ENG" },
  { nickname: "LOS BLANCOS", primaryColor: "#FFFFFF", secondaryColor: "#FEBE10", shortCode: "RMA", location: "MADRID", year: "1902", country: "ESP" },
  { nickname: "THE BLUES", primaryColor: "#034694", secondaryColor: "#FFFFFF", shortCode: "CHE", location: "LONDON", year: "1905", country: "ENG" },
  { nickname: "BIANCONERI", primaryColor: "#000000", secondaryColor: "#FFFFFF", shortCode: "JUV", location: "TURIN", year: "1897", country: "ITA" },
  { nickname: "RED DEVILS", primaryColor: "#DA291C", secondaryColor: "#FBE122", shortCode: "MUN", location: "MANCHESTER", year: "1878", country: "ENG" },
  { nickname: "BLAUGRANA", primaryColor: "#A50044", secondaryColor: "#004D98", shortCode: "FCB", location: "BARCELONA", year: "1899", country: "ESP" },
  { nickname: "ALKO QUIZ", primaryColor: "#FF0000", secondaryColor: "#FEBE10", shortCode: "FCB", location: "ŁÓDŹ", year: "2015", country: "POL" }
];

const LogoGenerator = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '28px', textAlign: 'center' }}>
        ⚽ SUPER PIŁKA GRYWALNA PRO 2026 ⚽
      </h1>
      <p style={{ textAlign: 'center', marginBottom: '30px' }}>Generator logotypów "Radomiak Global Edition"</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        {clubs.map((club, index) => (
          <div key={index} style={{ backgroundColor: '#FFF', border: '4px solid black', padding: '15px', borderRadius: '10px', boxShadow: '10px 10px 0px black' }}>
            <RadomiakStyleLogo {...club} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: '60px', textAlign: 'center', paddingBottom: '40px' }}>
        <h2 style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '22px' }}>
          ⭐ FINAL BOSS ⭐
        </h2>
        <div style={{ width: '200px', height: '200px', margin: '20px auto', perspective: '1000px' }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/07/Radomiak_Radom_logo.png"
            alt="Prawdziwe logo Radomiaka"
            style={{
              width: '100%',
              height: '100%',
              filter: 'drop-shadow(0 0 15px gold) drop-shadow(0 0 30px #FFF)',
              animation: 'rotate3d 4s infinite linear'
            }}
          />
        </div>
        <p style={{ fontFamily: 'Arial', fontWeight: 'bold', fontSize: '14px' }}>NAJBARDZIEJ DOPIERDOLONE LOGO EVER</p>
      </div>

      <style>{`
        @keyframes rotate3d {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LogoGenerator;