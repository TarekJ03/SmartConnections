import Head from "next/head";
import { Connections } from "../types/types";
import { readContract } from "smartweave";
import useSWR from "swr"
import { arweave, contractID } from "../pages/_app";
import GetConnections from "../utils/connections";
import styles from "../styles/Home.module.css"

export default function Browse(){
    const contractState = useSWR(contractID, useContract)
    if (contractState.error) return <p>error</p>
    if (!contractState.data) return <p>loading</p>
    return <div className={styles.container}>
        <Head>
        <title>Browse SmartConnections</title>
        <meta name="SmartConnections dApp connections" content="Arweave social connections dApp" />
        </Head>
        <div className={styles.main}>
            <h1 className={styles.title}> All connections</h1>
            <div className={styles.grid}>
                <GetConnections contractState={contractState.data["connections"] as unknown as Connections}/>
            </div>
        </div>
    </div>
}

export async function useContract(contractID: string): Promise<{namespaces: {[namespace: string]: string[]}, connections: object}>{
    const state = await readContract(arweave, contractID)
    return state
}