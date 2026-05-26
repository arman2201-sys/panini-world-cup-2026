export const TOTAL_STICKERS = 980;
export const STICKERS_PER_TEAM = 20;
export const FWC_STICKERS = 20;

export type Language = "da" | "bs" | "en";

export type Team = {
  id: string;
  flag: string;
  flagCode: string;
  abbr: string;
  name: Record<Language, string>;
  start: number;
  end: number;
};

export type StickerGroup = {
  id: string;
  letter: string;
  teams: Team[];
};

const teamSeeds: Array<{
  id: string;
  flag: string;
  flagCode: string;
  abbr: string;
  name: Record<Language, string>;
}> = [
  { id: "mex", flag: "🇲🇽", flagCode: "mx", abbr: "MEX", name: { da: "Mexico", bs: "Meksiko", en: "Mexico" } },
  { id: "rsa", flag: "🇿🇦", flagCode: "za", abbr: "RSA", name: { da: "Sydafrika", bs: "Južna Afrika", en: "South Africa" } },
  { id: "kor", flag: "🇰🇷", flagCode: "kr", abbr: "KOR", name: { da: "Sydkorea", bs: "Južna Koreja", en: "South Korea" } },
  { id: "cze", flag: "🇨🇿", flagCode: "cz", abbr: "CZE", name: { da: "Tjekkiet", bs: "Češka", en: "Czechia" } },

  { id: "can", flag: "🇨🇦", flagCode: "ca", abbr: "CAN", name: { da: "Canada", bs: "Kanada", en: "Canada" } },
  { id: "bih", flag: "🇧🇦", flagCode: "ba", abbr: "BIH", name: { da: "Bosnien-Hercegovina", bs: "Bosna i Hercegovina", en: "Bosnia and Herzegovina" } },
  { id: "qat", flag: "🇶🇦", flagCode: "qa", abbr: "QAT", name: { da: "Qatar", bs: "Katar", en: "Qatar" } },
  { id: "sui", flag: "🇨🇭", flagCode: "ch", abbr: "SUI", name: { da: "Schweiz", bs: "Švicarska", en: "Switzerland" } },

  { id: "bra", flag: "🇧🇷", flagCode: "br", abbr: "BRA", name: { da: "Brasilien", bs: "Brazil", en: "Brazil" } },
  { id: "mar", flag: "🇲🇦", flagCode: "ma", abbr: "MAR", name: { da: "Marokko", bs: "Maroko", en: "Morocco" } },
  { id: "hai", flag: "🇭🇹", flagCode: "ht", abbr: "HAI", name: { da: "Haiti", bs: "Haiti", en: "Haiti" } },
  { id: "sco", flag: "🏴", flagCode: "gb-sct", abbr: "SCO", name: { da: "Skotland", bs: "Škotska", en: "Scotland" } },

  { id: "usa", flag: "🇺🇸", flagCode: "us", abbr: "USA", name: { da: "USA", bs: "Sjedinjene Američke Države", en: "United States" } },
  { id: "par", flag: "🇵🇾", flagCode: "py", abbr: "PAR", name: { da: "Paraguay", bs: "Paragvaj", en: "Paraguay" } },
  { id: "aus", flag: "🇦🇺", flagCode: "au", abbr: "AUS", name: { da: "Australien", bs: "Australija", en: "Australia" } },
  { id: "tur", flag: "🇹🇷", flagCode: "tr", abbr: "TUR", name: { da: "Tyrkiet", bs: "Turska", en: "Türkiye" } },

  { id: "ger", flag: "🇩🇪", flagCode: "de", abbr: "GER", name: { da: "Tyskland", bs: "Njemačka", en: "Germany" } },
  { id: "cuw", flag: "🇨🇼", flagCode: "cw", abbr: "CUW", name: { da: "Curaçao", bs: "Curaçao", en: "Curaçao" } },
  { id: "civ", flag: "🇨🇮", flagCode: "ci", abbr: "CIV", name: { da: "Elfenbenskysten", bs: "Obala Slonovače", en: "Côte d'Ivoire" } },
  { id: "ecu", flag: "🇪🇨", flagCode: "ec", abbr: "ECU", name: { da: "Ecuador", bs: "Ekvador", en: "Ecuador" } },

  { id: "ned", flag: "🇳🇱", flagCode: "nl", abbr: "NED", name: { da: "Nederlandene", bs: "Nizozemska", en: "Netherlands" } },
  { id: "jpn", flag: "🇯🇵", flagCode: "jp", abbr: "JPN", name: { da: "Japan", bs: "Japan", en: "Japan" } },
  { id: "swe", flag: "🇸🇪", flagCode: "se", abbr: "SWE", name: { da: "Sverige", bs: "Švedska", en: "Sweden" } },
  { id: "tun", flag: "🇹🇳", flagCode: "tn", abbr: "TUN", name: { da: "Tunesien", bs: "Tunis", en: "Tunisia" } },

  { id: "bel", flag: "🇧🇪", flagCode: "be", abbr: "BEL", name: { da: "Belgien", bs: "Belgija", en: "Belgium" } },
  { id: "egy", flag: "🇪🇬", flagCode: "eg", abbr: "EGY", name: { da: "Egypten", bs: "Egipat", en: "Egypt" } },
  { id: "irn", flag: "🇮🇷", flagCode: "ir", abbr: "IRN", name: { da: "Iran", bs: "Iran", en: "Iran" } },
  { id: "nzl", flag: "🇳🇿", flagCode: "nz", abbr: "NZL", name: { da: "New Zealand", bs: "Novi Zeland", en: "New Zealand" } },

  { id: "esp", flag: "🇪🇸", flagCode: "es", abbr: "ESP", name: { da: "Spanien", bs: "Španija", en: "Spain" } },
  { id: "cpv", flag: "🇨🇻", flagCode: "cv", abbr: "CPV", name: { da: "Kap Verde", bs: "Zelenortska Ostrva", en: "Cape Verde" } },
  { id: "ksa", flag: "🇸🇦", flagCode: "sa", abbr: "KSA", name: { da: "Saudi-Arabien", bs: "Saudijska Arabija", en: "Saudi Arabia" } },
  { id: "uru", flag: "🇺🇾", flagCode: "uy", abbr: "URU", name: { da: "Uruguay", bs: "Urugvaj", en: "Uruguay" } },

  { id: "fra", flag: "🇫🇷", flagCode: "fr", abbr: "FRA", name: { da: "Frankrig", bs: "Francuska", en: "France" } },
  { id: "sen", flag: "🇸🇳", flagCode: "sn", abbr: "SEN", name: { da: "Senegal", bs: "Senegal", en: "Senegal" } },
  { id: "irq", flag: "🇮🇶", flagCode: "iq", abbr: "IRQ", name: { da: "Irak", bs: "Irak", en: "Iraq" } },
  { id: "nor", flag: "🇳🇴", flagCode: "no", abbr: "NOR", name: { da: "Norge", bs: "Norveška", en: "Norway" } },

  { id: "arg", flag: "🇦🇷", flagCode: "ar", abbr: "ARG", name: { da: "Argentina", bs: "Argentina", en: "Argentina" } },
  { id: "alg", flag: "🇩🇿", flagCode: "dz", abbr: "ALG", name: { da: "Algeriet", bs: "Alžir", en: "Algeria" } },
  { id: "aut", flag: "🇦🇹", flagCode: "at", abbr: "AUT", name: { da: "Østrig", bs: "Austrija", en: "Austria" } },
  { id: "jor", flag: "🇯🇴", flagCode: "jo", abbr: "JOR", name: { da: "Jordan", bs: "Jordan", en: "Jordan" } },

  { id: "por", flag: "🇵🇹", flagCode: "pt", abbr: "POR", name: { da: "Portugal", bs: "Portugal", en: "Portugal" } },
  { id: "cod", flag: "🇨🇩", flagCode: "cd", abbr: "COD", name: { da: "DR Congo", bs: "DR Kongo", en: "DR Congo" } },
  { id: "uzb", flag: "🇺🇿", flagCode: "uz", abbr: "UZB", name: { da: "Usbekistan", bs: "Uzbekistan", en: "Uzbekistan" } },
  { id: "col", flag: "🇨🇴", flagCode: "co", abbr: "COL", name: { da: "Colombia", bs: "Kolumbija", en: "Colombia" } },

  { id: "eng", flag: "🏴", flagCode: "gb-eng", abbr: "ENG", name: { da: "England", bs: "Engleska", en: "England" } },
  { id: "cro", flag: "🇭🇷", flagCode: "hr", abbr: "CRO", name: { da: "Kroatien", bs: "Hrvatska", en: "Croatia" } },
  { id: "gha", flag: "🇬🇭", flagCode: "gh", abbr: "GHA", name: { da: "Ghana", bs: "Gana", en: "Ghana" } },
  { id: "pan", flag: "🇵🇦", flagCode: "pa", abbr: "PAN", name: { da: "Panama", bs: "Panama", en: "Panama" } }
];

export const groups: StickerGroup[] = Array.from({ length: 12 }, (_, groupIndex) => {
  const letter = String.fromCharCode(65 + groupIndex);
  const teams = teamSeeds.slice(groupIndex * 4, groupIndex * 4 + 4).map((team, teamIndex) => {
    const overallTeamIndex = groupIndex * 4 + teamIndex;
    const start = FWC_STICKERS + overallTeamIndex * STICKERS_PER_TEAM + 1;
    return {
      ...team,
      start,
      end: start + STICKERS_PER_TEAM - 1
    };
  });

  return {
    id: `group-${letter.toLowerCase()}`,
    letter,
    teams
  };
});

export const fwcRange = {
  start: 1,
  end: FWC_STICKERS,
  total: FWC_STICKERS
};

export function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function isValidStickerNumber(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= TOTAL_STICKERS;
}

export function stickerGroupLabel(letter: string, language: Language) {
  if (language === "bs") {
    return `Grupa ${letter}`;
  }

  return language === "en" ? `Group ${letter}` : `Gruppe ${letter}`;
}

export type StickerReference = {
  globalNumber: number;
  localNumber: number;
  section: "fwc" | "team";
  abbr: "FWC" | string;
  countryName: string;
  label: string;
};

export function getStickerReference(sticker: number, language: Language): StickerReference | undefined {
  if (!isValidStickerNumber(sticker)) {
    return undefined;
  }

  if (sticker >= fwcRange.start && sticker <= fwcRange.end) {
    const countryName =
      language === "da"
        ? "FIFA World Cup-klistermærker"
        : language === "bs"
          ? "FIFA World Cup sličice"
          : "FIFA World Cup stickers";

    return {
      globalNumber: sticker,
      localNumber: sticker,
      section: "fwc",
      abbr: "FWC",
      countryName,
      label: `${countryName} (FWC) ${sticker}`
    };
  }

  for (const group of groups) {
    for (const team of group.teams) {
      if (sticker >= team.start && sticker <= team.end) {
        const localNumber = sticker - team.start + 1;
        const countryName = team.name[language];
        return {
          globalNumber: sticker,
          localNumber,
          section: "team",
          abbr: team.abbr,
          countryName,
          label: `${countryName} (${team.abbr}) ${localNumber}`
        };
      }
    }
  }

  return undefined;
}

export function formatStickerReferences(stickers: number[], language: Language) {
  return stickers
    .map((sticker) => getStickerReference(sticker, language)?.label)
    .filter(Boolean)
    .join(", ");
}

export function parseStickerReferences(value: string) {
  const stickers: number[] = [];
  const fwcPattern = /(?:FIFA\s+World\s+Cup\s+stickers\s*)?\(?FWC\)?\s*(\d{1,2})/gi;
  const teamPattern = /\(([A-Z]{3})\)\s*(\d{1,2})/g;
  let match: RegExpExecArray | null;

  while ((match = fwcPattern.exec(value)) !== null) {
    const localNumber = Number(match[1]);
    if (localNumber >= fwcRange.start && localNumber <= fwcRange.end) {
      stickers.push(localNumber);
    }
  }

  while ((match = teamPattern.exec(value)) !== null) {
    const abbr = match[1];
    const localNumber = Number(match[2]);
    const team = groups.flatMap((group) => group.teams).find((candidate) => candidate.abbr === abbr);
    if (team && localNumber >= 1 && localNumber <= STICKERS_PER_TEAM) {
      stickers.push(team.start + localNumber - 1);
    }
  }

  return Array.from(new Set(stickers)).sort((a, b) => a - b);
}

export function stickerMatchesSearch(sticker: number, query: string, language: Language) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) {
    return true;
  }

  const reference = getStickerReference(sticker, language);
  if (!reference) {
    return false;
  }

  const searchText = normalizeSearch(
    [
      reference.label,
      reference.abbr,
      reference.countryName,
      String(reference.localNumber),
      String(reference.globalNumber),
      reference.section === "fwc" ? "FWC FIFA World Cup" : ""
    ].join(" ")
  );

  return searchText.includes(normalizedQuery);
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
