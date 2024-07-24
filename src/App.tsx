import SwapComponentWTB from "./SwapComponentWTB";
import SwapComponentBTW from "./SwapComponentBTW";
import TransactionsComponent from "./TransactionComponent";
import Balances from "./Balances";
import { useGardenSetup } from "./store";
import "./App.css";

function App() {
  useGardenSetup();
  return (
    <div id="container">
      <Balances />
      <SwapComponentWTB></SwapComponentWTB>
      <SwapComponentBTW></SwapComponentBTW>
      <TransactionsComponent></TransactionsComponent>
    </div>
  );
}

export default App;
