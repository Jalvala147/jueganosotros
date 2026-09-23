import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { Layout } from './components/Layout'
import { SceneDecor } from './components/ui'
import { CreateGroup } from './pages/CreateGroup'
import { GroupHub } from './pages/GroupHub'
import { Home } from './pages/Home'
import { JoinGroup } from './pages/JoinGroup'
import { Login } from './pages/Login'
import { Play } from './pages/Play'
import { Profile } from './pages/Profile'
import { Showcase } from './pages/Showcase'

function Guard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <p className="p-8 text-center text-sm font-black text-ink/60">Cargando…</p>
  if (!session) return <Navigate to="/login" replace />
  return children
}

export function App() {
  return (
    <>
      <SceneDecor />
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route index element={<Home />} />
        <Route path="crear" element={<CreateGroup />} />
        <Route path="unirse" element={<JoinGroup />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="vitrina" element={<Showcase />} />
        <Route path="grupo/:groupId" element={<GroupHub />} />
        <Route path="grupo/:groupId/jugar" element={<Play />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
