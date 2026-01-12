-- Create city_landmarks table for hyper-local landmark details
CREATE TABLE public.city_landmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id TEXT NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'landmark',
  description TEXT NOT NULL,
  visual_cues TEXT[] DEFAULT '{}',
  is_major BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast city lookups
CREATE INDEX idx_city_landmarks_city_id ON public.city_landmarks(city_id);
CREATE INDEX idx_city_landmarks_type ON public.city_landmarks(type);

-- Enable RLS
ALTER TABLE public.city_landmarks ENABLE ROW LEVEL SECURITY;

-- Anyone can view active landmarks
CREATE POLICY "Anyone can view active landmarks" 
  ON public.city_landmarks FOR SELECT 
  USING (is_active = true);

-- Service role can manage all landmarks
CREATE POLICY "Service role can manage landmarks" 
  ON public.city_landmarks FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_city_landmarks_updated_at
  BEFORE UPDATE ON public.city_landmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Jersey City landmarks
INSERT INTO public.city_landmarks (city_id, name, type, description, visual_cues, is_major, sort_order) VALUES
('JERSEY_CITY', 'Hamilton Park', 'park', 'Intimate neighborhood park in the heart of downtown with an ornate Victorian-era cast iron fountain as its centerpiece, surrounded by mature oak trees and historic brownstones', ARRAY['ornate Victorian fountain with tiered basins', 'black wrought iron fence', 'brick pathways', 'wooden benches', 'large oak trees', 'dog run area', 'chess tables'], true, 1),
('JERSEY_CITY', 'Van Vorst Park', 'park', 'Elegant 19th-century park with formal garden layout, central fountain, and tree-lined paths surrounded by Italianate and Federal-style rowhouses', ARRAY['central circular fountain', 'formal flower beds', 'cobblestone borders', 'historic gas-style lamp posts', 'tall elm trees'], true, 2),
('JERSEY_CITY', 'Liberty State Park', 'park', 'Expansive waterfront park with sweeping views of the Statue of Liberty and Ellis Island, featuring the historic Central Railroad of New Jersey Terminal', ARRAY['Statue of Liberty in background', 'empty sky memorial twin towers outline', 'restored train terminal building', 'waterfront promenade', 'Liberty Walk pathway'], true, 3),
('JERSEY_CITY', 'Lincoln Park', 'park', 'Large urban park featuring a spring-fed lake, historic stone bridges, and wooded trails in the Heights neighborhood', ARRAY['spring-fed lake', 'stone arch bridges', 'boathouse', 'wooded walking trails', 'athletic fields'], false, 4),
('JERSEY_CITY', 'Modcup Coffee', 'cafe', 'Local artisan coffee roastery in a converted industrial space with exposed brick and vintage roasting equipment visible', ARRAY['exposed brick walls', 'large industrial windows', 'vintage copper coffee roaster', 'reclaimed wood counters', 'pendant lighting'], false, 10),
('JERSEY_CITY', 'Bwe Kafe', 'cafe', 'Cozy Haitian-inspired coffee shop with colorful Caribbean decor and warm community atmosphere', ARRAY['bright turquoise and yellow accents', 'tropical plants', 'handpainted murals', 'small wooden tables'], false, 11),
('JERSEY_CITY', 'Torico Ice Cream', 'cafe', 'Beloved old-school ice cream parlor on Central Avenue with retro neon signage and classic parlor seating', ARRAY['vintage neon sign', 'red vinyl stools', 'glass display cases', 'checkered floor'], false, 12),
('JERSEY_CITY', 'Grove Street Pedestrian Plaza', 'street', 'Vibrant car-free plaza centered around the PATH station with outdoor dining, string lights, and the iconic Grove Street clock tower', ARRAY['brick pedestrian plaza', 'string lights overhead', 'outdoor cafe seating', 'PATH station entrance', 'historic clock tower'], true, 20),
('JERSEY_CITY', 'Paulus Hook', 'neighborhood', 'Historic waterfront neighborhood with tree-lined streets, Federal and Greek Revival rowhouses, and views of Manhattan skyline', ARRAY['cobblestone accent streets', 'historic brick rowhouses', 'Manhattan skyline backdrop', 'waterfront esplanade'], false, 21),
('JERSEY_CITY', 'The Heights', 'neighborhood', 'Elevated neighborhood along the Palisades with stunning views, diverse restaurants, and charming residential streets', ARRAY['steep hill streets', 'palisades cliff views', 'diverse storefronts on Central Ave', 'pre-war apartment buildings'], false, 22),
('JERSEY_CITY', 'Mana Contemporary', 'venue', 'Massive arts center in a converted tobacco warehouse featuring galleries, artist studios, and cultural programming', ARRAY['industrial brick exterior', 'large loading dock doors', 'contemporary art installations', 'open gallery spaces'], false, 30),
('JERSEY_CITY', 'Loews Jersey Theatre', 'venue', 'Magnificent 1929 movie palace with ornate Baroque interior, grand chandelier, and classic marquee on Journal Square', ARRAY['historic marquee with lights', 'ornate Baroque facade', 'grand interior chandelier', 'red velvet seats'], true, 31),
('JERSEY_CITY', 'Colgate Clock', 'landmark', 'Iconic 50-foot octagonal clock on the waterfront, a remnant of the former Colgate-Palmolive factory', ARRAY['giant octagonal clock face', 'waterfront location', 'industrial pier setting'], true, 32);

-- Seed Hoboken landmarks
INSERT INTO public.city_landmarks (city_id, name, type, description, visual_cues, is_major, sort_order) VALUES
('HOBOKEN', 'Church Square Park', 'park', 'Victorian-era park with distinctive gazebo bandstand, ancient trees, and surrounded by classic Hoboken brownstones', ARRAY['white Victorian gazebo', 'mature sycamore trees', 'iron fence perimeter', 'brick pathways', 'park benches'], true, 1),
('HOBOKEN', 'Pier A Park', 'park', 'Modern waterfront park built on a restored pier with lawn areas, playground, and panoramic Manhattan views', ARRAY['wooden pier decking', 'Manhattan skyline panorama', 'modern playground equipment', 'waterfront railing'], true, 2),
('HOBOKEN', 'Stevens Park', 'park', 'Hillside park adjacent to Stevens Institute with walking paths and commanding views of the Hudson River', ARRAY['terraced hillside', 'Hudson River views', 'stone retaining walls', 'mature trees'], false, 3),
('HOBOKEN', 'Elysian Park', 'park', 'Historic small park considered the birthplace of baseball, featuring plaques commemorating the first organized game', ARRAY['baseball history plaques', 'small grassy field', 'historic markers', 'residential surroundings'], false, 4),
('HOBOKEN', 'Benny Tudinos', 'cafe', 'Legendary pizzeria famous for enormous slices, with vintage pizzeria decor and bustling atmosphere', ARRAY['giant pizza slices', 'classic pizzeria counter', 'checkered tablecloths', 'neon open sign'], false, 10),
('HOBOKEN', 'Carlos Bakery', 'cafe', 'Famous bakery from Cake Boss with elaborate cake displays and Italian pastry cases', ARRAY['ornate cake displays', 'Italian bakery cases', 'red and white awning', 'decorative storefront'], true, 11),
('HOBOKEN', 'Empire Coffee', 'cafe', 'Cozy neighborhood coffee shop with exposed brick, local art on walls, and community bulletin boards', ARRAY['exposed brick interior', 'local artwork', 'community flyers', 'cozy seating nooks'], false, 12),
('HOBOKEN', 'Washington Street', 'street', 'Mile-long main street lined with restaurants, boutiques, and brownstones, the heart of Hoboken nightlife and shopping', ARRAY['continuous brownstone storefronts', 'outdoor cafe seating', 'tree-lined sidewalks', 'vintage street lamps'], true, 20),
('HOBOKEN', 'Hoboken Terminal', 'landmark', 'Magnificent Beaux-Arts train terminal with copper-clad waiting room, Tiffany glass ceiling, and ferry connections', ARRAY['Beaux-Arts architecture', 'copper and glass ceiling', 'historic ferry slips', 'grand waiting room'], true, 21),
('HOBOKEN', 'Stevens Institute of Technology', 'venue', 'Historic hilltop campus with Gothic and modern buildings overlooking the Hudson River', ARRAY['castle-like stone buildings', 'hilltop campus setting', 'Hudson River views', 'mix of historic and modern architecture'], true, 30),
('HOBOKEN', 'Sinatra Park', 'park', 'Waterfront park named for Hobokens famous son with walking paths, pier, and skyline views', ARRAY['Sinatra commemorative elements', 'waterfront walkway', 'fishing pier', 'Manhattan backdrop'], false, 31);

-- Seed NYC landmarks
INSERT INTO public.city_landmarks (city_id, name, type, description, visual_cues, is_major, sort_order) VALUES
('NEW_YORK_CITY', 'Central Park', 'park', 'Iconic 843-acre urban oasis with meadows, lakes, bridges, and the famous Bethesda Fountain and Bow Bridge', ARRAY['Bethesda Fountain and terrace', 'Bow Bridge over the lake', 'rowboats on the lake', 'Belvedere Castle', 'horse-drawn carriages', 'street performers'], true, 1),
('NEW_YORK_CITY', 'Washington Square Park', 'park', 'Greenwich Village landmark centered on the iconic marble arch, surrounded by NYU buildings and featuring street performers', ARRAY['Washington Square Arch', 'central fountain', 'chess players', 'street musicians', 'NYU buildings in background'], true, 2),
('NEW_YORK_CITY', 'Bryant Park', 'park', 'Elegant Midtown park behind the NY Public Library with French-style gardens, reading areas, and seasonal ice rink', ARRAY['green folding chairs', 'London plane trees', 'carousel', 'outdoor library', 'Midtown skyscrapers backdrop'], true, 3),
('NEW_YORK_CITY', 'High Line', 'park', 'Elevated linear park on former rail tracks with native plantings, art installations, and unique city views', ARRAY['elevated railway structure', 'native wildflower plantings', 'wooden deck loungers', 'industrial rail remnants', 'building-framed views'], true, 4),
('NEW_YORK_CITY', 'Times Square', 'landmark', 'Blazing intersection of Broadway and 7th Avenue covered in massive digital billboards and neon signs', ARRAY['giant LED billboards', 'bright neon signs', 'red steps seating', 'yellow taxi cabs', 'crowds of people'], true, 10),
('NEW_YORK_CITY', 'Grand Central Terminal', 'landmark', 'Beaux-Arts masterpiece with celestial ceiling mural, iconic clock, and bustling main concourse', ARRAY['turquoise celestial ceiling', 'brass four-faced clock', 'grand windows with light beams', 'marble floors and stairs'], true, 11),
('NEW_YORK_CITY', 'Brooklyn Bridge', 'landmark', 'Gothic Revival suspension bridge with distinctive stone towers and wooden pedestrian walkway', ARRAY['stone Gothic arches', 'suspension cables', 'wooden plank walkway', 'American flags', 'Manhattan skyline backdrop'], true, 12),
('NEW_YORK_CITY', 'Statue of Liberty', 'landmark', 'Iconic copper statue on Liberty Island, gift from France, symbol of freedom and welcome', ARRAY['green copper patina', 'crown with windows', 'torch held high', 'stone pedestal', 'harbor setting'], true, 13),
('NEW_YORK_CITY', 'SoHo', 'neighborhood', 'Cast-iron architecture district with cobblestone streets, upscale boutiques, and art galleries', ARRAY['cast-iron building facades', 'cobblestone streets', 'fire escapes', 'designer storefronts'], false, 20),
('NEW_YORK_CITY', 'Chinatown', 'neighborhood', 'Vibrant neighborhood with Chinese signage, street markets, lantern decorations, and traditional architecture', ARRAY['red lanterns', 'Chinese character signs', 'street food vendors', 'crowded sidewalks', 'traditional gate'], false, 21),
('NEW_YORK_CITY', 'Greenwich Village', 'neighborhood', 'Historic bohemian neighborhood with tree-lined streets, brownstones, jazz clubs, and cozy cafes', ARRAY['tree-lined streets', 'red brick townhouses', 'jazz club awnings', 'sidewalk cafes', 'historic street lamps'], false, 22);