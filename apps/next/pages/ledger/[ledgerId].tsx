import {ConnectionList, NewConnection} from '@ledger-sync/engine-frontend'
import {
  HStack,
  ThemeToggle,
  Toaster,
  Typography,
  VStack,
} from '@ledger-sync/uikit'
import Head from 'next/head'
import {useRouter} from 'next/router'

export default function LedgerScreen() {
  const router = useRouter()
  const {ledgerId} = router.query

  return (
    <>
      <Head>
        <title>Viewing as {ledgerId}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <VStack
        gap="md"
        css={{
          width: '100%',
          height: '100%',
          maxWidth: '$bpsm',
          maxHeight: '100vh',
          marginX: 'auto',
        }}>
        <HStack justify="between" align="center" gap="md" css={{padding: '$4'}}>
          <Typography.Title level={3}>Viewing as {ledgerId}</Typography.Title>
          <ThemeToggle />
        </HStack>

        <NewConnection ledgerId={ledgerId as string} />
        <ConnectionList ledgerId={ledgerId as string} />
      </VStack>
      <Toaster />
    </>
  )
}