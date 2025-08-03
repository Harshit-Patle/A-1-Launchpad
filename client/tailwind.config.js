/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./index.html",
        "./public/**/*.html",
    ],
    theme: {
        extend: {
            screens: {
                'xs': '480px',  // Extra small screen
            },
            spacing: {
                '72': '18rem',
                '84': '21rem',
                '96': '24rem',
            },
        },
    },
    plugins: [],
}
