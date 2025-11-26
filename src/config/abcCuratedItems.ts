/**
 * Curated ABC items for themed alphabet books
 * Each letter has 2-3 age-appropriate options that the agent can choose from
 */

export type ABCThemeType = 
  | 'animals'
  | 'food'
  | 'nature'
  | 'vehicles'
  | 'mixed'
  | 'around-the-mountain'
  | 'snowboarding';

export interface LetterOptions {
  [letter: string]: string[];
}

export const ABC_CURATED_ITEMS: Record<ABCThemeType, LetterOptions> = {
  'animals': {
    A: ['Alligator', 'Ant', 'Anteater'],
    B: ['Bear', 'Butterfly', 'Bee'],
    C: ['Cat', 'Cow', 'Caterpillar'],
    D: ['Dog', 'Duck', 'Dolphin'],
    E: ['Elephant', 'Eagle', 'Emu'],
    F: ['Fox', 'Frog', 'Fish'],
    G: ['Giraffe', 'Gorilla', 'Goat'],
    H: ['Horse', 'Hippo', 'Hedgehog'],
    I: ['Iguana', 'Ibis'],
    J: ['Jaguar', 'Jellyfish'],
    K: ['Kangaroo', 'Koala', 'Kiwi'],
    L: ['Lion', 'Llama', 'Leopard'],
    M: ['Monkey', 'Mouse', 'Moose'],
    N: ['Newt', 'Narwhal'],
    O: ['Owl', 'Octopus', 'Otter'],
    P: ['Penguin', 'Pig', 'Panda'],
    Q: ['Quail', 'Queen Bee'],
    R: ['Rabbit', 'Raccoon', 'Rhinoceros'],
    S: ['Snake', 'Squirrel', 'Seal'],
    T: ['Tiger', 'Turtle', 'Turkey'],
    U: ['Urchin', 'Umbrellabird'],
    V: ['Vulture', 'Viper'],
    W: ['Wolf', 'Whale', 'Walrus'],
    X: ['X-ray Fish', 'Xenops'],
    Y: ['Yak', 'Yellow Jacket'],
    Z: ['Zebra', 'Zebu']
  },
  
  'food': {
    A: ['Apple', 'Avocado', 'Apricot'],
    B: ['Banana', 'Bread', 'Broccoli'],
    C: ['Carrot', 'Cookie', 'Corn'],
    D: ['Donut', 'Date', 'Dragon Fruit'],
    E: ['Egg', 'Eggplant'],
    F: ['Fish', 'Fries', 'Fig'],
    G: ['Grapes', 'Grapefruit', 'Guava'],
    H: ['Hot Dog', 'Honey', 'Ham'],
    I: ['Ice Cream', 'Ice Pop'],
    J: ['Juice', 'Jam', 'Jellybean'],
    K: ['Kiwi', 'Kale'],
    L: ['Lemon', 'Lettuce', 'Lollipop'],
    M: ['Milk', 'Muffin', 'Mango'],
    N: ['Noodles', 'Nut', 'Nectarine'],
    O: ['Orange', 'Olive', 'Oatmeal'],
    P: ['Pizza', 'Pear', 'Popcorn'],
    Q: ['Quiche', 'Quinoa'],
    R: ['Rice', 'Raisin', 'Radish'],
    S: ['Strawberry', 'Sandwich', 'Soup'],
    T: ['Tomato', 'Toast', 'Taco'],
    U: ['Udon', 'Upside-down Cake'],
    V: ['Vegetable', 'Vanilla'],
    W: ['Watermelon', 'Waffle', 'Walnut'],
    X: ['Xigua (Chinese Watermelon)'],
    Y: ['Yogurt', 'Yam'],
    Z: ['Zucchini', 'Ziti']
  },
  
  'nature': {
    A: ['Acorn', 'Acacia Tree'],
    B: ['Butterfly', 'Branch', 'Brook'],
    C: ['Cloud', 'Creek', 'Clover'],
    D: ['Dandelion', 'Dew', 'Daisy'],
    E: ['Earth', 'Evergreen'],
    F: ['Flower', 'Fern', 'Forest'],
    G: ['Grass', 'Garden', 'Grove'],
    H: ['Hill', 'Honeybee', 'Hive'],
    I: ['Ivy', 'Island'],
    J: ['Jungle', 'Jay (bird)'],
    K: ['Kelp', 'Kite (bird)'],
    L: ['Leaf', 'Lake', 'Lightning'],
    M: ['Mountain', 'Moon', 'Meadow'],
    N: ['Nest', 'Night Sky'],
    O: ['Ocean', 'Oak Tree', 'Orchid'],
    P: ['Pine Tree', 'Pebble', 'Pond'],
    Q: ['Quartz', 'Quiet Stream'],
    R: ['River', 'Rock', 'Rainbow'],
    S: ['Sun', 'Stone', 'Stream'],
    T: ['Tree', 'Thunder', 'Tide'],
    U: ['Umbrella Leaf'],
    V: ['Valley', 'Vine', 'Volcano'],
    W: ['Waterfall', 'Wind', 'Willow'],
    X: ['Xerophyte (Desert Plant)'],
    Y: ['Yew Tree', 'Yellow Flower'],
    Z: ['Zinnia', 'Zen Garden']
  },
  
  'vehicles': {
    A: ['Airplane', 'Ambulance', 'ATV'],
    B: ['Bus', 'Boat', 'Bicycle'],
    C: ['Car', 'Crane', 'Cement Truck'],
    D: ['Dump Truck', 'Digger'],
    E: ['Excavator', 'Engine (train)'],
    F: ['Fire Truck', 'Ferry', 'Fork Lift'],
    G: ['Garbage Truck', 'Go-Kart'],
    H: ['Helicopter', 'Hot Air Balloon', 'Hovercraft'],
    I: ['Ice Cream Truck'],
    J: ['Jet', 'Jeep'],
    K: ['Kayak', 'Kite'],
    L: ['Limousine', 'Loader'],
    M: ['Motorcycle', 'Monster Truck'],
    N: ['NASCAR', 'Navy Ship'],
    O: ['Oil Tanker'],
    P: ['Police Car', 'Plane', 'Pickup Truck'],
    Q: ['Quad Bike'],
    R: ['Race Car', 'Rocket', 'Rowboat'],
    S: ['Submarine', 'Scooter', 'Sailboat'],
    T: ['Train', 'Tractor', 'Taxi'],
    U: ['Unicycle', 'Utility Truck'],
    V: ['Van', 'Vespa'],
    W: ['Wagon', 'Water Ski'],
    X: ['X-15 (Experimental Plane)'],
    Y: ['Yacht', 'Yellow Bus'],
    Z: ['Zamboni', 'Zeppelin']
  },
  
  'mixed': {
    A: ['Apple', 'Alligator', 'Airplane'],
    B: ['Ball', 'Bear', 'Boat'],
    C: ['Cat', 'Car', 'Cookie'],
    D: ['Dog', 'Drum', 'Door'],
    E: ['Elephant', 'Egg', 'Ear'],
    F: ['Fish', 'Flower', 'Fire Truck'],
    G: ['Goat', 'Grapes', 'Guitar'],
    H: ['Horse', 'Hat', 'House'],
    I: ['Ice Cream', 'Iguana', 'Igloo'],
    J: ['Jump Rope', 'Jellyfish', 'Juice'],
    K: ['Kite', 'Kangaroo', 'Key'],
    L: ['Lion', 'Leaf', 'Lemon'],
    M: ['Moon', 'Monkey', 'Milk'],
    N: ['Nest', 'Nose', 'Nut'],
    O: ['Octopus', 'Orange', 'Owl'],
    P: ['Pig', 'Pizza', 'Penguin'],
    Q: ['Queen', 'Quilt', 'Question Mark'],
    R: ['Rainbow', 'Rabbit', 'Ring'],
    S: ['Sun', 'Snake', 'Star'],
    T: ['Tiger', 'Tree', 'Turtle'],
    U: ['Umbrella', 'Unicorn'],
    V: ['Volcano', 'Violin', 'Vest'],
    W: ['Whale', 'Watermelon', 'Watch'],
    X: ['Xylophone', 'X-ray'],
    Y: ['Yo-yo', 'Yak', 'Yarn'],
    Z: ['Zebra', 'Zipper', 'Zoo']
  },
  
  'around-the-mountain': {
    A: ['Alpine Flower', 'Altitude Sign', 'Avalanche Path'],
    B: ['Boulder', 'Base Camp', 'Backpack'],
    C: ['Cliff', 'Chairlift', 'Compass'],
    D: ['Downhill Trail', 'Den (animal home)'],
    E: ['Eagle', 'Echo', 'Evergreen'],
    F: ['Forest', 'Flag (summit)', 'Footbridge'],
    G: ['Glacier', 'Gondola', 'Goat (mountain)'],
    H: ['Hiking Boot', 'Hill', 'Hut'],
    I: ['Ice', 'Icicle'],
    J: ['Jacket', 'Jay (bird)'],
    K: ['Kayak (mountain lake)'],
    L: ['Lodge', 'Lake', 'Lookout'],
    M: ['Mountain Peak', 'Marmot', 'Map'],
    N: ['North Face', 'Nature Trail'],
    O: ['Overlook', 'Outcrop'],
    P: ['Path', 'Pine Tree', 'Peak'],
    Q: ['Quarry', 'Quiet Valley'],
    R: ['Ridge', 'Rock', 'River'],
    S: ['Summit', 'Stream', 'Snow'],
    T: ['Trail', 'Tent', 'Timber'],
    U: ['Uphill Climb'],
    V: ['Valley', 'Vista', 'Village'],
    W: ['Waterfall', 'Wildlife', 'Wind'],
    X: ['X-Marks-the-Spot (trail marker)'],
    Y: ['Yellow Wildflower', 'Yurt'],
    Z: ['Zigzag Trail', 'Zone (altitude)']
  },
  
  'snowboarding': {
    A: ['Aerial', 'Air', 'Alley-Oop'],
    B: ['Board', 'Backside', 'Binding'],
    C: ['Carve', 'Chairlift', 'Cornice'],
    D: ['Drop', 'Deck', 'Downhill'],
    E: ['Edge', 'Eject'],
    F: ['Freestyle', 'Fakie', 'Fifty-Fifty'],
    G: ['Grab', 'Goofy', 'Grind'],
    H: ['Halfpipe', 'Heel Edge', 'High Five'],
    I: ['Indy Grab', 'Invert'],
    J: ['Jump', 'Jib', 'Japan Grab'],
    K: ['Kicker', 'Knuckle'],
    L: ['Landing', 'Lift', 'Lip (of jump)'],
    M: ['Method', 'Mute Grab', 'Mountain'],
    N: ['Nose Grab', 'Nollie'],
    O: ['Ollie', 'Off-Axis'],
    P: ['Park', 'Powder', 'Pipe'],
    Q: ['Quarter Pipe'],
    R: ['Rail', 'Run', 'Regular'],
    S: ['Slope', 'Spin', 'Stomp'],
    T: ['Terrain Park', 'Toe Edge', 'Tail'],
    U: ['Underflip', 'Uphill'],
    V: ['Vert', 'Vitelli Flip'],
    W: ['Wipe Out', 'Wildcat', 'Wall Ride'],
    X: ['X-Games'],
    Y: ['Yard Sale', 'Yawning (halfpipe)'],
    Z: ['Zeach (flat landing)', 'Zone (landing)']
  }
};

/**
 * Get available items for a specific letter and theme
 */
export function getCuratedItemsForLetter(
  letter: string,
  theme: ABCThemeType
): string[] {
  const upperLetter = letter.toUpperCase();
  return ABC_CURATED_ITEMS[theme]?.[upperLetter] || [];
}

/**
 * Get all curated items for a theme
 */
export function getCuratedItemsForTheme(theme: ABCThemeType): LetterOptions {
  return ABC_CURATED_ITEMS[theme] || {};
}

/**
 * Format curated items as a reference string for the AI agent
 */
export function formatCuratedItemsForAgent(theme: ABCThemeType): string {
  const items = ABC_CURATED_ITEMS[theme];
  if (!items) return '';
  
  const lines = Object.entries(items).map(([letter, options]) => {
    return `${letter}: ${options.join(' / ')}`;
  });
  
  return `CURATED ITEMS FOR ${theme.toUpperCase().replace(/-/g, ' ')}:\n${lines.join('\n')}`;
}
