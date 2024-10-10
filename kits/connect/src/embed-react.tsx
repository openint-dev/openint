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
        {loading && (
          <div className="spinner-container">
            <svg className="spinner" viewBox="0 0 50 50">
              <circle
                className="path"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="5"></circle>
            </svg>
          </div>
        )}
        <iframe
          {...iframeProps}
          ref={forwardedRef}
          onLoad={() => {
            setLoading(false)
            onReady?.()
          }}
          src={url}
          height={700}
          width="100%"
          // Using style for minWidth since iframe props don't accept it.
          style={{minWidth: '800px'}}
        />

        <style>{`
        .spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }
        .spinner {
          animation: rotate 2s linear infinite;
          width: 50px;
          height: 50px;
        }
        .path {
          stroke: #5652BF;
          stroke-linecap: round;
          animation: dash 1.5s ease-in-out infinite;
        }
        @keyframes rotate {
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes dash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
          }
        }
      `}</style>
      </>
    )
  },
)
OpenIntConnectEmbed.displayName = 'OpenIntConnectEmbed'
