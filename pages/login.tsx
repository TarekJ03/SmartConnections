import { ChangeEvent } from "react"
import { useRouter } from "next/router"
import Cookies from "typescript-cookie/dist/src/compat"
import { PermissionType } from "arconnect"
import { loginContext } from "./loginProvider"
import styles from "../styles/Home.module.css"
import { arweaveContext } from "./arweaveProvider"
import { JWKInterface, JWKPublicInterface } from "arweave/node/lib/wallet"


export default function Login(){
    const router = useRouter()
    return (
        <arweaveContext.Consumer>{
            (arweaveContext) => {
                return (
                    <loginContext.Consumer>{
                        (loginContext) => {
                            async function loadArConnect(){
                                const requiredPermissions: PermissionType[] = ["ACCESS_ADDRESS", "ACCESS_PUBLIC_KEY"]
                                try {
                                    let currentPermissions = await window.arweaveWallet.getPermissions()
                                    if (!requiredPermissions.every(permission => currentPermissions.includes(permission))){
                                        await window.arweaveWallet.connect(requiredPermissions, {name: "SmartConnections"})
                                        currentPermissions = await window.arweaveWallet.getPermissions()
                                        if (currentPermissions.includes("ACCESS_PUBLIC_KEY")){
                                            console.log("Succefully submitted keyfile")
                                        } if (currentPermissions.includes("ACCESS_ADDRESS")){
                                            console.log("Succefully submitted address")
                                        }
                                    } else {
                                        console.log("All permissions granted");
                                    }
                                    login(await window.arweaveWallet.getActiveAddress())
                                    router.push("browse")
                                } catch (error) {
                                    console.log("Attempt to connect to Arconnect was unsuccesful" + error)
                                }
                            }
                            async function loadKeyfile(event: ChangeEvent<HTMLInputElement>) {
                                event.preventDefault()
                                if (event.target.files != null){
                                    console.log("Succefully submitted keyfile")
                                    const jwk = JSON.parse(await event.target.files[0].text())
                                    const address = await arweaveContext.arweave.wallets.jwkToAddress(jwk)
                                    login(address, jwk)
                                    router.push("browse")
                                }
                                console.log(loginContext.loginState);
                            }
                            function login(address:string, jwk?: JWKInterface | JWKPublicInterface) {
                                const newState = {...loginContext.loginState}
                                jwk? newState.jwk = jwk : {}
                                newState.address = address
                                newState.isLoggedIn = true
                                loginContext.setLoginState(newState)
                                Cookies.set("smartconnections-login", JSON.stringify(newState), {domain: "localhost"})
                            }
                            async function logout(){
                                loginContext.loginState.jwk? {} : await window.arweaveWallet.disconnect()
                                loginContext.setLoginState({
                                    isLoggedIn: false,
                                    address: undefined,
                                    jwk: undefined,
                                })
                                Cookies.remove("smartconnections-login")
                            }
                            if (!loginContext.loginState.isLoggedIn){
                                return (
                                    <div className={styles.grid}>
                                        <label className={styles.card}>
                                            <button onClick = {loadArConnect} style={{display: "none"}}/>
                                            <h2>Arconnect &rarr;</h2>
                                            <p>Use Arconnect</p>
                                        </label>
                                        <label className={styles.card}>
                                            <input type="file" onChange={loadKeyfile} accept="application/json" style={{display: "none"}}/>
                                            <h2>Keyfile &rarr;</h2>
                                            <p>Upload your keyfile here: </p>
                                        </label>
                                    </div>
                                )
                            } else {
                                return (
                                    <label className={styles.card}>
                                        <button onClick = {logout} style={{display: "none"}}/>
                                        <h2>Logout &rarr;</h2>
                                        <p>Currently logged in as: {loginContext.loginState.address}</p>
                                    </label>
                                )
                            }
                        }
                    }</loginContext.Consumer>
                )
            }
        }</arweaveContext.Consumer>
    )
}
