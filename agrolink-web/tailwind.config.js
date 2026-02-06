/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1a7935',
                secondary: '#b0db3d',
                accent: '#db1c1c',
            },
        },
    },
    plugins: [],
}
