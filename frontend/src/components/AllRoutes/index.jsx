import {routes} from "../../routes/index.jsx";
import {useRoutes} from "react-router-dom";

export default function AllRoutes() {
  const elements = useRoutes(routes);
  return <>{elements}</>
}