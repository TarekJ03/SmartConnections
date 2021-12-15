import { FollowConnection, Connections } from "../types/types";
import Connection from "../pages/connection"

export default function GetConnections(obj: {contractState: Connections}){
    const {contractState} = obj
    console.log(contractState)
    let connections = Object.keys(contractState).flatMap(origin => {
        return Object.keys(contractState[origin]).flatMap(following => {
            return Object.keys(contractState[origin][following]).flatMap(namespace => {
                return Object.keys(contractState[origin][following][namespace]).flatMap((connectionType): FollowConnection => {
                    return {
                    connectionType,
                    origin,
                    target: following,
                    namespace,
                    createdAt: contractState[origin][following][namespace][connectionType].createdAt,
                    alias: contractState[origin][following][namespace][connectionType].alias
                    }
                })
            })
        })
    })
    connections = connections.sort((a, b) => b.createdAt-a.createdAt)
    const connectionElementList: JSX.Element[] = []
    connections.forEach(connection => {
        console.log(connection)
        connectionElementList.push(<Connection {...connection}/>)
    });
    return <div>
        {connectionElementList}
    </div>
}