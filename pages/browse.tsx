import { arweaveContext } from "./arweaveProvider";
import { loginContext } from "./loginProvider";

export default function Browse(){
    return <loginContext.Consumer>{
        (loginContext) => {
            return <p>{loginContext.loginState.address}</p>
        }
    }</loginContext.Consumer>
}