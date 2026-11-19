import { lazy, Suspense } from 'react'
import Threshold from './threshold/Threshold'

const MuseumArchive = lazy(() => import('./MuseumArchive'))

export default function App() {
  if (new URLSearchParams(location.search).has('archive')) {
    return <Suspense fallback={null}><MuseumArchive /></Suspense>
  }
  return <Threshold />
}
