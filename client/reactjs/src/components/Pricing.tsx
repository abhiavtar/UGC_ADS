import Title from './Title';
import { PricingTable } from '@clerk/clerk-react';

export default function Pricing() {
    
    return (
        <section id="pricing" className="py-20 bg-white/3 border-t border-white/6 light:bg-white/60 light:border-slate-200">
            <div className="max-w-6xl mx-auto px-4">

                <Title
                    title="Pricing"
                    heading="Simple, transparent pricing"
                    description="Our pricing plans are designed to be simple and transparent, with no hidden fees or long-term commitments. ."
                />

        <div className="flex flex-wrap items-center justify-center max-w-5xl mx-auto">
        <PricingTable
               appearance={{
                 variables: {
                   colorBackground: "none",
                 },
                 elements: {
                   pricingTableCard: "light:bg-white light:border-slate-200 light:shadow-lg light:shadow-slate-200/70",
                   pricingTableCardBody: "bg-white/6 light:bg-white",
                   pricingTableCardHeader: "bg-white/10 light:bg-slate-50",
                   pricingTableCardTitle: "light:text-slate-950",
                   pricingTableCardDescription: "light:text-slate-600",
                   switchThumb: "",
                 },
               }}
             />
         </div>
            </div>
        </section>
    );
};
