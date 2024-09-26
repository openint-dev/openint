'use client'

// TODO: Turn this into a server component and get stored values
export function OrgThemeWrapper({children}: {children: React.ReactNode}) {
  // TODO: we need to sanitize the theme value as they are from user
  // however it should affect only one's own account so damage scope is limited
  const themeVariables = {
    '--background': 'transparent',
  }

  return (
    <div className="h-screen w-screen">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root {
            ${Object.entries(themeVariables).map(
              ([key, value]) => `${key}: ${value};`,
            )}
          }
        `,
        }}
      />
      {children}
    </div>
  )
}
