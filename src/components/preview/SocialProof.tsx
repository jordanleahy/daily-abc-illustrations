import { PreviewSection } from './layout/PreviewSection';

export const SocialProof = () => {
  const testimonials = [
    {
      quote: "Even though we live 800 miles apart, I feel part of their daily reading routine.",
      author: "Grandmother of two"
    },
    {
      quote: "My grandson calls me every week to tell me about his new books. It's our special connection.",
      author: "Grandpa in Florida"
    },
    {
      quote: "Finally, a gift that doesn't clutter their house but means so much more.",
      author: "Nana of three grandchildren"
    }
  ];

  return (
    <PreviewSection variant="feature" className="bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
          What grandparents are saying
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
            "The perfect gift for grandparents who want to stay connected and nurture a love of reading from anywhere."
          </p>
        </div>
      </div>
    </PreviewSection>
  );
};
