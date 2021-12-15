import { FollowConnection } from "../types/types";
import styles from "../styles/Home.module.css"

export default function Connection(connection: FollowConnection){
return <div className={styles.card}>
        <h3>Origin</h3>
        <p>{connection.origin}</p>
        <h3>Target</h3>
        <p>{connection.target}</p>
        <h3>Connection type</h3>
        <p>{connection.connectionType}</p>
        <h3>Namespace</h3>
        <p>{connection.namespace}</p>
        <h3>Creation date</h3>
        <p>{new Date(connection.createdAt*1000).toLocaleString()}</p>
    </div>
}