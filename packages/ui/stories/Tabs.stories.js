import React from 'react'
import {Tabs} from '../components/Tabs'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Example/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

// Example of how to use the Tabs component
export const Default = {
  args: {
    tabConfig: [
      {
        key: 'tab1',
        title: 'Tab 1',
        content: <div>Content for Tab 1</div>,
      },
      {
        key: 'tab2',
        title: 'Tab 2',
        content: <div>Content for Tab 2</div>,
      },
      {
        key: 'tab3',
        title: 'Tab 3',
        content: <div>Content for Tab 3</div>,
      },
    ],
    defaultValue: 'tab1',
  },
}
