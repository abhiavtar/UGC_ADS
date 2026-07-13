import { footerLinks } from '../assets/dummy-data';
import { motion } from 'framer-motion';
import { assets } from '../assets/ugc_assets/assets/assets';

export default function Footer() {

    return (
        <motion.footer className="bg-white/6 border-t border-white/6 pt-10 text-gray-300 light:bg-white/70 light:border-slate-200 light:text-slate-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.5 }}
        >
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-white/10 light:border-slate-200">
                    <div>
                        <img src={assets.logo} alt="logo" className="h-8" />
                        <p className="max-w-[410px] mt-6 text-sm leading-relaxed">
                            Create ugc videos in seconds with our AI-powered platform. Transform your product images into engaging videos that captivate your audience and boost your brand's presence online.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-between w-full md:w-[45%] gap-5">
                        {footerLinks.map((section, index) => (
                            <div key={index}>
                                <h3 className="font-semibold text-base text-white md:mb-5 mb-2 light:text-slate-950">
                                    {section.title}
                                </h3>
                                <ul className="text-sm space-y-1">
                                    {section.links.map(
                                        (link: { name: string; url: string }, i) => (
                                            <li key={i}>
                                                <a
                                                    href={link.url}
                                                    className="hover:text-white transition light:hover:text-slate-950"
                                                >
                                                    {link.name}
                                                </a>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

               
            </div>
        </motion.footer>
    );
};
