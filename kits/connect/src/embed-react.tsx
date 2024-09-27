import React from 'react'
import type {GetIFrameProps} from './common'
import {getIFrameUrl} from './common'

export interface OpenIntConnectEmbedProps
  extends GetIFrameProps,
    React.IframeHTMLAttributes<HTMLIFrameElement> {
  onReady?: () => void
}

export const OpenIntConnectEmbed = React.forwardRef(
  (
    {baseUrl, params, onReady, ...iframeProps}: OpenIntConnectEmbedProps,
    forwardedRef: React.ForwardedRef<HTMLIFrameElement>,
  ) => {
    const url = getIFrameUrl({baseUrl, params})
    const [loading, setLoading] = React.useState(true)

    // Add a more reliable way to know iframe has fully finished loading
    // by sending message from iframe to parent when ready
    return (
      <>
        {loading && <span>Loading iframe...</span>}
        <iframe
          {...iframeProps}
          ref={forwardedRef}
          onLoad={() => {
            setLoading(false)
            onReady?.()
          }}
          src={url}
        />
      </>
    )
  },
)
OpenIntConnectEmbed.displayName = 'OpenIntConnectEmbed'
