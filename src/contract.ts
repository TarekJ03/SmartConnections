// Declares the state's type
type State = {
    namespaces: string[],
    connectionTypes: string[],
    connections: {
        [address: string]: {
            [target: string]: {
                [namespace: string]: {
                    [connectionType: string]: {
                        createdAt: number,
                        alias: string | null
                    }
                }
            }
        }
    }
}

// Action can be either a connect, a disconnect or a lookup call
type Action = ConnectionAction | DisconnectAction | LookupAction

// Declares the lookup action's type
type LookupAction = {
    caller: string,
    input: {
        function: "lookup",
        target?: string,
    }
}

// Declares the connect action's type
type ConnectionAction = {
    caller: string,
    input: {
        function: "connect",
        target: string,
        namespace: string,
        connectionType: string,
        alias?: string
    }
}

// Declares the disconnect action's type
type DisconnectAction = {
    caller: string,
    input: {
        function: "disconnect",
        target?: string,
        namespace?: string,
        connectionType?: string,
    }
}

// Declares the `return` parameter type
type Connection = {
    ConnectionType: string,
    target: string,
    namespace: string,
    createdAt: Number,
    alias: string | null
}

async function handle(state: State, action: Action) {
    const input = action.input

    // Utility to check if two string[] have the same content
    function arrayIsEqual(arr1: string[], arr2: string[]){
        return arr1.length == arr2.length && arr1.every((element, index) => element == arr2[index])
    }

    // Guard to check if the passed action is valid
    function isValidAction(action: any): action is Action{
        return isValidLookup(action) || isValidDisconnect(action) || isValidConnect(action)
    }

    // Guard to check if the passed action is a valid lookup call
    function isValidLookup(action: Action): action is LookupAction{
        if (arrayIsEqual(Object.keys(input), ["function"]) || arrayIsEqual(Object.keys(input), ["function", "target"])){
            if (input.function == "lookup"){
                if (input.target && !(Object.keys(state.connections).includes(input.target))){
                    /* @ts-ignore */
                    throw new ContractError(`${target} is not connected to any address`)
                } return true
            }
        }  return false
    }

    // Guard to check if the passed action is a valid connect call
    function isValidConnect(action: Action): action is ConnectionAction{
        if (arrayIsEqual(Object.keys(input), ["function", "target", "namespace", "connectionType"]) || arrayIsEqual(Object.keys(input), ["function", "target", "namespace", "connectionType", "alias"])){
            if (input.function == "connect"){
                if (typeof input.target == "string" && typeof input.namespace == "string" && typeof input.connectionType == "string"){
                    if (input.target == action.caller){
                        /* @ts-ignore */
                        throw new ContractError("Can't connect to own address")
                    } if (input.alias && !(typeof input.alias == "string")){
                        /* @ts-ignore */
                        throw new ContractError(`Alias ${alias} was passed but is not a string`)
                    } if (!(state.namespaces.includes(input.namespace))){
                        /* @ts-ignore */
                        throw new ContractError(`Namespace ${input.namespace} is not a valid namespace`)
                    } if (!(state.connectionTypes.includes(input.connectionType))){
                        /* @ts-ignore */
                        throw new ContractError(`Connection type ${input.connectionType} is not a known type of connection`)
                    }
                } return true
            }
        } return false
    }

    // Guard to check if the passed action is a valid disconnect call
    function isValidDisconnect(action: Action): action is DisconnectAction{
        if (arrayIsEqual(Object.keys(input), ["function", "target", "namespace", "connectionType"])){
            if (input.function == "disconnect"){
                if (typeof input.target == "string" && typeof input.namespace == "string" && typeof input.connectionType == "string"){
                    if (!(state.namespaces.includes(input.namespace))){
                        /* @ts-ignore */
                        throw new ContractError(`Namespace ${input.namespace} is not a valid namespace`)
                    } if (!(state.connectionTypes.includes(input.connectionType))){
                        /* @ts-ignore */
                        throw new ContractError(`Connection type ${input.connectionType} is not a known type of connection`)
                    } if (!(Object.keys(state.connections[action.caller]).includes(input.target))){
                        /* @ts-ignore */ 
                        throw new ContractError(`${action.caller} is not connected to ${input.target}`)
                    }
                } return true
            }
        } return false
    }

    // Function that returns the Connection[] array of all connections from the nested objects
    function iterateOverConnections(target: string): Connection[] {
        // Returns all connections of a given target
        return Object.keys(state.connections[target]).flatMap(address => {
            return Object.keys(state.connections[target][address]).flatMap(namespace => {
                return Object.keys(state.connections[target][address][namespace]).flatMap(connectionType => {
                    return {
                    ConnectionType: connectionType,
                    target: address,
                    namespace: namespace,
                    createdAt: state.connections[target][address][namespace][connectionType]["createdAt"],
                    alias: state.connections[target][address][namespace][connectionType]["alias"]
                    }
                })
            })
        })
    }

    function isValidEthAdress(target: string): boolean {
        return target.slice(0, 2) == "0x" && target.length == 42
    }

    async function isValidTarget(target: string): Promise<boolean>{
        /* @ts-ignore */ 
        return Object.keys(state.connections).includes(target) || await SmartWeave.arweave.wallets.getLastTransactionID(target) || isValidEthAdress(target)
    }

    // Check if the passed action is a valid input
        if (isValidAction(action)){
            // If it's a valid connect call, attempt to execute the connect
            if (isValidConnect(action)){
                // Declare all relevant variables
                const caller = action.caller;
                const target = action.input.target;
                const namespace = action.input.namespace;
                const connectionType = action.input.connectionType;
                const alias = typeof action.input.alias == "string" ? action.input.alias : null
                /* @ts-ignore */
                // If the address to connect to has no transactions, it might not be a real address
                if (!(await isValidTarget(target))){
                    /* @ts-ignore */ 
                    throw new ContractError(`Address ${target} does not appear to have had any transactions`)
                } // If the target has already been connected to in this namespace and this connection type, but the alias is different, overwrite the connection
                if (state.connections[caller]){
                    if (state.connections[caller][target]){
                        if (state.connections[caller][target][namespace]){
                            if (state.connections[caller][target][namespace][connectionType]){
                                if (alias != state.connections[caller][target][namespace][connectionType]["alias"]){
                                    state.connections[caller][target][namespace][connectionType] = { 
                                        "createdAt": Date.now(),
                                        "alias": alias
                                        }
                                } else {
                                    /* @ts-ignore */
                                    // If the target has already been connected to in this namespace with this connection type and this alias, reject the call 
                                    throw new ContractError(`${caller} is already connected to ${target} on ${namespace} with connection type ${connectionType}${alias ? "as" + alias : ""}`)
                                    }
                            } else {
                                state.connections[caller][target][namespace][connectionType] = { 
                                    "createdAt": Date.now(),
                                    "alias": alias
                                    }
                                }
                        } else {
                            state.connections[caller][target][namespace] = {
                                [connectionType]: { 
                                    "createdAt": Date.now(),
                                    "alias": alias
                                    }
                                }
                            }
                    } else {
                        state.connections[caller][target] = {
                            [namespace]: {
                                [connectionType]: {
                                    "createdAt": Date.now(),
                                    "alias": alias
                                }
                            }
                        }
                    }
                } else {
                    state.connections[caller] = {
                        [target]: {
                            [namespace]: {
                                [connectionType]: {
                                    "createdAt": Date.now(),
                                    "alias": alias
                                }
                            }
                        }
                    }
                }
                return { state }
                
            // If it's a valid disconnect call, execute the disconnect
            } if (isValidDisconnect(action)){
                const caller = action.caller;
                const target = action.input.target
                const namespace = action.input.namespace
                const connectionType = action.input.connectionType
                if (target){
                    if (namespace){
                        if (connectionType){
                            delete state.connections[caller][target][namespace][connectionType]
                            if (state.connections[caller][target][namespace] == {}){
                                delete state.connections[caller][target][namespace]
                                }
                        } else {
                            delete state.connections[caller][target][namespace]
                        } if (state.connections[caller][target] == {}){
                            delete state.connections[caller][target]        
                            }
                    } else {
                        delete state.connections[caller][target]
                    } if (state.connections[caller] == {}){
                        delete state.connections[caller]
                        }
                } else {
                    delete state.connections[caller]
                }
                return { state }
                
            // If it's a valid lookup call, execute the lookup
            } if (isValidLookup(action)){
                const target = action.input.target
                if (target) {
                    // If there's a target, return this address' connections
                    const connections = {[target]: iterateOverConnections(target)}
                    return { result: connections }
                } else {
                    // If no target is passed, return all connections
                    return { result: Object.fromEntries(Object.keys(state.connections).map(target => [target, iterateOverConnections(target)])) }
                }
            }
    }
    /* @ts-ignore */
    throw new ContractError(`Action ${action} is not valid`)
}