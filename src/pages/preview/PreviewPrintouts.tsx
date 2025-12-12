import { Palette, Printer, Download, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PreviewNav } from '@/components/preview/layout/PreviewNav';
import { PreviewFooter } from '@/components/preview/layout/PreviewFooter';

export default function PreviewPrintouts() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PreviewNav />
      
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Palette className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Coloring Books
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Print each book as a coloring book
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Take the joy on the road and print out each book. Keep kids entertained with screen-free activities that reinforce what they learned.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            How print-outs work
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Choose a book</h3>
              <p className="text-muted-foreground">
                Select any book from your library—each one has a ready-to-print coloring book version.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Download PDF</h3>
              <p className="text-muted-foreground">
                Get a black-and-white PDF optimized for printing with clean line art on every page.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Printer className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Print & color</h3>
              <p className="text-muted-foreground">
                Print at home or at a print shop. Kids can color and keep their personalized books.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Why screen-free matters
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Reinforces learning</h3>
                  <p className="text-muted-foreground">
                    Coloring engages different parts of the brain, helping kids remember what they read.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Perfect for travel</h3>
                  <p className="text-muted-foreground">
                    Road trips, flights, waiting rooms—print-outs keep kids busy without screens.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Fine motor skills</h3>
                  <p className="text-muted-foreground">
                    Coloring develops hand-eye coordination and prepares kids for writing.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Creative expression</h3>
                  <p className="text-muted-foreground">
                    Let kids make each page their own with their choice of colors.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-pink-600 font-bold">5</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Calm & focus</h3>
                  <p className="text-muted-foreground">
                    Coloring has been shown to reduce anxiety and improve concentration.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-600 font-bold">6</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Keepsake quality</h3>
                  <p className="text-muted-foreground">
                    Physical coloring pages become treasured mementos of your child's work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to print?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Every book in your library includes a printable coloring book version.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Get started free
          </Button>
        </div>
      </section>

      <PreviewFooter />
    </div>
  );
}
