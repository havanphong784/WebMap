import Errors404 from "../components/Errors404/index.jsx";
import Login from "../pages/Login/Login.jsx";
import MapPage from "../pages/Map/MapPage.jsx";
import PrivateRoutes from "../components/PrivateRoutes/index.jsx";

export const routes = [
  {
    path: '/',
    element: <PrivateRoutes />,
    children: [
      {
        index: true,
        element: <MapPage />
      },

      {
        path: "*",
        element: <Errors404 />
      }
    ]
  },

  {
    path: "login",
    element: <Login />
  }
]