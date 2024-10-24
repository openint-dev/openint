import React from 'react'
import {Tabs} from '../components/Tabs'

export default {
  title: 'Example/Tabs',
  component: Tabs,
  argTypes: {
    tabConfig: {control: 'object'},
    defaultValue: {control: 'text'},
  },
}

// Template function to render the component
const Template = (args) => <Tabs {...args} />

// Default story
export const Default = Template.bind({})
Default.args = {
  tabConfig: [
    {
      key: 'connections',
      title: 'Connections',
      content: <div>Content1</div>,
    },
    {
      key: 'settings',
      title: 'Settings',
      content: <div>Content2</div>,
    },
  ],
  defaultValue: 'connections',
}
