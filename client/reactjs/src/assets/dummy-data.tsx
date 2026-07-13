import { UploadIcon, VideoIcon, ZapIcon } from 'lucide-react';

export const featuresData = [
    {
        icon: <UploadIcon className="w-6 h-6" />,
        title: 'Smart Upload',
        desc: 'Drag and drop your product images and videos. Our AI automatically analyzes and optimizes them for the best results.'
    },
    {
        icon: <ZapIcon className="w-6 h-6" />,
        title: 'Instant Generation',
        desc: 'Optimized model delivery output in Seconds with great fidelity.'
    },
    {
        icon: <VideoIcon className="w-6 h-6" />,
        title: 'Video Synthesis',
        desc: 'video synthesis capabilities to create dynamic product videos that showcase your products in action, helping you engage customers and drive sales.'
    }
];

export const plansData = [
    {
        id: 'starter',
        name: 'Starter',
        price: '$10',
        desc: 'Try the Platform at no cost.',
        credits: 50,
        features: [
            '50 Credits for video generation',
            'Standard Quality',
            'No watermark',
            'Slower Generation Speed',
            'Email support'
        ]
    },
    {
        id: 'Pro',
        name: 'Pro',
        price: '$29',
        desc: 'Growing teams and businesses.',
        credits: 100,
        features: [
            'Everything in Starter',
            'Hd video generation',
            'No Watermark',
            'Priority support'
        ],
        popular: true
    },
    {
        id: 'ultra',
        name: 'Ultra',
        price: '$99',
        desc: 'Scale across teams and projects.',
        credits: 'Custom',
        features: [
            'Everything in Pro',
            '$k video generation',
            'No Watermark',
            'Priority Support',
            'Chat + Email support'
        ]
    }
];

export const faqData = [
    {
        question: 'How does the AI video generation work?',
        answer: 'We leverage state-of-the-art AI models trained on millions of product images and videos. Our platform analyzes your inputs and generates high-quality videos optimized for e-commerce.'
    },
    {
        question: 'Do you work with startups or only large companies?',
        answer: 'We work with startups, growing businesses and established brands. Our process is flexible and tailored to match your goals and scale.'
    },
    {
        question: 'Do I own the generated images and videos?',
        answer: 'Yes. You retain full ownership and rights to all generated content. We do not claim any ownership over your assets.'
    },
    {
        question: 'Can I cancel anytime?',
        answer: 'Yes you can cancel your subscription at any time. We offer a flexible billing system that allows you to manage your plan according to your needs.'
    },
    {
        question: 'what input format do you support?',
        answer: 'We support a wide range of input formats including JPEG, PNG, MP4, and more. Our platform is designed to be flexible and accommodate various types of media to ensure the best results for your product videos.'
    }
];

export const footerLinks = [
    {
        title: "Quick Links",
        links: [
            { name: "Home", url: "#" },
            { name: "Features", url: "#" },
            { name: "Pricing", url: "#" },
            { name: "FAQ", url: "#" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Twitter", url: "#" },
            { name: "LinkedIn", url: "#" },
            { name: "GitHub", url: "#" }
        ]
    }
];