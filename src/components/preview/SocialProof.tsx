import { PreviewSection } from './layout/PreviewSection';

export const SocialProof = () => {
  const testimonials = [
    {
      quote: "Reading finally feels consistent in our house.",
      author: "Parent of two"
    },
    {
      quote: "Our daughter asks how many coins she earns after each book.",
      author: "Parent of a 6-year-old"
    },
    {
      quote: "I feel clear on who read what and when. No guessing.",
      author: "Dad of three"
    }
  ];

  return (
    <PreviewSection variant="feature" className="bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
          What parents say
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border border-border bg-card"
            >
              <p className="text-lg text-foreground mb-4 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <p className="text-sm text-muted-foreground">
                — {testimonial.author}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground italic">
            "Chairlift brings reading, habits, and rewards into one dashboard for families."
          </p>
        </div>
      </div>
    </PreviewSection>
  );
};
