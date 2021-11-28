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

// Action can be either a follow, an unfollow, a followers lookup or followings lookup call
type Action = FollowAction | UnfollowAction | FollowersAction | FollowingsAction

// Declares the follow action's type
type FollowAction = {
    caller: string,
    input: {
        function: "follow",
        target: string,
        namespace: string,
        connectionType: string,
        alias?: string
    }
}

// Declares the unfollow action's type
type UnfollowAction = {
    caller: string,
    input: {
        function: "unfollow",
        target?: string,
        namespace?: string,
        connectionType?: string,
    }
}

// Declares the followers action's type
type FollowersAction = {
    caller: string,
    input: {
        function: "followers",
        target?: string
    }
}

// Declares the followings action's type
type FollowingsAction = {
    caller: string,
    input: {
        function: "followings",
        target?: string
    }
}

// Declares the `return` parameter type for an address' followings
type FollowingConnection = {
    ConnectionType: string,
    target: string,
    namespace: string,
    createdAt: Number,
    alias: string | null
}

// Declares the `return` parameter type for an address' followers
type FollowerConnection = {
    ConnectionType: string,
    origin: string,
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
        return isValidUnfollow(action) || isValidFollow(action) || isValidFollowings(action) || isValidFollowers(action)
    }

    // Guard to check if the passed action is a valid follow call
    function isValidFollow(action: Action): action is FollowAction{
        if (arrayIsEqual(Object.keys(input), ["function", "target", "namespace", "connectionType"]) || arrayIsEqual(Object.keys(input), ["function", "target", "namespace", "connectionType", "alias"])){
            if (input.function == "follow"){
                if (typeof input.target == "string" && typeof input.namespace == "string" && typeof input.connectionType == "string"){
                    if (input.target == action.caller){
                        /* @ts-ignore */
                        throw new ContractError("Can't follow own address")
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

    // Guard to check if the passed action is a valid unfollow call
    function isValidUnfollow(action: Action): action is UnfollowAction{
        if (arrayIsEqual(Object.keys(input), ["function", "target", "namespace", "connectionType"])){
            if (input.function == "unfollow"){
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

    // Guard to check if the passed action is a valid followings call
    function isValidFollowings(action: Action): action is FollowingsAction{
        if (arrayIsEqual(Object.keys(input), ["function"]) || arrayIsEqual(Object.keys(input), ["function", "target"])){
            if (input.function == "followings"){
                if (input.target && !(Object.keys(state.connections).includes(input.target))){
                    /* @ts-ignore */
                    throw new ContractError(`${target} is not following any address`)
                } return true
            }
        } return false
    }

    // Guard to check if the passed action is a valid followers call
    function isValidFollowers(action: Action): action is FollowersAction{
        if (arrayIsEqual(Object.keys(input), ["function"]) || arrayIsEqual(Object.keys(input), ["function", "target"])){
            if (input.function == "followers"){
                if (input.target && !(Object.keys(state.connections).flatMap(address => Object.keys(state.connections[address])).includes(input.target))){
                    /* @ts-ignore */
                    throw new ContractError(`${target} does not have any followers`)
                } return true
            }
        } return false
    }

    // Function that returns the FollowingConnection[] array of all connections from the nested objects, keyed by the follower
    function getFollowings(target: string): FollowingConnection[] {
        // Returns all addresses the target is following
        return Object.keys(state.connections[target]).flatMap(following => {
            return Object.keys(state.connections[target][following]).flatMap(namespace => {
                return Object.keys(state.connections[target][following][namespace]).flatMap(connectionType => {
                    return {
                    ConnectionType: connectionType,
                    target: following,
                    namespace: namespace,
                    createdAt: state.connections[target][following][namespace][connectionType]["createdAt"],
                    alias: state.connections[target][following][namespace][connectionType]["alias"]
                    }
                })
            })
        })
    }

    // Function that returns the FollowerConnection[] array of all connections from the nested objects, keyed by the followed address
    function getFollowers(target: string): FollowerConnection[] {
        // Returns all addresses the target is followed by
        return Object.keys(state.connections).flatMap(address => {
            return Object.keys(state.connections[address]).flatMap(following => {
                if (following == target){
                    return Object.keys(state.connections[address][following]).flatMap(namespace => {
                        return Object.keys(state.connections[address][following][namespace]).flatMap(connectionType => {
                            return {
                            ConnectionType: connectionType,
                            origin: address,
                            namespace: namespace,
                            createdAt: state.connections[address][following][namespace][connectionType]["createdAt"],
                            alias: state.connections[address][following][namespace][connectionType]["alias"]
                            }
                        })
                    })
                } else {
                    return []
                }
            })
        })
    }

    // Primitive check to ensure a given target matches the Ethereum address specification
    function isValidEthAdress(target: string): boolean {
        return target.slice(0, 2) == "0x" && target.length == 42
    }

    // Checks if a passed target is a valid address
    async function isValidTarget(target: string): Promise<boolean>{
        /* @ts-ignore */ 
        return Object.keys(state.connections).includes(target) || await SmartWeave.arweave.wallets.getLastTransactionID(target) || isValidEthAdress(target)
    }

    // Check if the passed action is a valid input
    if (isValidAction(action)){
        // If it's a valid follow call, attempt to execute the follow
        if (isValidFollow(action)){
            // Declare all relevant variables
            const caller = action.caller;
            const target = action.input.target;
            const namespace = action.input.namespace;
            const connectionType = action.input.connectionType;
            const alias = typeof action.input.alias == "string" ? action.input.alias : null
            /* @ts-ignore */
            // Ensure the target is a valid address
            if (!(await isValidTarget(target))){
                /* @ts-ignore */ 
                throw new ContractError(`Address ${target} is not a valid address`)
            } // If the target has already been connected to in this namespace and this connection type, but the alias is different, overwrite the connection
            if (state.connections[caller]){
                if (state.connections[caller][target]){
                    if (state.connections[caller][target][namespace]){
                        if (state.connections[caller][target][namespace][connectionType]){
                            if (alias != state.connections[caller][target][namespace][connectionType]["alias"]){
                                state.connections[caller][target][namespace][connectionType] = { 
                                    /* @ts-ignore */
                                    "createdAt": SmartWeave.block.timestamp,
                                    "alias": alias
                                    }
                            } else {
                                /* @ts-ignore */
                                // If the target has already been connected to in this namespace with this connection type and this alias, reject the call 
                                throw new ContractError(`${caller} is already connected to ${target} on ${namespace} with connection type ${connectionType}${alias ? "as" + alias : ""}`)
                                }
                        } else {
                            state.connections[caller][target][namespace][connectionType] = { 
                                /* @ts-ignore */
                                "createdAt": SmartWeave.block.timestamp,
                                "alias": alias
                                }
                            }
                    } else {
                        state.connections[caller][target][namespace] = {
                            [connectionType]: { 
                                /* @ts-ignore */
                                "createdAt": SmartWeave.block.timestamp,
                                "alias": alias
                                }
                            }
                        }
                } else {
                    state.connections[caller][target] = {
                        [namespace]: {
                            [connectionType]: {
                                /* @ts-ignore */
                                "createdAt": SmartWeave.block.timestamp,
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
                                /* @ts-ignore */
                                "createdAt": SmartWeave.block.timestamp,
                                "alias": alias
                            }
                        }
                    }
                }
            }
            return { state }
        }    
        // If it's a valid disconnect call, execute the disconnect
        if (isValidUnfollow(action)){
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
        }    
        // If it's a valid followings call, get all followings
        if (isValidFollowings(action)){
            const target = action.input.target
            if (target) {
                // If there's a target, return this address' followings
                const followings = {[target]: getFollowings(target)}
                return { result: followings }
            } else {
                // If no target is passed, return all followings
                return { result: Object.fromEntries(Object.keys(state.connections).map(target => [target, getFollowings(target)])) }
            }
        }
        // If it's a valid followers call, get all followers
        if (isValidFollowers(action)){
            const target = action.input.target
            if (target) {
                // If there's a target, return this address' followers
                const followers = {[target]: getFollowers(target)}
                return {result: followers}
            } else {
                // If no target is passed, return all followers
                const alreadyDone: string[] = []
                return {
                    result: Object.fromEntries(Object.keys(state.connections).flatMap(address => {
                        return Object.keys(state.connections[address]).map(target => {
                            if (alreadyDone.includes(target)){
                                return ["", []];
                            } else {
                                alreadyDone.push(target)
                                return [target, getFollowers(target)]
                            }
                        })
                    }))
                }
            }
        }
    }
    /* @ts-ignore */
    throw new ContractError(`Action ${action} is not valid`)
}