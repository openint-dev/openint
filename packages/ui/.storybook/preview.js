// import '../../../apps/web/app/global.css'

if (typeof document !== 'undefined') {
  const script = document.createElement('script')
  script.src = 'https://cdn.tailwindcss.com'
  document.head.appendChild(script)
}

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
