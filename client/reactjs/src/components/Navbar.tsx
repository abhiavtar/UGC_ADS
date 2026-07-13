import {
  useAuth,
  useClerk,
  useUser,
  UserButton,
} from '@clerk/clerk-react';
import {
  DollarSignIcon,
  FolderEditIcon,
  GalleryHorizontalEndIcon,
  MenuIcon,
  MoonIcon,
  SparkleIcon,
  SunIcon,
  XIcon,
} from 'lucide-react';
import { GhostButton, PrimaryButton } from './Buttons';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { assets } from "../assets/ugc_assets/assets/assets";
import api from '../configs/axios';
import toast from 'react-hot-toast';
import { useTheme } from '../theme';


export default function Navbar() {
    const { user } = useUser();
    const { openSignIn, openSignUp } = useClerk();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);
    const { theme, toggleTheme } = useTheme();
    const { pathname } = useLocation();
    const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  


    const navLinks = [
      { name: "Home", href: "/" },
      { name: "Create", href: "/generate" },
      { name: "Community", href: "/community" },
      { name: "Plans", href: "/plans" },
    ];

    const getUserCredits = useCallback(async () => {
      try {
          if (!isAuthLoaded || !isSignedIn) {
            return;
          }

          const token = await getToken()

          if (!token) {
            return;
          }

          const { data } = await api.get('/api/user/credits', {
              headers: { Authorization: `Bearer ${token}` }
          })
          setCredits(data.credits)
      } catch (error:any) {
        toast.error(error?.response?.data?.message || error.message)
        console.log(error);
      }
  }, [getToken, isAuthLoaded, isSignedIn])

       useEffect(() => {
         if (isAuthLoaded && isSignedIn && user) {
             (async () => await getUserCredits())();
              }
        }, [isAuthLoaded, isSignedIn, user, pathname, getUserCredits])     

       useEffect(() => {
         if (isAuthLoaded && !isSignedIn) {
           setCredits(null);
           return;
         }

         const refreshCredits = () => {
           void getUserCredits();
         };

         const handleVisibilityChange = () => {
           if (document.visibilityState === 'visible') {
             refreshCredits();
           }
         };

         window.addEventListener('focus', refreshCredits);
         document.addEventListener('visibilitychange', handleVisibilityChange);

         const intervalId =
           pathname === '/plans'
             ? window.setInterval(refreshCredits, 5000)
             : undefined;

         return () => {
           window.removeEventListener('focus', refreshCredits);
           document.removeEventListener('visibilitychange', handleVisibilityChange);

           if (intervalId) {
             window.clearInterval(intervalId);
           }
         };
       }, [isAuthLoaded, isSignedIn, pathname, getUserCredits]);

       const ThemeToggleButton = ({ className = '' }: { className?: string }) => (
         <button
           type="button"
           onClick={toggleTheme}
           aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
           className={`inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-200 backdrop-blur-sm transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700 light:hover:bg-slate-100 ${className}`}
         >
           {theme === 'light' ? (
             <MoonIcon className="size-4" />
           ) : (
             <SunIcon className="size-4" />
           )}
         </button>
       );
  
    return (
      <motion.nav
        className="fixed top-5 left-0 right-0 z-50 px-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/10 light:bg-white/85 light:border-slate-200 light:shadow-slate-200/70">
  
          {/* LOGO */}
          <Link to="/" onClick={() => window.scrollTo(0, 0)}>
            <img src={assets.logo} alt="logo" className="h-8" />
          </Link>
  
          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300 light:text-slate-600">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => window.scrollTo(0, 0)}
                className="hover:text-white transition light:hover:text-slate-950"
              >
                {link.name}
              </Link>
            ))}
          </div>
  
          {/* DESKTOP BUTTONS */}
          {!user ? (
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggleButton />
              <button
                onClick={() => openSignIn()}
                className="text-sm font-medium text-gray-300 hover:text-white transition max-sm:hidden light:text-slate-600 light:hover:text-slate-950"
              >
                Sign in
              </button>
              <PrimaryButton
                onClick={() => openSignUp()}
                className="max-sm:text-xs hidden sm:inline-block"
              >
                Get Started
              </PrimaryButton>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggleButton />
              <GhostButton className="border-none text-gray-300 sm:py-1.5 light:text-slate-700">
                Credits:{credits ?? '...'}
              </GhostButton>
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Generate"
                    labelIcon={<SparkleIcon size={14} />}
                    onClick={() => navigate('/generate')}
                  />
                  <UserButton.Action
                    label="My Generations"
                    labelIcon={<FolderEditIcon size={14} />}
                    onClick={() => navigate('/my-generations')}
                  />
                  <UserButton.Action
                    label="Community"
                    labelIcon={<GalleryHorizontalEndIcon size={14} />}
                    onClick={() => navigate('/community')}
                  />
                  <UserButton.Action
                    label="Plans"
                    labelIcon={<DollarSignIcon size={14} />}
                    onClick={() => navigate('/plans')}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          )}
  
          {/* MOBILE MENU BUTTON */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggleButton className="size-9" />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex size-9 items-center justify-center rounded-full text-white transition light:text-slate-800"
            >
              <MenuIcon className="size-6" />
            </button>
          </div>
        </div>
  
        {/* MOBILE MENU */}
        <div
          className={`flex flex-col items-center justify-center gap-6 text-lg font-medium fixed inset-0 bg-black/40 text-white backdrop-blur-md z-50 transition-all duration-300 light:bg-white/95 light:text-slate-900 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => {
                setIsOpen(false);
                window.scrollTo(0, 0);
              }}
            >
              {link.name}
            </Link>
          ))}
  
          {!user ? (
            <>
              <button
                onClick={() => {
                  setIsOpen(false);
                  openSignIn();
                }}
                className="font-medium text-gray-300 hover:text-white transition light:text-slate-600 light:hover:text-slate-950"
              >
                Sign in
              </button>

              <PrimaryButton
                onClick={() => {
                  setIsOpen(false);
                  openSignUp();
                }}
              >
                Get Started
              </PrimaryButton>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <GhostButton className="border-none text-gray-300 sm:py-1.5 light:text-slate-700">
                Credits:{credits ?? '...'}
              </GhostButton>
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Generate"
                    labelIcon={<SparkleIcon size={14} />}
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/generate');
                    }}
                  />
                  <UserButton.Action
                    label="My Generations"
                    labelIcon={<FolderEditIcon size={14} />}
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/my-generations');
                    }}
                  />
                  <UserButton.Action
                    label="Community"
                    labelIcon={<GalleryHorizontalEndIcon size={14} />}
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/community');
                    }}
                  />
                  <UserButton.Action
                    label="Plans"
                    labelIcon={<DollarSignIcon size={14} />}
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/plans');
                    }}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          )}
  
          {/* CLOSE BUTTON */}
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md bg-white p-2 text-gray-800 active:ring-2"
          >
            <XIcon />
          </button>
        </div>
      </motion.nav>
    );
  }
