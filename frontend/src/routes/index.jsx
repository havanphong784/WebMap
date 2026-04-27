import Errors404 from "../components/Errors404/index.jsx";
import Login from "../pages/Login/Login.jsx";
import MapViewer from "../components/MapViewer/index.jsx";
import PrivateRoutes from "../components/PrivateRoutes/index.jsx";

export const routes = [
  {
    path: '/',
    element: <PrivateRoutes/>,
    children: [
      {
        path: "/",
        element: <MapViewer/>
      },
      {
        path: "*",
        element: <Errors404/>
      }
    ]
  },
  {
    path: "login",
    element: <Login/>
  }
]