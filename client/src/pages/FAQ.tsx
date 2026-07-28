import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Search } from "lucide-react";

const faqs = [
  {
    question: "How do I list my property on Pedi wa Real Estate?",
    answer: "To list your property, sign in with your account, navigate to the Seller Dashboard, and click 'Add Property'. Fill in all the required details including photos, description, price, and location. Your listing will be reviewed by our admin team and published within 24-48 hours.",
  },
  {
    question: "Is there a fee to list my property?",
    answer: "Basic listings are free during our launch period. We may introduce premium listing options in the future for enhanced visibility, but standard listings will always remain available at no cost.",
  },
  {
    question: "How can I contact a property seller?",
    answer: "On every property detail page, you'll find multiple ways to contact the seller: a direct call button, a WhatsApp message link, an email option, and a secure inquiry form. Choose whichever method is most convenient for you.",
  },
  {
    question: "How do I save properties for later?",
    answer: "Sign in to your account, then click the heart icon on any property card or detail page. Your saved properties can be viewed anytime from the 'My Favorites' section in your account menu.",
  },
  {
    question: "How long does it take for a listing to be approved?",
    answer: "Our admin team typically reviews and approves listings within 24-48 hours. You'll receive a notification once your listing is approved and goes live on the platform.",
  },
  {
    question: "Can I edit my listing after it's been published?",
    answer: "Yes! You can edit your listing at any time from the Seller Dashboard. Changes will go through a quick review process before going live. You can also update photos, pricing, and availability.",
  },
  {
    question: "How do I search for properties in a specific area?",
    answer: "Use the search bar on the home page or navigate to the Properties page. You can filter by location, property type, price range, number of bedrooms, and whether you're looking to buy or rent.",
  },
  {
    question: "Is my personal information safe?",
    answer: "Absolutely. We use industry-standard encryption and security measures to protect your data. Your personal information is never shared with third parties without your consent.",
  },
  {
    question: "What types of properties can I find on the platform?",
    answer: "We feature a wide range of properties including houses, apartments, villas, townhouses, studios, penthouses, commercial spaces, and land plots. You can filter by type to find exactly what you're looking for.",
  },
  {
    question: "How do I report a fraudulent listing?",
    answer: "If you encounter a suspicious or fraudulent listing, please contact our support team immediately through the Contact page. We take fraud seriously and will investigate and remove any fraudulent listings promptly.",
  },
  {
    question: "Can I use this platform as a real estate agent?",
    answer: "Yes! Real estate agents can create accounts and list properties on behalf of their clients. You'll have access to the full Seller Dashboard with all listing management features.",
  },
  {
    question: "How do I delete my account?",
    answer: "To delete your account, please contact our support team through the Contact page with a deletion request. We'll process your request within 5 business days.",
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.35_0.18_260)] text-white py-16 md:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-8 h-8" />
              <h1 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Frequently Asked Questions
              </h1>
            </div>
            <p className="text-lg opacity-90">
              Find answers to common questions about using Pedi wa Real Estate.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
}
