import {createRoot} from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import './index.css'
import 'react-loading-skeleton/dist/skeleton.css'
import App from './App.jsx'
import { AuthProvider } from "./features/auth/context/authContext.jsx";
import {configureNativeShell} from "./platform/runtime.js";

void configureNativeShell().catch((error) => {
  console.warn("Không thể cấu hình Android shell:", error);
});

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App/>
    </AuthProvider>
  </BrowserRouter>
)
