import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah M.",
    role: "Parent of 4-year-old",
    content: "My daughter looks forward to the new book every morning. It's become our special breakfast routine. The phonics focus has really accelerated her reading skills!",
    rating: 5
  },
  {
    name: "Michael T.",
    role: "Dad of twins",
    content: "As a working parent, having fresh, educational content delivered daily is a game changer. The twins race to see who can finish first and earn more coins.",
    rating: 5
  },
  {
    name: "Jennifer L.",
    role: "Homeschool Mom",
    content: "The seasonal and relevant themes make learning feel natural and exciting. My son asks to read multiple times a day now. Worth every penny!",
    rating: 5
  }
];

export const Testimonials = () => {
  return (
    <section className="w-full py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Parents Love It
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of families building daily reading habits
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
