// Edit tailwind.config.js to update content paths
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ...rest of your existing config
 
    theme: {
      extend: {
        keyframes: {
          slideIn: {
            '0%': { transform: 'translateY(-100%)' },
            '100%': { transform: 'translateY(0)' }
          },
          fadeOut: {
            '0%': { opacity: '1' },
            '100%': { opacity: '0' }
          },
          fadeInUp: {
            '0%': { opacity: '0', transform: 'translateY(20px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' }
          },
          cardHover: {
            '0%': { transform: 'translateY(0)' },
            '100%': { transform: 'translateY(-8px)' }
          },
          modalFadeIn: {
            '0%': { opacity: '0', transform: 'scale(0.95)' },
            '100%': { opacity: '1', transform: 'scale(1)' }
          },
          modalFadeOut: {
            '0%': { opacity: '1', transform: 'scale(1)' },
            '100%': { opacity: '0', transform: 'scale(0.95)' }
          },
          backdropFadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' }
          },  
          pulseHighlight: {
            '0%, 100%': { boxShadow: '0 0 0 0 rgba(124, 58, 237, 0)' },
            '50%': { boxShadow: '0 0 0 4px rgba(124, 58, 237, 0.2)' }
          }
        },
        animation: {
          'slideIn': 'slideIn 1s ease-in-out',
          'fadeOut': 'fadeOut 1s ease-in-out',
          'fadeInUp': 'fadeInUp 0.5s ease forwards',
          'cardHover': 'cardHover 0.3s ease forwards',
          'modalFadeIn': 'modalFadeIn 0.3s ease-out forwards',
          'modalFadeOut': 'modalFadeOut 0.2s ease-in forwards',
          'backdropFadeIn': 'backdropFadeIn 0.3s ease-out forwards',
          'pulseHighlight': 'pulseHighlight 3s infinite',
        }
      }
    }
    // ...rest of your configuration
  };

