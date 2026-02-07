import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html
      lang="en"
    // dir='rtl'
    >
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__SENTRY_ENVIRONMENT__=${JSON.stringify(
              process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
                process.env.SENTRY_ENV ||
                process.env.NODE_ENV ||
                "production"
            )};`,
          }}
        />
      </Head>
      <body data-pc-preset="preset-1" data-pc-sidebar-theme="light" data-pc-sidebar-caption="true" data-pc-direction="ltr" data-pc-theme="light">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
