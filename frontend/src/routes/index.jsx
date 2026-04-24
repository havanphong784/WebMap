import MainLayout from "../layout/MainLayout/index.jsx";
import Errors404 from "../components/Errors404/index.jsx";
import Login from "../pages/Login/Login.jsx";

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
        path: "login",
        element: <Login/>
      },
      {
        path: "*",
        element: <Errors404/>
      }
    ]
  }
]