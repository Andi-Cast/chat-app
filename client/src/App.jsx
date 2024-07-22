import axios from 'axios';
import { UserContextProvider } from "./UserContext";
import Routes from "./Routes";

function App() {

  axios.defaults.baseURL = 'http://localhost:4000';
  //ensures that 'axios' sends cookies with every request 
  axios.defaults.withCredentials = true;

  return (
    <UserContextProvider>
      <Routes/>
    </UserContextProvider>
  )
}

export default App
