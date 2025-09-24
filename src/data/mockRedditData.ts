import { RedditPost } from '@/types/reddit';

export const mockRedditPosts: RedditPost[] = [
  {
    id: "1",
    title: "3-year-old struggling with letter recognition - any tips?",
    subreddit: "Parenting",
    author: "momof2kids",
    created_utc: Date.now() - 7200000, // 2 hours ago
    upvotes: 47,
    num_comments: 23,
    selftext: "My daughter is 3 and we've been working on ABCs for months but she still confuses similar letters like b and d. Has anyone found activities that really help with letter recognition?",
    url: "https://reddit.com/r/Parenting/comments/abc123",
    relevance_score: 95,
    abc_learning_tags: ["Letter Recognition", "Preschool", "Activities"]
  },
  {
    id: "2", 
    title: "Best ABC apps for kindergarten prep? Free vs paid worth it?",
    subreddit: "Teachers",
    author: "kindergarten_teacher",
    created_utc: Date.now() - 14400000, // 4 hours ago
    upvotes: 72,
    num_comments: 31,
    selftext: "Looking for recommendations on ABC learning apps for my classroom. There are so many options - are the paid versions significantly better than free ones like PBS Kids?",
    url: "https://reddit.com/r/Teachers/comments/def456",
    relevance_score: 92,
    abc_learning_tags: ["Apps", "Technology", "Kindergarten", "Resources"]
  },
  {
    id: "3",
    title: "Phonics vs whole word - which approach for teaching ABCs?",
    subreddit: "homeschool",
    author: "homeschoolmom3",
    created_utc: Date.now() - 21600000, // 6 hours ago
    upvotes: 89,
    num_comments: 45,
    selftext: "I'm torn between phonics-based ABC teaching and whole word recognition. My 5-year-old seems to respond better to phonics but I'm worried about reading comprehension later.",
    url: "https://reddit.com/r/homeschool/comments/ghi789",
    relevance_score: 88,
    abc_learning_tags: ["Phonics", "Teaching Methods", "Reading"]
  },
  {
    id: "4",
    title: "DIY alphabet activities that actually work - sharing what worked for us",
    subreddit: "toddlers",
    author: "craftymom",
    created_utc: Date.now() - 28800000, // 8 hours ago
    upvotes: 156,
    num_comments: 67,
    selftext: "After trying dozens of alphabet activities, here are the 5 that my twins actually enjoyed and learned from. All using materials you probably have at home!",
    url: "https://reddit.com/r/toddlers/comments/jkl012",
    relevance_score: 96,
    abc_learning_tags: ["DIY", "Activities", "Toddlers", "Success Story"]
  },
  {
    id: "5",
    title: "Child with dyslexia - special considerations for ABC learning?",
    subreddit: "specialneeds",
    author: "concernedparent",
    created_utc: Date.now() - 43200000, // 12 hours ago
    upvotes: 34,
    num_comments: 18,
    selftext: "Just got dyslexia diagnosis for my 6-year-old. Are there specific approaches or tools that work better for teaching letters to kids with dyslexia?",
    url: "https://reddit.com/r/specialneeds/comments/mno345",
    relevance_score: 85,
    abc_learning_tags: ["Dyslexia", "Special Needs", "Learning Differences"]
  },
  {
    id: "6",
    title: "Montessori ABC materials - worth the investment?",
    subreddit: "Montessori",
    author: "montessori_teacher",
    created_utc: Date.now() - 57600000, // 16 hours ago
    upvotes: 28,
    num_comments: 12,
    selftext: "Considering investing in proper Montessori sandpaper letters and moveable alphabet. For those who've used them, do they make a significant difference?",
    url: "https://reddit.com/r/Montessori/comments/pqr678",
    relevance_score: 78,
    abc_learning_tags: ["Montessori", "Materials", "Investment"]
  },
  {
    id: "7",
    title: "2-year-old obsessed with letters - how to nurture this interest?",
    subreddit: "GiftedKids",
    author: "proudparent",
    created_utc: Date.now() - 72000000, // 20 hours ago
    upvotes: 91,
    num_comments: 29,
    selftext: "My 2-year-old can already identify all uppercase letters and is starting lowercase. She's constantly asking about letters everywhere we go. How can I support this interest appropriately?",
    url: "https://reddit.com/r/GiftedKids/comments/stu901",
    relevance_score: 82,
    abc_learning_tags: ["Gifted", "Early Learning", "Letter Interest"]
  },
  {
    id: "8",
    title: "ABC learning games for car rides - keep 4yo engaged on long trips",
    subreddit: "Parenting",
    author: "roadtripmom",
    created_utc: Date.now() - 86400000, // 1 day ago
    upvotes: 63,
    num_comments: 38,
    selftext: "We have a 6-hour drive coming up and my 4-year-old gets bored easily. Looking for alphabet games we can play in the car that are actually educational.",
    url: "https://reddit.com/r/Parenting/comments/vwx234",
    relevance_score: 90,
    abc_learning_tags: ["Games", "Car Activities", "Entertainment"]
  },
  {
    id: "9",
    title: "ESL kids - best strategies for teaching English ABCs?",
    subreddit: "ESL",
    author: "esl_teacher",
    created_utc: Date.now() - 129600000, // 1.5 days ago
    upvotes: 45,
    num_comments: 22,
    selftext: "Working with 5-6 year olds who are learning English as second language. Their native language uses different script. What are most effective ABC teaching methods for ESL students?",
    url: "https://reddit.com/r/ESL/comments/yza567",
    relevance_score: 87,
    abc_learning_tags: ["ESL", "Second Language", "Teaching Methods"]
  },
  {
    id: "10",
    title: "Reggio Emilia approach to alphabet learning - experiences?",
    subreddit: "ECEProfessionals",
    author: "early_childhood_ed",
    created_utc: Date.now() - 172800000, // 2 days ago
    upvotes: 37,
    num_comments: 15,
    selftext: "Interested in incorporating more Reggio Emilia principles into our alphabet curriculum. Has anyone successfully used this approach for letter learning?",
    url: "https://reddit.com/r/ECEProfessionals/comments/bcd890",
    relevance_score: 75,
    abc_learning_tags: ["Reggio Emilia", "Early Childhood", "Curriculum"]
  },
  {
    id: "11",
    title: "Screen time guilt - are ABC learning videos actually helpful?",
    subreddit: "Parenting",
    author: "guiltyparent",
    created_utc: Date.now() - 216000000, // 2.5 days ago
    upvotes: 128,
    num_comments: 84,
    selftext: "My 3-year-old loves ABC videos on YouTube but I feel guilty about screen time. Are these actually educational or just entertainment? Looking for evidence-based opinions.",
    url: "https://reddit.com/r/Parenting/comments/efg123",
    relevance_score: 93,
    abc_learning_tags: ["Screen Time", "Videos", "Education vs Entertainment"]
  },
  {
    id: "12",
    title: "Waldorf education - when do they typically introduce letters?",
    subreddit: "WaldorfEducation",
    author: "waldorf_curious",
    created_utc: Date.now() - 259200000, // 3 days ago
    upvotes: 22,
    num_comments: 11,
    selftext: "Considering Waldorf school for my child. I understand they wait longer to introduce formal reading. At what age do they typically start with letters and alphabet?",
    url: "https://reddit.com/r/WaldorfEducation/comments/hij456",
    relevance_score: 71,
    abc_learning_tags: ["Waldorf", "Delayed Academics", "Philosophy"]
  }
];