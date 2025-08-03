import React from 'react';
import { Github, Instagram, Youtube, Send, Linkedin, Heart } from 'lucide-react';

const Footer = ({ variant }) => {
    // Determine if this is the login page variant
    const isLoginVariant = variant === 'login';

    // Conditional classes based on variant
    const footerClasses = isLoginVariant
        ? "w-full text-gray-700 py-4 mt-6"  // Lighter, more compact footer for login
        : "w-full bg-gray-900 text-white py-8 mt-auto"; // Original styling

    return (
        <footer className={footerClasses}>
            <div className={`${isLoginVariant ? 'max-w-md' : 'max-w-6xl'} mx-auto px-4`}>
                <div className={`flex flex-col ${isLoginVariant ? 'items-center' : 'md:flex-row items-center justify-between'} gap-${isLoginVariant ? '2' : '6'}`}>
                    <div className="text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <span className="text-sm">Made with</span>
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="text-sm">by Harshit Patle</span>
                        </div>
                        <p className="text-sm text-gray-400">© {new Date().getFullYear()} All rights reserved</p>
                    </div>

                    {/* Social links - show all icons on all pages */}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <a
                            href="https://www.instagram.com/coding_version"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${isLoginVariant ? 'hover:text-pink-600' : 'hover:text-pink-400'} transition-colors`}
                            aria-label="Instagram (Personal)"
                        >
                            <Instagram className={`w-${isLoginVariant ? '4' : '5'} h-${isLoginVariant ? '4' : '5'}`} />
                        </a>
                        <a
                            href="https://www.youtube.com/@coding_version"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${isLoginVariant ? 'hover:text-red-600' : 'hover:text-red-500'} transition-colors`}
                            aria-label="YouTube"
                        >
                            <Youtube className={`w-${isLoginVariant ? '4' : '5'} h-${isLoginVariant ? '4' : '5'}`} />
                        </a>
                        <a
                            href="https://telegram.me/Coding_Version"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${isLoginVariant ? 'hover:text-blue-600' : 'hover:text-blue-500'} transition-colors`}
                            aria-label="Telegram"
                        >
                            <Send className={`w-${isLoginVariant ? '4' : '5'} h-${isLoginVariant ? '4' : '5'}`} />
                        </a>
                        <a
                            href="https://www.instagram.com/harshit_patle10"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${isLoginVariant ? 'hover:text-pink-600' : 'hover:text-pink-400'} transition-colors`}
                            aria-label="Instagram (Dev)"
                        >
                            <Instagram className={`w-${isLoginVariant ? '4' : '5'} h-${isLoginVariant ? '4' : '5'}`} />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/harshit-patle"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${isLoginVariant ? 'hover:text-blue-700' : 'hover:text-blue-600'} transition-colors`}
                            aria-label="LinkedIn"
                        >
                            <Linkedin className={`w-${isLoginVariant ? '4' : '5'} h-${isLoginVariant ? '4' : '5'}`} />
                        </a>
                        <a
                            href="https://github.com/Harshit-Patle"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${isLoginVariant ? 'hover:text-gray-700' : 'hover:text-blue-400'} transition-colors`}
                            aria-label="GitHub"
                        >
                            <Github className={`w-${isLoginVariant ? '4' : '5'} h-${isLoginVariant ? '4' : '5'}`} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;