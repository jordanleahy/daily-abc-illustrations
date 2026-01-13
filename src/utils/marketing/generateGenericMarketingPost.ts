/**
 * Generates a generic social media marketing post for any book type
 * Designed for Instagram, Facebook, and LinkedIn
 * 
 * AGGRESSIVE HASHTAG STRATEGY: Generates 25-30+ hashtags from metadata
 */

interface GenericMarketingPostParams {
  bookName: string;
  bookDescription: string | null;
  characterTheme: string | null;
  marketingUrl: string;
  bookType?: string | null;
  // Discovery attributes for dynamic hashtags
  season?: string | null;
  environment?: string | null;
  clothingBrand?: string | null;
  location?: string | null;
  // Extended metadata for aggressive hashtags
  selectedCharacterIds?: string[] | null;
  targetAge?: string | null;
  city?: string | null;
}

/**
 * Formats character theme for display
 */
function formatTheme(theme: string | null): string {
  if (!theme || theme === 'no-theme') return '';
  
  const themeMap: Record<string, string> = {
    'paw-patrol': 'Paw Patrol',
    'frozen': 'Frozen',
    'peppa-pig': 'Peppa Pig',
    'bluey': 'Bluey',
    'cocomelon': 'Cocomelon',
    'moana': 'Moana',
    'mickey-mouse': 'Mickey Mouse',
    'mario': 'Mario',
    'sesame-street': 'Sesame Street',
    'benji-davies': 'Benji Davies Style',
    'black-and-white': 'Classic',
    'bear-stories': 'Bear Stories',
  };
  
  return themeMap[theme] || theme;
}

/**
 * Gets hashtag for character theme
 */
function getThemeHashtag(theme: string | null): string {
  if (!theme || theme === 'no-theme' || theme === 'black-and-white') return '';
  
  const formatted = formatTheme(theme).replace(/\s+/g, '');
  return `#${formatted}`;
}

/**
 * Gets book type display name and hashtag
 */
function getBookTypeInfo(bookType: string | null): { displayName: string; hashtag: string } {
  if (!bookType) return { displayName: 'learning', hashtag: '#earlylearning' };
  
  const typeMap: Record<string, { displayName: string; hashtag: string }> = {
    'abc': { displayName: 'ABC', hashtag: '#ABCBooks' },
    'numbers': { displayName: 'Numbers', hashtag: '#NumberBooks' },
    'colors': { displayName: 'Colors', hashtag: '#ColorBooks' },
    'shapes': { displayName: 'Shapes', hashtag: '#ShapeBooks' },
    'animals': { displayName: 'Animals', hashtag: '#AnimalBooks' },
    'rhyming': { displayName: 'Rhyming', hashtag: '#RhymingBooks' },
    'opposites': { displayName: 'Opposites', hashtag: '#OppositesBooks' },
    'emotions': { displayName: 'Emotions', hashtag: '#EmotionBooks' },
    'first-words': { displayName: 'First Words', hashtag: '#FirstWords' },
    'bedtime': { displayName: 'Bedtime', hashtag: '#BedtimeStories' },
    'cvc': { displayName: 'CVC Words', hashtag: '#CVCWords' },
    'sight-words': { displayName: 'Sight Words', hashtag: '#SightWords' },
    'digraphs': { displayName: 'Digraphs', hashtag: '#Digraphs' },
  };
  
  return typeMap[bookType] || { displayName: 'learning', hashtag: '#earlylearning' };
}

/**
 * Gets education-focused hashtags based on book type
 */
function getEducationHashtags(bookType: string | null): string[] {
  const baseHashtags = ['#LearnToRead', '#EarlyLiteracy', '#PhonicsForKids'];
  
  const typeSpecificHashtags: Record<string, string[]> = {
    'abc': ['#AlphabetLearning', '#LetterRecognition', '#ABCFun'],
    'sight-words': ['#SightWordPractice', '#ReadingFluency', '#HighFrequencyWords'],
    'digraphs': ['#PhonicsRules', '#BlendingSounds', '#ReadingSkills'],
    'cvc': ['#CVCPractice', '#DecodingSkills', '#PhonicsBasics'],
    'numbers': ['#CountingForKids', '#NumberSense', '#MathForKids'],
    'rhyming': ['#RhymingWords', '#PhonologicalAwareness', '#RhymeTime'],
  };
  
  return [...baseHashtags, ...(typeSpecificHashtags[bookType || ''] || [])];
}

/**
 * Gets age/grade level hashtags
 */
function getAgeGradeHashtags(targetAge: string | null): string[] {
  const ageMap: Record<string, string[]> = {
    'toddler': ['#ToddlerMom', '#ToddlerActivities', '#ToddlerLife'],
    'preschool': ['#Preschool', '#PreschoolActivities', '#PreschoolMom', '#PreK'],
    'prek': ['#PreK', '#PreKActivities', '#PreschoolReading'],
    'kindergarten': ['#Kindergarten', '#KindergartenReading', '#KinderTeacher'],
    'first-grade': ['#FirstGrade', '#1stGrade', '#FirstGradeReading'],
  };
  
  // Default to preschool if no target age
  return ageMap[targetAge || 'preschool'] || ['#Preschool', '#PreK', '#Kindergarten'];
}

/**
 * Gets activity-type hashtags (always included)
 */
function getActivityHashtags(): string[] {
  return [
    '#ColoringBook',
    '#ColoringPages', 
    '#PrintableActivities',
    '#KidsActivities',
    '#ColoringFun',
  ];
}

/**
 * Gets parent/teacher audience hashtags (always included)
 */
function getAudienceHashtags(): string[] {
  return [
    '#MomLife',
    '#DadLife',
    '#ParentingWin',
    '#HomeschoolMom',
    '#TeacherResources',
    '#PreschoolTeacher',
  ];
}

/**
 * Gets hashtags for individual character selections
 */
function getCharacterHashtags(characterIds: string[] | null): string[] {
  if (!characterIds || characterIds.length === 0) return [];
  
  const characterMap: Record<string, string> = {
    // Bluey characters
    'bluey': '#Bluey',
    'bingo': '#Bingo',
    'bandit': '#Bandit',
    'chilli': '#Chilli',
    // Paw Patrol characters
    'chase': '#Chase',
    'marshall': '#Marshall',
    'skye': '#Skye',
    'rubble': '#Rubble',
    'rocky': '#Rocky',
    'zuma': '#Zuma',
    'everest': '#Everest',
    // Frozen characters
    'elsa': '#Elsa',
    'anna': '#Anna',
    'olaf': '#Olaf',
    'kristoff': '#Kristoff',
    // Peppa Pig characters
    'peppa': '#PeppaPig',
    'george': '#GeorgePig',
    // Cocomelon characters
    'jj': '#JJ',
    'coco': '#Coco',
    // Moana characters  
    'moana': '#Moana',
    'maui': '#Maui',
    // Mickey Mouse characters
    'mickey': '#MickeyMouse',
    'minnie': '#MinnieMouse',
    'donald': '#DonaldDuck',
    'goofy': '#Goofy',
    // Mario characters
    'mario': '#Mario',
    'luigi': '#Luigi',
    'peach': '#PrincessPeach',
    'yoshi': '#Yoshi',
    // Sesame Street characters
    'elmo': '#Elmo',
    'cookie-monster': '#CookieMonster',
    'big-bird': '#BigBird',
    'oscar': '#OscarTheGrouch',
  };
  
  return characterIds
    .map(id => characterMap[id.toLowerCase()])
    .filter(Boolean) as string[];
}

/**
 * Gets hashtags for season with additional seasonal events
 */
function getSeasonHashtags(season: string | null): string[] {
  if (!season) return [];
  
  const seasonMap: Record<string, string[]> = {
    'SPRING': ['#SpringReads', '#SpringActivities', '#SpringBreak'],
    'SUMMER': ['#SummerReading', '#SummerActivities', '#SummerBreak', '#SummerFun'],
    'FALL': ['#FallBooks', '#FallActivities', '#BackToSchool', '#AutumnReading'],
    'WINTER': ['#WinterReading', '#WinterBreak', '#SnowDay', '#WinterActivities'],
  };
  
  return seasonMap[season.toUpperCase()] || [];
}

/**
 * Gets hashtags for environment with expanded options
 */
function getEnvironmentHashtags(env: string | null): string[] {
  if (!env) return [];
  
  const envMap: Record<string, string[]> = {
    'SNOWBOARD_RESORT': ['#Snowboarding', '#SnowboardKids', '#SnowboardLife', '#ShredTheGnar'],
    'SKI_RESORT': ['#Skiing', '#SkiKids', '#SkiFamily', '#SkiWithKids', '#SkiLife'],
    'ISLAND': ['#BeachLife', '#IslandAdventure', '#BeachKids', '#TropicalVacation'],
    'DESERT': ['#DesertAdventure', '#DesertVibes', '#OutdoorKids'],
    'MOUNTAIN': ['#MountainAdventure', '#MountainKids', '#HikingWithKids', '#NatureKids'],
    'CITY': ['#CityKids', '#UrbanAdventure', '#CityLife'],
    'PARK': ['#OutdoorKids', '#ParkPlay', '#NaturePlay'],
    'BEACH': ['#BeachDay', '#BeachKids', '#OceanLife', '#SandAndSun'],
  };
  
  return envMap[env.toUpperCase()] || [];
}

/**
 * Gets hashtags for clothing brand with lifestyle tags
 */
function getClothingBrandHashtags(brand: string | null): string[] {
  if (!brand || brand === 'NONE' || brand.toUpperCase() === 'NONE') return [];
  
  const brandMap: Record<string, string[]> = {
    'BURTON': ['#Burton', '#BurtonKids', '#BurtonSnowboards', '#BurtonFamily'],
    'PATAGONIA': ['#Patagonia', '#PatagoniaKids'],
    'NORTH_FACE': ['#TheNorthFace', '#NorthFaceKids'],
  };
  
  return brandMap[brand.toUpperCase()] || [];
}

/**
 * Gets hashtags for ski/snowboard resort locations - EXTRA HEAVY coverage
 */
function getLocationHashtags(loc: string | null): string[] {
  if (!loc) return [];
  
  const locationMap: Record<string, string[]> = {
    'VAIL_RESORT': [
      '#Vail', '#VailResort', '#VailMountain', '#VailColorado', '#SkiVail',
      '#VailSki', '#VailSnowboard', '#VailKids', '#VailFamily', '#VailCO'
    ],
    'SUGARBUSH_RESORT': [
      '#Sugarbush', '#SugarbushResort', '#SugarbushMountain', '#SugarbushVT',
      '#Vermont', '#VermontSki', '#MadRiver', '#MadRiverValley', '#SkiVermont'
    ],
    'STRATTON': [
      '#Stratton', '#StrattonMountain', '#StrattonResort', '#StrattonVT',
      '#VermontSki', '#StrattonVermont', '#SkiStratton', '#StrattonKids'
    ],
    'KILLINGTON': [
      '#Killington', '#KillingtonResort', '#KillingtonMountain', '#KillingtonVT',
      '#BeastOfTheEast', '#VermontSki', '#SkiKillington', '#KillingtonVermont',
      '#KillingtonKids', '#KillingtonSki', '#KillingtonSnowboard'
    ],
    'MOUNTAIN_CREEK': [
      '#MountainCreek', '#MountainCreekResort', '#MountainCreekNJ',
      '#NJSki', '#NewJerseySki', '#SkiNJ', '#MountainCreekKids'
    ],
    'COPPER_MOUNTAIN': [
      '#CopperMountain', '#CopperMountainResort', '#CopperCO', '#CopperColorado',
      '#Colorado', '#ColoradoSki', '#SkiCopper', '#CopperKids'
    ],
    'BRECKENRIDGE': [
      '#Breckenridge', '#Breck', '#BreckResort', '#BreckenridgeColorado',
      '#BreckCO', '#ColoradoSki', '#BreckLife', '#SkiBreck', '#BreckKids'
    ],
    'KEYSTONE': [
      '#Keystone', '#KeystoneResort', '#KeystoneMountain', '#KeystoneColorado',
      '#KeystoneCO', '#ColoradoSki', '#SkiKeystone', '#KeystoneKids'
    ],
    'PARK_CITY': [
      '#ParkCity', '#ParkCityResort', '#ParkCityMountain', '#ParkCityUtah',
      '#UtahSki', '#SkiParkCity', '#PCMR', '#ParkCityKids'
    ],
    'MAMMOTH': [
      '#MammothMountain', '#Mammoth', '#MammothLakes', '#MammothCA',
      '#CaliforniaSki', '#SkiMammoth', '#MammothKids', '#MammothResort'
    ],
    'STEAMBOAT': [
      '#Steamboat', '#SteamboatSprings', '#SteamboatResort', '#SteamboatCO',
      '#ColoradoSki', '#SkiSteamboat', '#SteamboatKids', '#SteamboatMountain'
    ],
    'ASPEN': [
      '#Aspen', '#AspenSnowmass', '#AspenMountain', '#AspenColorado',
      '#AspenCO', '#ColoradoSki', '#SkiAspen', '#AspenKids', '#Snowmass'
    ],
    'JACKSON_HOLE': [
      '#JacksonHole', '#JacksonHoleMountain', '#JacksonHoleResort', '#JHMR',
      '#Wyoming', '#JHMountainResort', '#SkiJacksonHole', '#JacksonHoleKids'
    ],
    'DEER_VALLEY': [
      '#DeerValley', '#DeerValleyResort', '#DeerValleyUtah', '#UtahSki',
      '#SkiDeerValley', '#DeerValleyKids', '#DeerValleyMountain'
    ],
    'STOWE': [
      '#Stowe', '#StoweMountain', '#StoweMountainResort', '#StoweVT',
      '#VermontSki', '#SkiStowe', '#StoweVermont', '#StoweKids'
    ],
    'OKEMO': [
      '#Okemo', '#OkemoMountain', '#OkemoResort', '#OkemoVT',
      '#VermontSki', '#SkiOkemo', '#OkemoVermont', '#OkemoKids'
    ],
    'MOUNT_SNOW': [
      '#MountSnow', '#MtSnow', '#MountSnowResort', '#MountSnowVT',
      '#VermontSki', '#SkiMountSnow', '#MountSnowKids'
    ],
    'JAY_PEAK': [
      '#JayPeak', '#JayPeakResort', '#JayPeakVT', '#VermontSki',
      '#SkiJayPeak', '#JayPeakVermont', '#JayPeakKids'
    ],
    'WHITEFACE': [
      '#Whiteface', '#WhitefaceMountain', '#WhitefaceNY', '#LakePlacid',
      '#AdirondacksSki', '#SkiWhiteface', '#WhitefaceKids'
    ],
    'HUNTER': [
      '#HunterMountain', '#Hunter', '#HunterNY', '#CatskillsSki',
      '#SkiHunter', '#HunterMountainNY', '#HunterKids'
    ],
    'WINDHAM': [
      '#Windham', '#WindhamMountain', '#WindhamNY', '#CatskillsSki',
      '#SkiWindham', '#WindhamKids'
    ],
  };
  
  return locationMap[loc.toUpperCase()] || [];
}

/**
 * Gets city-specific hashtags
 */
function getCityHashtags(city: string | null): string[] {
  if (!city) return [];
  
  const cityMap: Record<string, string[]> = {
    'new-york': ['#NYCMom', '#NYCKids', '#NewYorkKids', '#NYCFamily'],
    'los-angeles': ['#LAMom', '#LAKids', '#LosAngelesFamily'],
    'chicago': ['#ChicagoMom', '#ChicagoKids', '#ChiTown'],
    'jersey-city': ['#JerseyCityMom', '#JCKids', '#JerseyCityFamily'],
    'hoboken': ['#HobokenMom', '#HobokenKids', '#HobokenFamily'],
    'denver': ['#DenverMom', '#DenverKids', '#ColoradoFamily'],
    'seattle': ['#SeattleMom', '#SeattleKids', '#PNWFamily'],
    'austin': ['#AustinMom', '#AustinKids', '#AustinFamily'],
    'miami': ['#MiamiMom', '#MiamiKids', '#MiamiFamily'],
    'boston': ['#BostonMom', '#BostonKids', '#BostonFamily'],
    'san-francisco': ['#SFMom', '#SFKids', '#BayAreaFamily'],
    'portland': ['#PortlandMom', '#PortlandKids', '#PDXFamily'],
  };
  
  // Try to match with flexible key formatting
  const normalizedCity = city.toLowerCase().replace(/\s+/g, '-');
  return cityMap[normalizedCity] || [];
}

/**
 * Deduplicates and limits hashtags
 */
function deduplicateHashtags(hashtags: string[], maxCount: number = 30): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const tag of hashtags) {
    const normalized = tag.toLowerCase();
    if (!seen.has(normalized) && tag.startsWith('#')) {
      seen.add(normalized);
      result.push(tag);
      if (result.length >= maxCount) break;
    }
  }
  
  return result;
}

export function generateGenericMarketingPost({
  bookName,
  bookDescription,
  characterTheme,
  marketingUrl,
  bookType,
  season,
  environment,
  clothingBrand,
  location,
  selectedCharacterIds,
  targetAge,
  city,
}: GenericMarketingPostParams): string {
  const themeName = formatTheme(characterTheme);
  const themeHashtag = getThemeHashtag(characterTheme);
  const { displayName: typeDisplayName, hashtag: typeHashtag } = getBookTypeInfo(bookType);
  
  // Build tagline
  let tagline = `🎨 NEW: ${bookName}`;
  if (themeName) {
    tagline += ` featuring ${themeName}!`;
  } else {
    tagline += `!`;
  }
  
  // Build description
  const description = bookDescription || `A fun ${typeDisplayName.toLowerCase()} adventure for early learners!`;
  
  // AGGRESSIVE HASHTAG COLLECTION - gather from ALL metadata sources
  const allHashtags: string[] = [
    // Core education hashtags
    '#phonics',
    typeHashtag,
    '#earlyreading',
    themeHashtag,
    
    // Education-focused (3-6 tags)
    ...getEducationHashtags(bookType),
    
    // Age/Grade level (3-4 tags)
    ...getAgeGradeHashtags(targetAge),
    
    // Activity type (5 tags - always included)
    ...getActivityHashtags(),
    
    // Parent/Teacher audience (6 tags - always included)
    ...getAudienceHashtags(),
    
    // Character-specific (0-4 tags depending on selection)
    ...getCharacterHashtags(selectedCharacterIds),
    
    // Seasonal (0-4 tags)
    ...getSeasonHashtags(season),
    
    // Environment (0-4 tags)
    ...getEnvironmentHashtags(environment),
    
    // Clothing brand (0-4 tags)
    ...getClothingBrandHashtags(clothingBrand),
    
    // Location/Resort (0-4 tags)
    ...getLocationHashtags(location),
    
    // City-specific (0-4 tags)
    ...getCityHashtags(city),
  ];
  
  // Deduplicate and limit to 30 (Instagram max)
  const finalHashtags = deduplicateHashtags(allHashtags.filter(Boolean), 30);
  
  // Assemble full post
  const post = `${tagline}

${description}

✅ Colorful illustrations
✅ Downloadable coloring pages
✅ Perfect for early readers

📚 Read free: ${marketingUrl}

${finalHashtags.join(' ')}`;

  return post;
}
