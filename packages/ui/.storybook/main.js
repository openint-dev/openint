const { dirname, join } = require('path')

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')))
}

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-interactions'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  // Add the following configuration to support SVGs
  viteFinal: async (config) => {
    // Ensure plugins array is initialized
    if (!config.plugins) {
      config.plugins = [];
    }

    config.plugins.push({
      name: 'svgr',
      transform: (code, id) => {
        if (/\.svg$/.test(id)) {
          return {
            code: `import { ReactComponent as Icon } from '${id}'; export default Icon;`,
            map: null,
          };
        }
        return null;
      },
    });
    return config;
  },
}

export default config
