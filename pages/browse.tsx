import { arweaveContext } from "../providers/arweaveProvider";
import { loginContext } from "../providers/loginProvider";

export default function Browse(){
    return <loginContext.Consumer>{
        (loginContext) => {
            return <p>{loginContext.loginState.address}</p>
        }
    }</loginContext.Consumer>
}