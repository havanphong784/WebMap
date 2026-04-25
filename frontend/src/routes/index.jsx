import MainLayout from "../layout/MainLayout/index.jsx";
import Errors404 from "../components/Errors404/index.jsx";
import Login from "../pages/Login/Login.jsx";
import MapViewer from "../components/MapViewer/index.jsx";

export const routes = [
  {
    path: '/',
    element: <MainLayout/>,
    children: [
      {
        path: "/",
        element: <h1>Home</h1>
      },
      {
        path: "map",
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