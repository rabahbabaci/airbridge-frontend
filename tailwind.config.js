/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			brand: {
  				DEFAULT: 'hsl(var(--brand))',
  				foreground: 'hsl(var(--brand-foreground))',
  				muted: 'hsl(var(--brand-muted))',
  				accent: 'hsl(var(--brand-accent))',
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))',
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))',
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			/* Concourse design system (§3.1) — prefixed `c` namespace.
  			   Light/dark values wired via CSS vars in src/styles/design-system.css. */
  			c: {
  				brand: {
  					primary: 'var(--c-brand-primary)',
  					'primary-hover': 'var(--c-brand-primary-hover)',
  					'primary-pressed': 'var(--c-brand-primary-pressed)',
  					'primary-surface': 'var(--c-brand-primary-surface)'
  				},
  				confidence: {
  					DEFAULT: 'var(--c-confidence)',
  					surface: 'var(--c-confidence-surface)'
  				},
  				urgency: {
  					DEFAULT: 'var(--c-urgency)',
  					surface: 'var(--c-urgency-surface)'
  				},
  				'live-data': {
  					DEFAULT: 'var(--c-live-data)',
  					surface: 'var(--c-live-data-surface)'
  				},
  				warning: {
  					DEFAULT: 'var(--c-warning)',
  					surface: 'var(--c-warning-surface)'
  				},
  				ground: {
  					DEFAULT: 'var(--c-ground)',
  					elevated: 'var(--c-ground-elevated)',
  					raised: 'var(--c-ground-raised)',
  					sunken: 'var(--c-ground-sunken)'
  				},
  				text: {
  					primary: 'var(--c-text-primary)',
  					secondary: 'var(--c-text-secondary)',
  					tertiary: 'var(--c-text-tertiary)',
  					inverse: 'var(--c-text-inverse)',
  					'on-urgency': 'var(--c-text-on-urgency)'
  				},
  				border: {
  					hairline: 'var(--c-border-hairline)',
  					subtle: 'var(--c-border-subtle)',
  					strong: 'var(--c-border-strong)'
  				},
  				glass: {
  					tint: 'var(--c-glass-tint)',
  					border: 'var(--c-glass-border)'
  				}
  			}
  		},
  		fontFamily: {
  			'c-sans': ['General Sans', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif']
  		},
  		fontSize: {
  			'c-hero-xl': ['72px', { lineHeight: '76px', fontWeight: '700' }],
  			'c-hero': ['56px', { lineHeight: '60px', fontWeight: '700' }],
  			'c-display': ['36px', { lineHeight: '40px', fontWeight: '700' }],
  			'c-title-xl': ['28px', { lineHeight: '34px', fontWeight: '700' }],
  			'c-title': ['22px', { lineHeight: '28px', fontWeight: '600' }],
  			'c-headline': ['17px', { lineHeight: '22px', fontWeight: '600' }],
  			'c-body': ['15px', { lineHeight: '21px', fontWeight: '400' }],
  			'c-footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
  			'c-caption': ['11px', { lineHeight: '14px', fontWeight: '500', letterSpacing: '0.08em' }],
  			'c-tabular': ['15px', { lineHeight: '21px', fontWeight: '500' }]
  		},
  		spacing: {
  			'c-1': '4px',
  			'c-2': '8px',
  			'c-3': '12px',
  			'c-4': '16px',
  			'c-5': '20px',
  			'c-6': '24px',
  			'c-8': '32px',
  			'c-10': '40px',
  			'c-12': '48px',
  			'c-16': '64px'
  		},
  		borderRadius: {
  			'c-pill': '999px',
  			'c-lg': '20px',
  			'c-md': '14px',
  			'c-sm': '10px',
  			'c-xs': '6px'
  		},
  		boxShadow: {
  			'c-sm': 'var(--c-shadow-sm)',
  			'c-md': 'var(--c-shadow-md)',
  			'c-lg': 'var(--c-shadow-lg)',
  			'c-glass': 'var(--c-shadow-glass)'
  		},
  		transitionDuration: {
  			'c-fast': '150ms',
  			'c-normal': '250ms',
  			'c-slow': '400ms',
  			'c-urgent': '600ms'
  		},
  		transitionTimingFunction: {
  			'c-standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  			'c-emphasized': 'cubic-bezier(0.2, 0.0, 0.0, 1)',
  			'c-decelerate': 'cubic-bezier(0.0, 0.0, 0.2, 1)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}